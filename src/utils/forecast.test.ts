import { describe, expect, it } from 'vitest'
import type { ActualResult, CompetitorEvent, OwnPromotionDay } from '../types'
import { addDays, parseISODate, toISODate } from './date'
import {
  buildFeatureContext,
  buildFeatureVector,
  DEFAULT_FORECAST_SETTINGS,
  FEATURE_SPECS,
  predictDay,
  trainForecastModel,
} from './forecast'

const featureIndex = (key: string) => FEATURE_SPECS.findIndex((s) => s.key === key)

const emptyCtx = buildFeatureContext([], [], DEFAULT_FORECAST_SETTINGS)

const makeEvent = (date: string): CompetitorEvent => ({
  id: date,
  storeName: 'テスト店',
  prefecture: '長野県',
  area: '長野市',
  date,
  timeSlot: '終日',
  eventType: '取材来店',
  memo: '',
  createdAt: '',
  updatedAt: '',
})

const makePromo = (date: string): OwnPromotionDay => ({
  id: date,
  title: '販促',
  date,
  memo: '',
  createdAt: '',
})

describe('buildFeatureVector', () => {
  it('曜日を月曜基準のone-hotで表現する', () => {
    // 2026-07-04は土曜
    const sat = buildFeatureVector('2026-07-04', emptyCtx)
    expect(sat[featureIndex('dow_sat')]).toBe(1)
    expect(sat[featureIndex('dow_sun')]).toBe(0)

    // 2026-07-06は月曜（基準なので全曜日フラグが0）
    const mon = buildFeatureVector('2026-07-06', emptyCtx)
    for (const key of ['dow_tue', 'dow_wed', 'dow_thu', 'dow_fri', 'dow_sat', 'dow_sun']) {
      expect(mon[featureIndex(key)]).toBe(0)
    }
  })

  it('給料日と年金支給日を判定する', () => {
    expect(buildFeatureVector('2026-07-25', emptyCtx)[featureIndex('is_payday')]).toBe(1)
    expect(buildFeatureVector('2026-07-24', emptyCtx)[featureIndex('is_payday')]).toBe(0)
    // 偶数月15日のみ年金支給日
    expect(buildFeatureVector('2026-08-15', emptyCtx)[featureIndex('is_pension_day')]).toBe(1)
    expect(buildFeatureVector('2026-07-15', emptyCtx)[featureIndex('is_pension_day')]).toBe(0)
  })

  it('自社販促と競合イベントの件数を数える', () => {
    const ctx = buildFeatureContext(
      [makeEvent('2026-07-10'), makeEvent('2026-07-10')],
      [makePromo('2026-07-10')],
      DEFAULT_FORECAST_SETTINGS,
    )
    const vec = buildFeatureVector('2026-07-10', ctx)
    expect(vec[featureIndex('competitor_count')]).toBe(2)
    expect(vec[featureIndex('own_promo_count')]).toBe(1)
  })
})

describe('trainForecastModel / predictDay', () => {
  it('データ不足時はnullを返す', () => {
    const few: ActualResult[] = [{ date: '2026-06-01', visitors: 100 }]
    expect(trainForecastModel(few, emptyCtx)).toBeNull()
  })

  it('既知のパターン（基準100 / 土曜+30 / 競合-10）を学習して再現する', () => {
    // 2026-06-01(月)から60日分の合成データを作る
    const events: CompetitorEvent[] = []
    const actuals: ActualResult[] = []
    const start = parseISODate('2026-06-01')
    for (let i = 0; i < 60; i++) {
      const date = toISODate(addDays(start, i))
      let visitors = 100
      const dow = addDays(start, i).getDay()
      if (dow === 6) visitors += 30
      if (i % 7 === 3) {
        events.push(makeEvent(date))
        visitors -= 10
      }
      actuals.push({ date, visitors })
    }
    const ctx = buildFeatureContext(events, [], DEFAULT_FORECAST_SETTINGS)
    const model = trainForecastModel(actuals, ctx)
    expect(model).not.toBeNull()
    if (!model) return

    expect(model.trainCount).toBe(60)
    expect(model.maeCV).not.toBeNull()

    // 学習期間外の土曜（競合なし）: 100 + 30 = 130前後
    const sat = predictDay(model, '2026-08-08', ctx)
    expect(sat.predicted).toBeGreaterThan(120)
    expect(sat.predicted).toBeLessThan(140)

    // 学習期間外の月曜（競合なし）: 100前後
    const mon = predictDay(model, '2026-08-10', ctx)
    expect(mon.predicted).toBeGreaterThan(92)
    expect(mon.predicted).toBeLessThan(108)

    // 土曜の根拠に「土曜」がプラス寄与で含まれる
    const satReason = sat.contributions.find((c) => c.label === '土曜')
    expect(satReason).toBeDefined()
    expect(satReason!.value).toBeGreaterThan(15)
  })

  it('競合イベント日の予測が下がり、根拠に競合が含まれる', () => {
    const actuals: ActualResult[] = []
    const events: CompetitorEvent[] = []
    const start = parseISODate('2026-06-01')
    for (let i = 0; i < 60; i++) {
      const date = toISODate(addDays(start, i))
      const hasEvent = i % 5 === 0
      if (hasEvent) events.push(makeEvent(date))
      actuals.push({ date, visitors: hasEvent ? 85 : 100 })
    }
    // 未来の競合イベントを追加
    events.push(makeEvent('2026-08-10'))
    const ctx = buildFeatureContext(events, [], DEFAULT_FORECAST_SETTINGS)
    const model = trainForecastModel(actuals, ctx)
    expect(model).not.toBeNull()
    if (!model) return

    const withEvent = predictDay(model, '2026-08-10', ctx) // 月曜・競合あり
    const without = predictDay(model, '2026-08-17', ctx) // 月曜・競合なし
    expect(withEvent.predicted).toBeLessThan(without.predicted - 5)
    expect(withEvent.contributions.some((c) => c.label === '競合イベント' && c.value < 0)).toBe(true)
  })

  it('予測値は0未満にならない', () => {
    const actuals: ActualResult[] = []
    const start = parseISODate('2026-06-01')
    for (let i = 0; i < 20; i++) {
      actuals.push({ date: toISODate(addDays(start, i)), visitors: 1 })
    }
    // 競合イベントを大量に持つ未来日でも0でクランプされる
    const events = Array.from({ length: 30 }, () => makeEvent('2026-08-10'))
    const ctx = buildFeatureContext(events, [], DEFAULT_FORECAST_SETTINGS)
    const model = trainForecastModel(actuals, ctx)
    if (!model) return
    expect(predictDay(model, '2026-08-10', ctx).predicted).toBeGreaterThanOrEqual(0)
  })
})
