/**
 * デモ用サンプルデータ生成。
 *   npm run seed:demo
 *
 * 差分検知の動作を実データ投入前に確認するためのもの。すべての観測に demo フラグが
 * 付き、UI に「サンプルデータ」バナーが表示される。実運用を始めるときは
 * data/manual/00-demo-seed.json と data/db/ を削除して collect を実行し直せばよい。
 *
 * 生成内容（アンカー日=実行日を基準に過去6ヶ月分）:
 * - アムアム(自店): 8のつく日「回胴ゾロの日」を毎回開催（今月も開催 → 差分なし）
 * - スーパーアリーナ: 8日「ぞろぞろ取材」6/6回（今月も開催、複数情報源のデモ）
 * - マルハン佐久: 8のつく日「特日取材」、8日は過去6回中5回 → 今月8日なし = ⚠通常は特日取材
 * - バビデ: 18日「わっしょい来店」過去6回中5回 → 今月18日未発表 = ⚠(情報なし) + 掲載取下げのデモ
 * - ダイナム佐久: 毎週土曜「土曜スロフェス」(曜日パターン)
 * - スーパーアリーナ: 新台入替(普段ない日) / YAHHO: 実戦取材の新規発表 = ⚠新規パターン + NEW
 */
import type {
  EventCategory,
  EventObservation,
  NoEventObservation,
  ObservationBatch,
  RemovalObservation,
} from '../../src/saku/lib/types'
import { todayJstIso, writeJson } from './io'
import { MANUAL_DIR } from './paths'
import path from 'node:path'

const DEMO_SOURCE = { sourceId: 'demo', sourceName: 'サンプルデータ' }
const DEMO_SOURCE_B = { sourceId: 'demo', sourceName: 'サンプル情報源B', url: 'https://example.com/demo/zorozoro' }

const pad2 = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`
const fromIso = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const addDays = (isoDate: string, delta: number): string => {
  const d = fromIso(isoDate)
  d.setDate(d.getDate() + delta)
  return iso(d.getFullYear(), d.getMonth(), d.getDate())
}

const anchor = process.env.SEED_ANCHOR ?? todayJstIso()
const anchorDate = fromIso(anchor)
const anchorY = anchorDate.getFullYear()
const anchorM = anchorDate.getMonth()

/** 過去6ヶ月の月初 */
const rangeStart = new Date(anchorY, anchorM - 6, 1)
const rangeStartIso = iso(rangeStart.getFullYear(), rangeStart.getMonth(), 1)

const observations: EventObservation[] = []
const noEvents: NoEventObservation[] = []
const removals: RemovalObservation[] = []

const observedAtFor = (date: string): string =>
  date <= anchor ? `${date}T10:00:00+09:00` : `${addDays(anchor, -6)}T10:00:00+09:00`

const addEvent = (
  storeId: string,
  date: string,
  name: string,
  category: EventCategory,
  detail?: string,
  observedAt?: string,
) => {
  observations.push({
    storeId,
    date,
    name,
    category,
    detail,
    source: DEMO_SOURCE,
    observedAt: observedAt ?? observedAtFor(date),
    demo: true,
  })
}

/** 対象日の「月」に day 日が存在する月だけ列挙（過去6ヶ月+当月） */
const monthDays = (day: number): string[] => {
  const dates: string[] = []
  for (let offset = -6; offset <= 0; offset++) {
    const d = new Date(anchorY, anchorM + offset, day)
    if (d.getMonth() !== ((anchorM + offset) % 12 + 12) % 12) continue
    dates.push(iso(d.getFullYear(), d.getMonth(), d.getDate()))
  }
  return dates
}

// ── アムアム(自店): 8のつく日 回胴ゾロの日（毎回開催） ──
for (const day of [8, 18, 28]) {
  for (const date of monthDays(day)) {
    addEvent('amuamu', date, '回胴ゾロの日', '店舗独自', 'ゾロ目の日恒例の自店イベント')
  }
}

// ── スーパーアリーナ: 8日 ぞろぞろ取材（6/6回） ──
for (const date of monthDays(8)) {
  addEvent('super-arena-sakudaira', date, 'ぞろぞろ取材', '取材')
  if (date > addDays(anchor, -10)) {
    // 直近分は複数情報源で確認された想定（1イベント+複数情報源のデモ）
    observations.push({
      storeId: 'super-arena-sakudaira',
      date,
      name: 'ぞろぞろ取材',
      category: '取材',
      source: DEMO_SOURCE_B,
      observedAt: observedAtFor(date),
      demo: true,
    })
  }
}

// ── マルハン佐久: 8のつく日 特日取材。8日は3ヶ月前を欠場、当月8日は未開催 ──
const maruhanSkip8 = iso(anchorY, anchorM - 3, 8)
for (const day of [8, 18, 28]) {
  for (const date of monthDays(day)) {
    if (day === 8 && (date === maruhanSkip8 || date === iso(anchorY, anchorM, 8))) continue
    addEvent('maruhan-saku', date, '特日取材', '取材')
  }
}

// ── バビデ: 18日 わっしょい来店（5/6回）。当月18日は未発表のまま ──
const babideSkip18 = iso(anchorY, anchorM - 2, 18)
for (const date of monthDays(18)) {
  if (date === babideSkip18 || date === iso(anchorY, anchorM, 18)) continue
  addEvent('babide-saku', date, 'わっしょい来店', '来店')
}
// 掲載取下げのデモ: 明日の来店告知が出た後、取り下げられた
const babideRemovedDate = addDays(anchor, 1)
addEvent('babide-saku', babideRemovedDate, 'わっしょい来店', '来店', undefined, `${addDays(anchor, -5)}T10:00:00+09:00`)
removals.push({
  storeId: 'babide-saku',
  date: babideRemovedDate,
  name: 'わっしょい来店',
  source: DEMO_SOURCE,
  observedAt: `${addDays(anchor, -1)}T18:00:00+09:00`,
  demo: true,
})

// ── ダイナム佐久: 毎週土曜 土曜スロフェス（曜日パターン） ──
{
  const cursor = new Date(rangeStart)
  while (cursor.getDay() !== 6) cursor.setDate(cursor.getDate() + 1)
  while (true) {
    const date = iso(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
    if (date > anchor) break
    addEvent('dynam-nagano-saku', date, '土曜スロフェス', '店舗独自')
    cursor.setDate(cursor.getDate() + 7)
  }
}

// ── 新規パターンのデモ ──
// スーパーアリーナ: 普段イベントのない日に新台入替
addEvent(
  'super-arena-sakudaira',
  addDays(anchor, 2),
  '新台入替',
  '新台入替',
  '新機種導入',
  `${addDays(anchor, -2)}T10:00:00+09:00`,
)
// YAHHO: 普段イベントのない日に実戦取材が突然発表（NEWバッジ + ⚠新規パターン）
addEvent(
  'yahho-saku',
  addDays(anchor, 3),
  'パチスロ実戦取材',
  '実践来店',
  undefined,
  `${addDays(anchor, -1)}T09:00:00+09:00`,
)

// ── イベントなし確認のフィル ──
// 過去分は「各情報源を確認したがイベント掲載なし」だった想定。
// これが「イベントなし(確認済)」と「情報なし(未確認)」の区別のデモになる。
const eventDatesByStore = new Map<string, Set<string>>()
for (const o of observations) {
  let set = eventDatesByStore.get(o.storeId)
  if (!set) {
    set = new Set()
    eventDatesByStore.set(o.storeId, set)
  }
  set.add(o.date)
}
const STORE_IDS = ['amuamu', 'maruhan-saku', 'super-arena-sakudaira', 'dynam-nagano-saku', 'yahho-saku', 'babide-saku']
for (const storeId of STORE_IDS) {
  let date = rangeStartIso
  while (date <= anchor) {
    if (!eventDatesByStore.get(storeId)?.has(date)) {
      noEvents.push({
        storeId,
        date,
        source: DEMO_SOURCE,
        observedAt: `${date}T23:00:00+09:00`,
        demo: true,
      })
    }
    date = addDays(date, 1)
  }
}

const batch: ObservationBatch = { observations, noEvents, removals }
const outFile = path.join(MANUAL_DIR, '00-demo-seed.json')
writeJson(outFile, batch)
console.log(
  `[seed] ${outFile} を生成しました（anchor=${anchor}, 観測${observations.length}件, なし確認${noEvents.length}件, 削除${removals.length}件）`,
)
