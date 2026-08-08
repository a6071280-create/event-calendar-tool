/**
 * 佐久市イベント差分検知ツールの共有ドメインモデル。
 * フロントエンドと collector の両方から import されるため、ブラウザ/Node どちらでも動く
 * 純粋な型・定数のみを置く。
 */

export const EVENT_CATEGORIES = [
  '取材',
  '来店',
  '実践来店',
  'メディア',
  'メーカー',
  '店舗独自',
  '新台入替',
  'リニューアル',
  'グランドオープン',
  '周年',
  '特定日',
  '旧イベント日',
  'その他',
] as const

export type EventCategory = (typeof EVENT_CATEGORIES)[number]

/** フィルターUIで使うイベント種類の大分類 */
export const CATEGORY_GROUPS: { key: string; label: string; categories: EventCategory[] }[] = [
  { key: 'shuzai', label: '取材', categories: ['取材'] },
  { key: 'raiten', label: '来店', categories: ['来店', '実践来店'] },
  { key: 'shindai', label: '新台', categories: ['新台入替', 'リニューアル', 'グランドオープン'] },
  { key: 'shunen', label: '周年', categories: ['周年', 'グランドオープン'] },
  { key: 'tokutei', label: '特定日', categories: ['特定日', '旧イベント日'] },
  { key: 'other', label: 'その他', categories: ['メディア', 'メーカー', '店舗独自', 'その他'] },
]

export interface Region {
  id: string
  prefecture: string
  city: string
  enabled: boolean
}

export interface StoreUrls {
  official?: string | null
  dmmPtown?: string | null
  pworld?: string | null
  sns?: string[]
}

export interface Store {
  id: string
  name: string
  shortName: string
  regionId: string
  prefecture: string
  city: string
  address: string
  isOwn: boolean
  businessStatus: 'open' | 'closed' | 'unknown'
  displayOrder: number
  urls: StoreUrls
}

export interface EventSourceRef {
  /** data/sources.json の id、または 'manual' / 'demo' */
  sourceId: string
  sourceName: string
  url?: string | null
  firstSeenAt: string
  lastSeenAt: string
}

export type EventStatus = 'active' | 'removed'

export type EventChangeType = 'added' | 'updated' | 'date_changed' | 'removed' | 'restored'

export interface EventChange {
  at: string
  type: EventChangeType
  field?: string
  before?: string
  after?: string
}

export interface EventRecord {
  id: string
  storeId: string
  /** 開催日 YYYY-MM-DD */
  date: string
  /** 情報源に掲載されている正式名称 */
  name: string
  category: EventCategory
  detail?: string
  status: EventStatus
  sources: EventSourceRef[]
  firstSeenAt: string
  lastSeenAt: string
  createdAt: string
  updatedAt: string
  changes: EventChange[]
  demo?: boolean
}

/**
 * 「イベントなしを確認した」記録。
 * confirmed_event はイベントレコードの存在から導出されるため、明示的に保存するのは
 * confirmed_no_event のみ。どちらの記録もない日は unknown（情報なし）。
 */
export interface DayStatusRecord {
  storeId: string
  date: string
  status: 'confirmed_no_event'
  checkedAt: string
  sourceName?: string
}

export type DayInfoStatus = 'confirmed_event' | 'confirmed_no_event' | 'unknown'

export interface DiffSettings {
  /** 過去何回分の同条件実績と比較するか */
  lookbackCount: number
  /** 差分判定に必要な最小実績数（これ未満なら通常パターンと判定しない） */
  minSamples: number
  /** 出現率がこれ以上なら「通常あり」とみなす */
  expectedMinRatio: number
  /** 出現率がこれ以下のイベントが入ったら「新規パターン」とみなす */
  newPatternMaxRatio: number
  /** 初回確認からこの日数以内は NEW バッジを表示 */
  newBadgeDays: number
  /** 削除からこの日数以内は削除済みイベントを表示 */
  removedBadgeDays: number
}

export const DEFAULT_DIFF_SETTINGS: DiffSettings = {
  lookbackCount: 6,
  minSamples: 6,
  expectedMinRatio: 0.7,
  newPatternMaxRatio: 0.2,
  newBadgeDays: 3,
  removedBadgeDays: 7,
}

/** collector が生成し、フロントエンドが読み込む一枚岩のデータセット */
export interface Dataset {
  generatedAt: string
  regions: Region[]
  stores: Store[]
  events: EventRecord[]
  dayStatuses: DayStatusRecord[]
  settings: DiffSettings
  containsDemoData: boolean
}

/* ── 収集(観測)モデル ── */

export interface ObservationSource {
  sourceId: string
  sourceName: string
  url?: string | null
}

/** ある情報源で「このイベントが掲載されていた」という観測 */
export interface EventObservation {
  storeId: string
  date: string
  name: string
  category: EventCategory
  detail?: string
  source: ObservationSource
  observedAt: string
  demo?: boolean
}

/** ある情報源で「この日はイベント掲載がなかった」ことを確認した観測 */
export interface NoEventObservation {
  storeId: string
  date: string
  source: ObservationSource
  observedAt: string
  demo?: boolean
}

/** 掲載されていたイベントが取り下げられたことの観測 */
export interface RemovalObservation {
  storeId: string
  date: string
  name: string
  source: ObservationSource
  observedAt: string
  /** 開催日変更の場合、変更後の日付 */
  movedToDate?: string
  demo?: boolean
}

export interface ObservationBatch {
  observations: EventObservation[]
  noEvents: NoEventObservation[]
  removals: RemovalObservation[]
}

export const EMPTY_BATCH: ObservationBatch = { observations: [], noEvents: [], removals: [] }

export interface EventDb {
  events: EventRecord[]
  dayStatuses: DayStatusRecord[]
}
