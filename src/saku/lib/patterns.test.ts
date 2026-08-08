import { describe, expect, it } from 'vitest'
import type { DayStatusRecord, EventRecord } from './types'
import { DEFAULT_DIFF_SETTINGS } from './types'
import {
  buildStoreHistoryIndex,
  detectAnomaliesForDay,
  evidenceText,
  previousOccurrences,
  summarizeRegularPatterns,
} from './patterns'

const STORE = 'maruhan-saku'

const makeEvent = (date: string, name: string, overrides: Partial<EventRecord> = {}): EventRecord => ({
  id: `ev_${date}_${name}`,
  storeId: STORE,
  date,
  name,
  category: '取材',
  status: 'active',
  sources: [],
  firstSeenAt: `${date}T10:00:00+09:00`,
  lastSeenAt: `${date}T10:00:00+09:00`,
  createdAt: `${date}T10:00:00+09:00`,
  updatedAt: `${date}T10:00:00+09:00`,
  changes: [],
  ...overrides,
})

const makeNoEvent = (date: string): DayStatusRecord => ({
  storeId: STORE,
  date,
  status: 'confirmed_no_event',
  checkedAt: `${date}T23:00:00+09:00`,
})

describe('previousOccurrences', () => {
  it('日付パターン: 前月以前の同日を新しい順に返す', () => {
    expect(previousOccurrences('2026-08-08', 'dayOfMonth', 3)).toEqual([
      '2026-07-08',
      '2026-06-08',
      '2026-05-08',
    ])
  })

  it('日付パターン: 存在しない日(2/31など)はスキップする', () => {
    expect(previousOccurrences('2026-05-31', 'dayOfMonth', 3)).toEqual([
      '2026-03-31',
      '2026-01-31',
      '2025-12-31',
    ])
  })

  it('曜日パターン: 7日ずつ遡る', () => {
    expect(previousOccurrences('2026-08-08', 'weekday', 2)).toEqual(['2026-08-01', '2026-07-25'])
  })
})

describe('detectAnomaliesForDay: 普段あるものがない', () => {
  // 過去6回の8日のうち5回「特日取材」、今回(8/8)はイベントなし確認済み
  const events = ['2026-02-08', '2026-03-08', '2026-04-08', '2026-06-08', '2026-07-08'].map((d) =>
    makeEvent(d, '特日取材'),
  )
  const noEvents = [makeNoEvent('2026-05-08'), makeNoEvent('2026-08-08')]

  it('過去6回中5回のイベントが今回ないと missing_regular を返す', () => {
    const index = buildStoreHistoryIndex(STORE, events, noEvents)
    const anomalies = detectAnomaliesForDay(index, STORE, '2026-08-08', DEFAULT_DIFF_SETTINGS)
    expect(anomalies).toHaveLength(1)
    const a = anomalies[0]
    expect(a.kind).toBe('missing_regular')
    expect(a.eventName).toBe('特日取材')
    expect(a.evidence.sampleDates).toHaveLength(6)
    expect(a.evidence.hitDates).toHaveLength(5)
    expect(a.currentStatus).toBe('not_held')
    expect(evidenceText(a)).toBe('8日の特日取材 過去6回中5回開催 今回：開催なし')
  })

  it('今回の情報がない日は「情報なし」として返す', () => {
    const index = buildStoreHistoryIndex(STORE, events, [makeNoEvent('2026-05-08')])
    const anomalies = detectAnomaliesForDay(index, STORE, '2026-08-08', DEFAULT_DIFF_SETTINGS)
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0].currentStatus).toBe('no_info')
    expect(evidenceText(anomalies[0])).toContain('今回：情報なし')
  })

  it('イベントが予定通り入っていれば差分なし', () => {
    const index = buildStoreHistoryIndex(
      STORE,
      [...events, makeEvent('2026-08-08', '特日取材')],
      [makeNoEvent('2026-05-08')],
    )
    const anomalies = detectAnomaliesForDay(index, STORE, '2026-08-08', DEFAULT_DIFF_SETTINGS)
    expect(anomalies).toHaveLength(0)
  })

  it('実績が minSamples 未満なら差分判定しない', () => {
    // 情報がある8日が4回しかない
    const few = ['2026-04-08', '2026-06-08', '2026-07-08'].map((d) => makeEvent(d, '特日取材'))
    const index = buildStoreHistoryIndex(STORE, few, [makeNoEvent('2026-05-08'), makeNoEvent('2026-08-08')])
    const anomalies = detectAnomaliesForDay(index, STORE, '2026-08-08', DEFAULT_DIFF_SETTINGS)
    expect(anomalies).toHaveLength(0)
  })

  it('閾値は設定で変更できる', () => {
    const few = ['2026-05-08', '2026-06-08', '2026-07-08'].map((d) => makeEvent(d, '特日取材'))
    const index = buildStoreHistoryIndex(STORE, few, [makeNoEvent('2026-08-08')])
    const settings = { ...DEFAULT_DIFF_SETTINGS, lookbackCount: 3, minSamples: 3 }
    const anomalies = detectAnomaliesForDay(index, STORE, '2026-08-08', settings)
    expect(anomalies).toHaveLength(1)
    expect(anomalies[0].evidence.hitDates).toHaveLength(3)
  })
})

describe('detectAnomaliesForDay: 普段ないものがある', () => {
  // 過去の11日・火曜日にはイベントなし。今回突然「実戦取材」が入った。
  const noEvents = [
    // 過去6回の11日
    '2026-02-11', '2026-03-11', '2026-04-11', '2026-05-11', '2026-06-11', '2026-07-11',
    // 過去6回の火曜日 (2026-08-11 は火曜)
    '2026-08-04', '2026-07-28', '2026-07-21', '2026-07-14', '2026-07-07', '2026-06-30',
  ].map(makeNoEvent)

  it('過去6回中0回のイベントが入ると new_pattern を返す', () => {
    const target = makeEvent('2026-08-11', 'パチスロ実戦取材', { category: '実践来店' })
    const index = buildStoreHistoryIndex(STORE, [target], noEvents)
    const anomalies = detectAnomaliesForDay(index, STORE, '2026-08-11', DEFAULT_DIFF_SETTINGS)
    expect(anomalies).toHaveLength(1)
    const a = anomalies[0]
    expect(a.kind).toBe('new_pattern')
    expect(a.eventName).toBe('パチスロ実戦取材')
    expect(a.eventId).toBe(target.id)
    expect(a.currentStatus).toBe('held')
    expect(a.firstTimeAtStore).toBe(true)
    expect(a.evidence.hitDates).toHaveLength(0)
    expect(a.evidence.sampleDates).toHaveLength(6)
  })

  it('曜日パターンとして通常のイベントは日付側が0回でも new_pattern としない', () => {
    // 毎週土曜に開催してきたイベント。2026-08-08(土)は日付(8日)としては初でも新規パターンではない。
    const saturdays = ['2026-08-01', '2026-07-25', '2026-07-18', '2026-07-11', '2026-07-04', '2026-06-27']
    const events = saturdays.map((d) => makeEvent(d, '土曜スロフェス', { category: '店舗独自' }))
    const dayNoEvents = ['2026-02-08', '2026-03-08', '2026-04-08', '2026-05-08', '2026-06-08', '2026-07-08'].map(
      makeNoEvent,
    )
    const target = makeEvent('2026-08-08', '土曜スロフェス', { category: '店舗独自' })
    const index = buildStoreHistoryIndex(STORE, [...events, target], dayNoEvents)
    const anomalies = detectAnomaliesForDay(index, STORE, '2026-08-08', DEFAULT_DIFF_SETTINGS)
    expect(anomalies.filter((a) => a.kind === 'new_pattern')).toHaveLength(0)
  })
})

describe('summarizeRegularPatterns', () => {
  it('店舗の通常パターンを数値付きで返す', () => {
    const events = ['2026-02-08', '2026-03-08', '2026-04-08', '2026-06-08', '2026-07-08'].map((d) =>
      makeEvent(d, '特日取材'),
    )
    const index = buildStoreHistoryIndex(STORE, events, [makeNoEvent('2026-05-08')])
    const patterns = summarizeRegularPatterns(index, STORE, '2026-08-08', DEFAULT_DIFF_SETTINGS)
    const dayPattern = patterns.find((p) => p.kind === 'dayOfMonth' && p.label === '8日')
    expect(dayPattern).toBeDefined()
    expect(dayPattern!.eventName).toBe('特日取材')
    expect(dayPattern!.hits).toBe(5)
    expect(dayPattern!.samples).toBe(6)
  })
})
