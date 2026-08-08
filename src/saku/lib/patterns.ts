/**
 * 通常パターン集計と差分検知。
 *
 * AIによる予測ではなく、過去実績の機械的な集計。
 * - 日付パターン（毎月N日）と曜日パターン（毎週X曜日）を対象に、
 *   直近 lookbackCount 回の「情報がある」同条件日を標本として使う。
 * - 標本数が minSamples 未満なら通常パターンと判定しない（初期値6、設定変更可）。
 * - 出現率 >= expectedMinRatio のイベントが今回ない → missing_regular（⚠ 通常は○○）
 * - 出現率 <= newPatternMaxRatio のイベントが今回ある → new_pattern（⚠ 新規パターン）
 * - 根拠は必ず「過去N回中M回」の数値で保持する。
 */
import type {
  DayStatusRecord,
  DiffSettings,
  EventCategory,
  EventRecord,
} from './types'
import { dayStatusKey, normalizeEventName } from './normalize'

export type PatternKind = 'dayOfMonth' | 'weekday'

export interface PatternEvidence {
  kind: PatternKind
  /** 例: 「8日」「土曜日」 */
  label: string
  /** 標本になった過去の日付（新しい順） */
  sampleDates: string[]
  /** そのうちイベントがあった日付 */
  hitDates: string[]
}

export type AnomalyCurrentStatus = 'held' | 'not_held' | 'no_info'

export interface Anomaly {
  kind: 'missing_regular' | 'new_pattern'
  storeId: string
  date: string
  eventName: string
  category?: EventCategory
  evidence: PatternEvidence
  /** 今回の状態: held=開催 / not_held=開催なし(確認済) / no_info=情報なし */
  currentStatus: AnomalyCurrentStatus
  /** new_pattern の対象イベントID */
  eventId?: string
  /** この店舗で名称の過去実績が一度もない場合 true（new_pattern 用の補足） */
  firstTimeAtStore?: boolean
}

export interface RegularPattern {
  storeId: string
  kind: PatternKind
  label: string
  eventName: string
  category?: EventCategory
  hits: number
  samples: number
}

const WEEKDAY_LABELS = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日']

const pad2 = (n: number) => String(n).padStart(2, '0')
const toISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const fromISO = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const patternLabel = (kind: PatternKind, date: string): string => {
  const d = fromISO(date)
  return kind === 'dayOfMonth' ? `${d.getDate()}日` : WEEKDAY_LABELS[d.getDay()]
}

/** 同条件（同じ「N日」または同じ曜日）の過去日付を新しい順に列挙する。 */
export const previousOccurrences = (
  date: string,
  kind: PatternKind,
  maxCount: number,
): string[] => {
  const base = fromISO(date)
  const result: string[] = []
  if (kind === 'weekday') {
    const cursor = new Date(base)
    while (result.length < maxCount) {
      cursor.setDate(cursor.getDate() - 7)
      result.push(toISO(cursor))
    }
  } else {
    const day = base.getDate()
    let year = base.getFullYear()
    let month = base.getMonth()
    let guard = 0
    while (result.length < maxCount && guard < maxCount * 3 + 12) {
      guard++
      month--
      if (month < 0) {
        month = 11
        year--
      }
      const candidate = new Date(year, month, day)
      // 2/30 のように存在しない日はスキップ
      if (candidate.getMonth() !== month) continue
      result.push(toISO(candidate))
    }
  }
  return result
}

/** 店舗ごとの実績インデックス */
export interface StoreHistoryIndex {
  /** date -> その日のアクティブイベント（正規化名 -> レコード） */
  eventsByDate: Map<string, Map<string, EventRecord>>
  /** date -> confirmed_no_event 記録 */
  noEventByDate: Map<string, DayStatusRecord>
  /** 正規化名 -> 過去に1回でも実績があるか */
  knownNames: Set<string>
}

export const buildStoreHistoryIndex = (
  storeId: string,
  events: EventRecord[],
  dayStatuses: DayStatusRecord[],
): StoreHistoryIndex => {
  const eventsByDate = new Map<string, Map<string, EventRecord>>()
  const knownNames = new Set<string>()
  for (const e of events) {
    if (e.storeId !== storeId || e.status !== 'active') continue
    let byName = eventsByDate.get(e.date)
    if (!byName) {
      byName = new Map()
      eventsByDate.set(e.date, byName)
    }
    byName.set(normalizeEventName(e.name), e)
    knownNames.add(normalizeEventName(e.name))
  }
  const noEventByDate = new Map<string, DayStatusRecord>()
  for (const d of dayStatuses) {
    if (d.storeId !== storeId) continue
    noEventByDate.set(d.date, d)
  }
  return { eventsByDate, noEventByDate, knownNames }
}

const isKnownDate = (index: StoreHistoryIndex, date: string): boolean =>
  index.eventsByDate.has(date) || index.noEventByDate.has(date)

/**
 * 対象日について、同条件の「情報がある」過去日を新しい順に lookbackCount 件集める。
 * 探索は lookbackCount の4倍（曜日なら約半年、日付なら約2年）まで。
 */
const collectSamples = (
  index: StoreHistoryIndex,
  date: string,
  kind: PatternKind,
  settings: DiffSettings,
): string[] => {
  const candidates = previousOccurrences(date, kind, settings.lookbackCount * 4)
  const samples: string[] = []
  for (const c of candidates) {
    if (isKnownDate(index, c)) {
      samples.push(c)
      if (samples.length >= settings.lookbackCount) break
    }
  }
  return samples
}

interface NameStat {
  name: string
  category?: EventCategory
  hitDates: string[]
}

const collectNameStats = (index: StoreHistoryIndex, sampleDates: string[]): Map<string, NameStat> => {
  const stats = new Map<string, NameStat>()
  for (const d of sampleDates) {
    const byName = index.eventsByDate.get(d)
    if (!byName) continue
    for (const [norm, record] of byName) {
      let stat = stats.get(norm)
      if (!stat) {
        stat = { name: record.name, category: record.category, hitDates: [] }
        stats.set(norm, stat)
      }
      stat.hitDates.push(d)
    }
  }
  return stats
}

/**
 * 対象月の1店舗×1日について差分を検知する。
 */
export const detectAnomaliesForDay = (
  index: StoreHistoryIndex,
  storeId: string,
  date: string,
  settings: DiffSettings,
): Anomaly[] => {
  const anomalies: Anomaly[] = []
  const todaysEvents = index.eventsByDate.get(date) ?? new Map<string, EventRecord>()
  const dayKnown = todaysEvents.size > 0 || index.noEventByDate.has(date)

  const kinds: PatternKind[] = ['dayOfMonth', 'weekday']
  const slotSamples = new Map<PatternKind, string[]>()
  for (const kind of kinds) {
    slotSamples.set(kind, collectSamples(index, date, kind, settings))
  }

  // ── 普段あるものがない ──
  const missingByName = new Map<string, Anomaly>()
  for (const kind of kinds) {
    const samples = slotSamples.get(kind)!
    if (samples.length < settings.minSamples) continue
    const stats = collectNameStats(index, samples)
    for (const [norm, stat] of stats) {
      const ratio = stat.hitDates.length / samples.length
      if (ratio < settings.expectedMinRatio) continue
      if (todaysEvents.has(norm)) continue
      const anomaly: Anomaly = {
        kind: 'missing_regular',
        storeId,
        date,
        eventName: stat.name,
        category: stat.category,
        evidence: {
          kind,
          label: patternLabel(kind, date),
          sampleDates: samples,
          hitDates: stat.hitDates,
        },
        currentStatus: dayKnown ? 'not_held' : 'no_info',
      }
      const prev = missingByName.get(norm)
      const prevRatio = prev ? prev.evidence.hitDates.length / prev.evidence.sampleDates.length : -1
      if (!prev || ratio > prevRatio) missingByName.set(norm, anomaly)
    }
  }
  anomalies.push(...missingByName.values())

  // ── 普段ないものがある ──
  for (const [norm, record] of todaysEvents) {
    let sufficientSlots = 0
    let rareInAll = true
    let bestEvidence: PatternEvidence | null = null
    let bestHits = Infinity
    for (const kind of kinds) {
      const samples = slotSamples.get(kind)!
      if (samples.length < settings.minSamples) continue
      sufficientSlots++
      const stats = collectNameStats(index, samples)
      const hitDates = stats.get(norm)?.hitDates ?? []
      const ratio = hitDates.length / samples.length
      if (ratio > settings.newPatternMaxRatio) {
        rareInAll = false
        break
      }
      if (hitDates.length < bestHits) {
        bestHits = hitDates.length
        bestEvidence = {
          kind,
          label: patternLabel(kind, date),
          sampleDates: samples,
          hitDates,
        }
      }
    }
    if (sufficientSlots > 0 && rareInAll && bestEvidence) {
      anomalies.push({
        kind: 'new_pattern',
        storeId,
        date,
        eventName: record.name,
        category: record.category,
        evidence: bestEvidence,
        currentStatus: 'held',
        eventId: record.id,
        firstTimeAtStore: !wasSeenBefore(index, norm, date),
      })
    }
  }

  return anomalies
}

const wasSeenBefore = (index: StoreHistoryIndex, normName: string, before: string): boolean => {
  for (const [date, byName] of index.eventsByDate) {
    if (date < before && byName.has(normName)) return true
  }
  return false
}

/**
 * 店舗の「通常パターン」一覧（差分検知と同じ基準の集計を、基準日から見て算出）。
 */
export const summarizeRegularPatterns = (
  index: StoreHistoryIndex,
  storeId: string,
  anchorDate: string,
  settings: DiffSettings,
): RegularPattern[] => {
  const results: RegularPattern[] = []
  const seen = new Set<string>()

  const anchor = fromISO(anchorDate)

  // 日付パターン: 1〜31日（基準月の各日を代表日として使う）
  for (let day = 1; day <= 31; day++) {
    const rep = new Date(anchor.getFullYear(), anchor.getMonth(), day)
    if (rep.getMonth() !== anchor.getMonth()) continue
    collectPatternsForSlot(index, storeId, toISO(rep), 'dayOfMonth', settings, results, seen)
  }
  // 曜日パターン: 直近7日を代表日として使う
  for (let offset = 0; offset < 7; offset++) {
    const rep = new Date(anchor)
    rep.setDate(rep.getDate() - offset)
    collectPatternsForSlot(index, storeId, toISO(rep), 'weekday', settings, results, seen)
  }

  return results.sort((a, b) => b.hits / b.samples - a.hits / a.samples || b.hits - a.hits)
}

const collectPatternsForSlot = (
  index: StoreHistoryIndex,
  storeId: string,
  repDate: string,
  kind: PatternKind,
  settings: DiffSettings,
  results: RegularPattern[],
  seen: Set<string>,
): void => {
  const samples = collectSamples(index, repDate, kind, settings)
  if (samples.length < settings.minSamples) return
  const stats = collectNameStats(index, samples)
  const label = patternLabel(kind, repDate)
  for (const [norm, stat] of stats) {
    const ratio = stat.hitDates.length / samples.length
    if (ratio < settings.expectedMinRatio) continue
    const dedupeKey = `${kind}|${label}|${norm}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)
    results.push({
      storeId,
      kind,
      label,
      eventName: stat.name,
      category: stat.category,
      hits: stat.hitDates.length,
      samples: samples.length,
    })
  }
}

/** 根拠の定型文: 「8日の○○取材 過去6回中5回」 */
export const evidenceText = (a: Anomaly): string => {
  const { label, sampleDates, hitDates } = a.evidence
  const current =
    a.currentStatus === 'held' ? '今回：開催' : a.currentStatus === 'not_held' ? '今回：開催なし' : '今回：情報なし'
  return `${label}の${a.eventName} 過去${sampleDates.length}回中${hitDates.length}回開催 ${current}`
}

export { dayStatusKey }
