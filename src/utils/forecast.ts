import type { ActualResult, CompetitorEvent, ForecastSettings, OwnPromotionDay } from '../types'
import { parseISODate } from './date'
import { isJapaneseHoliday } from './jpHoliday'

/**
 * 稼働予測エンジン
 * =================
 * 3軸の特徴量から日別の来店数を予測する。
 *   軸1: 自社販促日（カレンダーに登録済みの販促日数）
 *   軸2: 競合イベント（カレンダーに登録済みのイベント件数）
 *   軸3: カレンダー（曜日 / 祝日 / 給料日 / 年金支給日）
 *
 * モデルはリッジ回帰（L2正則化つき線形回帰）。データが少ない立ち上げ期でも
 * 安定して学習でき、係数から「土曜は+25人」のような根拠の説明ができる。
 */

export const DEFAULT_FORECAST_SETTINGS: ForecastSettings = {
  paydayDays: [25],
  pensionDays: [15],
  pensionMonths: [2, 4, 6, 8, 10, 12],
}

interface FeatureSpec {
  key: string
  label: string
}

// 曜日は月曜を基準（切片に含まれる）とし、火〜日の差分を係数化する
export const FEATURE_SPECS: FeatureSpec[] = [
  { key: 'dow_tue', label: '火曜' },
  { key: 'dow_wed', label: '水曜' },
  { key: 'dow_thu', label: '木曜' },
  { key: 'dow_fri', label: '金曜' },
  { key: 'dow_sat', label: '土曜' },
  { key: 'dow_sun', label: '日曜' },
  { key: 'is_holiday', label: '祝日' },
  { key: 'is_payday', label: '給料日' },
  { key: 'is_pension_day', label: '年金支給日' },
  { key: 'own_promo_count', label: '自社販促' },
  { key: 'competitor_count', label: '競合イベント' },
]

export interface FeatureContext {
  ownPromoCountByDate: Map<string, number>
  competitorCountByDate: Map<string, number>
  settings: ForecastSettings
}

export const buildFeatureContext = (
  events: CompetitorEvent[],
  ownPromotions: OwnPromotionDay[],
  settings: ForecastSettings,
): FeatureContext => {
  const ownPromoCountByDate = new Map<string, number>()
  for (const promo of ownPromotions) {
    ownPromoCountByDate.set(promo.date, (ownPromoCountByDate.get(promo.date) ?? 0) + 1)
  }
  const competitorCountByDate = new Map<string, number>()
  for (const event of events) {
    competitorCountByDate.set(event.date, (competitorCountByDate.get(event.date) ?? 0) + 1)
  }
  return { ownPromoCountByDate, competitorCountByDate, settings }
}

/** 1日分の特徴量ベクトル（FEATURE_SPECS と同順）を作る */
export const buildFeatureVector = (isoDate: string, ctx: FeatureContext): number[] => {
  const date = parseISODate(isoDate)
  const dow = date.getDay() // 0=日 ... 6=土
  const day = date.getDate()
  const month = date.getMonth() + 1
  const { settings } = ctx

  const isPension =
    settings.pensionDays.includes(day) && settings.pensionMonths.includes(month) ? 1 : 0

  const values: Record<string, number> = {
    dow_tue: dow === 2 ? 1 : 0,
    dow_wed: dow === 3 ? 1 : 0,
    dow_thu: dow === 4 ? 1 : 0,
    dow_fri: dow === 5 ? 1 : 0,
    dow_sat: dow === 6 ? 1 : 0,
    dow_sun: dow === 0 ? 1 : 0,
    is_holiday: isJapaneseHoliday(date) ? 1 : 0,
    is_payday: settings.paydayDays.includes(day) ? 1 : 0,
    is_pension_day: isPension,
    own_promo_count: ctx.ownPromoCountByDate.get(isoDate) ?? 0,
    competitor_count: ctx.competitorCountByDate.get(isoDate) ?? 0,
  }
  return FEATURE_SPECS.map((spec) => values[spec.key])
}

// ----------------------------------------------------------------------
// リッジ回帰（正規方程式 + ガウスの消去法）
// ----------------------------------------------------------------------

/** 連立一次方程式 Aw = b を部分ピボット選択つきガウス消去で解く */
const solveLinearSystem = (A: number[][], b: number[]): number[] | null => {
  const n = A.length
  const M = A.map((row, i) => [...row, b[i]])

  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row
    }
    if (Math.abs(M[pivot][col]) < 1e-10) return null
    ;[M[col], M[pivot]] = [M[pivot], M[col]]

    for (let row = 0; row < n; row++) {
      if (row === col) continue
      const factor = M[row][col] / M[col][col]
      for (let k = col; k <= n; k++) {
        M[row][k] -= factor * M[col][k]
      }
    }
  }
  return M.map((row, i) => row[n] / M[i][i])
}

/**
 * リッジ回帰: (X^T X + λI) w = X^T y を解く。
 * 先頭列は切片として扱い、正則化をかけない。
 */
const fitRidge = (X: number[][], y: number[], lambda: number): number[] | null => {
  const n = X.length
  const p = X[0].length
  const XtX: number[][] = Array.from({ length: p }, () => new Array<number>(p).fill(0))
  const Xty = new Array<number>(p).fill(0)

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      Xty[j] += X[i][j] * y[i]
      for (let k = j; k < p; k++) {
        XtX[j][k] += X[i][j] * X[i][k]
      }
    }
  }
  for (let j = 0; j < p; j++) {
    for (let k = 0; k < j; k++) {
      XtX[j][k] = XtX[k][j]
    }
    if (j > 0) XtX[j][j] += lambda // 切片（j=0）は正則化しない
  }
  return solveLinearSystem(XtX, Xty)
}

// ----------------------------------------------------------------------
// 学習・評価・予測
// ----------------------------------------------------------------------

export const MIN_TRAIN_RECORDS = 14
const RIDGE_LAMBDA = 1.0

export interface TrainedModel {
  /** [切片, ...FEATURE_SPECSと同順の係数] */
  weights: number[]
  trainCount: number
  /** 時系列交差検証のMAE。データ不足時はnull */
  maeCV: number | null
}

const predictRow = (weights: number[], features: number[]): number => {
  let value = weights[0]
  for (let j = 0; j < features.length; j++) {
    value += weights[j + 1] * features[j]
  }
  return value
}

/**
 * 実績データからモデルを学習する。
 * データが MIN_TRAIN_RECORDS 件未満、または解が求まらない場合は null。
 */
export const trainForecastModel = (
  actuals: ActualResult[],
  ctx: FeatureContext,
): TrainedModel | null => {
  const sorted = [...actuals].sort((a, b) => a.date.localeCompare(b.date))
  if (sorted.length < MIN_TRAIN_RECORDS) return null

  const X = sorted.map((r) => [1, ...buildFeatureVector(r.date, ctx)])
  const y = sorted.map((r) => r.visitors)

  const weights = fitRidge(X, y, RIDGE_LAMBDA)
  if (!weights) return null

  // 時系列交差検証: 過去データのみで学習し、その後の期間を予測してMAEを測る
  let maeCV: number | null = null
  if (sorted.length >= 20) {
    const folds = Math.min(4, Math.floor(sorted.length / 10))
    const errors: number[] = []
    for (let f = 1; f <= folds; f++) {
      const testEnd = Math.floor((sorted.length * (folds + f)) / (folds * 2))
      const testStart = Math.floor((sorted.length * (folds + f - 1)) / (folds * 2))
      const w = fitRidge(X.slice(0, testStart), y.slice(0, testStart), RIDGE_LAMBDA)
      if (!w) continue
      for (let i = testStart; i < testEnd; i++) {
        errors.push(Math.abs(predictRow(w, X[i].slice(1)) - y[i]))
      }
    }
    if (errors.length > 0) {
      maeCV = errors.reduce((sum, e) => sum + e, 0) / errors.length
    }
  }

  return { weights, trainCount: sorted.length, maeCV }
}

export interface FeatureContribution {
  label: string
  value: number
}

export interface DayForecast {
  date: string
  predicted: number
  baseline: number
  /** その日に効いている要因（寄与が0でないもの、寄与の絶対値の降順） */
  contributions: FeatureContribution[]
}

export const predictDay = (model: TrainedModel, isoDate: string, ctx: FeatureContext): DayForecast => {
  const features = buildFeatureVector(isoDate, ctx)
  const raw = predictRow(model.weights, features)

  const contributions: FeatureContribution[] = []
  for (let j = 0; j < FEATURE_SPECS.length; j++) {
    const value = model.weights[j + 1] * features[j]
    if (Math.abs(value) >= 0.5) {
      contributions.push({ label: FEATURE_SPECS[j].label, value })
    }
  }
  contributions.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))

  return {
    date: isoDate,
    predicted: Math.max(0, Math.round(raw * 10) / 10),
    baseline: Math.round(model.weights[0] * 10) / 10,
    contributions,
  }
}

/** モデル係数を「要因ごとの効果（±人）」として返す（表示用） */
export const modelCoefficients = (model: TrainedModel): FeatureContribution[] =>
  FEATURE_SPECS.map((spec, j) => ({ label: spec.label, value: model.weights[j + 1] }))
