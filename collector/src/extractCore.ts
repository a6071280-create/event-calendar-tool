/**
 * テキストからのイベント抽出コア。X投稿・Webページ本文の両方で使う。
 * AIによる評価はしない。日付表現とイベント種別キーワードの両方が見つかった
 * テキストだけを観測にする（誤検知より取りこぼしを許容する方針）。
 */
import type { EventCategory, EventObservation, ObservationSource } from '../../src/saku/lib/types'

/** キーワード → イベント種類。先に一致したものを採用する（順序に意味がある） */
export const CATEGORY_KEYWORDS: { pattern: RegExp; category: EventCategory; label: string }[] = [
  { pattern: /グランドオープン/, category: 'グランドオープン', label: 'グランドオープン' },
  { pattern: /リニューアル/, category: 'リニューアル', label: 'リニューアル' },
  { pattern: /新台入替|新装開店|新装オープン|新機種導入|新台導入/, category: '新台入替', label: '新台入替' },
  { pattern: /(\d+)周年/, category: '周年', label: '周年' },
  { pattern: /実戦取材|実践取材|実戦来店|実践来店/, category: '実践来店', label: '実戦来店' },
  { pattern: /取材/, category: '取材', label: '取材' },
  // 「ご来店お待ちしております」等の挨拶文を除外するため「ご来店」は対象外
  { pattern: /(?<!ご)来店/, category: '来店', label: '来店' },
  { pattern: /特定日|特日/, category: '特定日', label: '特定日' },
]

const pad2 = (n: number) => String(n).padStart(2, '0')

/** テキストから開催日候補を抽出する（YYYY/M/D・M/D・M月D日・本日・明日） */
export const extractDates = (normalizedText: string, referenceIso: string): { iso: string }[] => {
  const ref = new Date(referenceIso)
  const refY = ref.getFullYear()
  const refM = ref.getMonth() + 1
  const results = new Map<string, { iso: string }>()

  const push = (year: number, month: number, day: number) => {
    const d = new Date(year, month - 1, day)
    if (d.getMonth() !== month - 1 || d.getDate() !== day) return
    results.set(`${d.getFullYear()}-${pad2(month)}-${pad2(day)}`, {
      iso: `${d.getFullYear()}-${pad2(month)}-${pad2(day)}`,
    })
  }

  // YYYY/M/D または YYYY年M月D日（年付きはそのまま使う）
  const reFull = /(20\d{2})\s*[/年]\s*(\d{1,2})\s*[/月]\s*(\d{1,2})\s*日?/g
  let m: RegExpExecArray | null
  const consumed: [number, number][] = []
  while ((m = reFull.exec(normalizedText)) !== null) {
    const month = Number(m[2])
    const day = Number(m[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) push(Number(m[1]), month, day)
    consumed.push([m.index, m.index + m[0].length])
  }

  // M/D または M月D日（年は基準日から解決: 半年以上前に見える月は翌年扱い）
  const re = /(\d{1,2})\s*[/月]\s*(\d{1,2})\s*日?/g
  while ((m = re.exec(normalizedText)) !== null) {
    const start = m.index
    if (consumed.some(([s, e]) => start >= s && start < e)) continue
    const month = Number(m[1])
    const day = Number(m[2])
    if (month < 1 || month > 12 || day < 1 || day > 31) continue
    let year = refY
    if (month - refM < -6) year = refY + 1
    else if (month - refM > 6) year = refY - 1
    push(year, month, day)
  }

  if (/本日|今日/.test(normalizedText)) push(ref.getFullYear(), ref.getMonth() + 1, ref.getDate())
  if (/明日/.test(normalizedText)) {
    const t = new Date(ref)
    t.setDate(t.getDate() + 1)
    push(t.getFullYear(), t.getMonth() + 1, t.getDate())
  }

  return [...results.values()]
}

/** 「」内にキーワードを含む語句があればイベントの正式名称として使う */
const extractName = (
  normalizedText: string,
  keyword: { pattern: RegExp; label: string },
): string => {
  const quoted = normalizedText.match(/「([^」]{1,40})」/g) ?? []
  for (const q of quoted) {
    const inner = q.slice(1, -1)
    if (keyword.pattern.test(inner)) return inner
  }
  return keyword.label
}

export interface ExtractOptions {
  /** 基準日からこれより過去の日付は捨てる */
  maxPastDays?: number
  /** 基準日からこれより未来の日付は捨てる */
  maxFutureDays?: number
}

/**
 * テキスト1件から観測を抽出する。日付とイベント種別キーワードの両方が
 * 見つからなければ空を返す。
 */
export const extractFromText = (
  rawText: string,
  referenceIso: string,
  storeId: string,
  source: ObservationSource,
  observedAt: string,
  options: ExtractOptions = {},
): EventObservation[] => {
  const { maxPastDays = 45, maxFutureDays = 90 } = options
  const text = rawText.normalize('NFKC')
  const keyword = CATEGORY_KEYWORDS.find((k) => k.pattern.test(text))
  if (!keyword) return []

  const dates = extractDates(text, referenceIso)
  if (dates.length === 0) return []

  const refTime = Date.parse(referenceIso)
  const name = extractName(text, keyword)
  const detail = rawText.length > 200 ? `${rawText.slice(0, 200)}…` : rawText

  const observations: EventObservation[] = []
  for (const { iso } of dates) {
    const diffDays = (Date.parse(iso) - refTime) / 86_400_000
    if (diffDays < -maxPastDays || diffDays > maxFutureDays) continue
    observations.push({
      storeId,
      date: iso,
      name,
      category: keyword.category,
      detail,
      source,
      observedAt,
    })
  }
  return observations
}
