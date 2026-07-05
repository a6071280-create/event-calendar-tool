export const PREFECTURES = [
  '長野県',
  '新潟県',
  '群馬県',
  '山梨県',
  '岐阜県',
  '愛知県',
  '埼玉県',
  '静岡県',
] as const

export type Prefecture = (typeof PREFECTURES)[number]

export const EVENT_TYPES = [
  '取材来店',
  'スロセレ',
  'ぱちタウンコレクション',
  '旧イベ',
  'その他',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const TIME_SLOTS = ['終日', '午前', '午後', '夜間'] as const

export type TimeSlot = (typeof TIME_SLOTS)[number]

export interface CompetitorEvent {
  id: string
  storeName: string
  prefecture: Prefecture
  area: string
  date: string // YYYY-MM-DD
  timeSlot: TimeSlot
  eventType: EventType
  memo: string
  createdAt: string
  updatedAt: string
}

export interface OwnPromotionDay {
  id: string
  title: string
  date: string // YYYY-MM-DD
  memo: string
  createdAt: string
}

export type AreaFilterMode = 'nagano' | 'all'

export type ViewTab = 'calendar' | 'list' | 'summary' | 'forecast'

/** 日別の実績（来店客数など任意の指標） */
export interface ActualResult {
  date: string // YYYY-MM-DD
  visitors: number
}

/** 稼働予測のカレンダー軸設定 */
export interface ForecastSettings {
  /** 給料日とみなす日（例: [25]） */
  paydayDays: number[]
  /** 年金支給日とみなす日（例: [15]） */
  pensionDays: number[]
  /** 年金支給がある月（例: 偶数月） */
  pensionMonths: number[]
}
