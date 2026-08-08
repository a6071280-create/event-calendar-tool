/**
 * X(旧Twitter)の投稿本文からイベント情報を機械的に抽出する。
 * AIによる評価はしない。日付表現とイベント種別キーワードの両方が見つかった
 * 投稿だけを、日付ごとに1観測として返す（確実に読み取れるものだけを取り込む方針）。
 */
import type { EventCategory, EventObservation, ObservationSource } from '../../src/saku/lib/types'

/** キーワード → イベント種類。先に一致したものを採用する（順序に意味がある） */
const CATEGORY_KEYWORDS: { pattern: RegExp; category: EventCategory; label: string }[] = [
  { pattern: /グランドオープン/, category: 'グランドオープン', label: 'グランドオープン' },
  { pattern: /リニューアル/, category: 'リニューアル', label: 'リニューアル' },
  { pattern: /新台入替|新装開店|新装オープン|新機種導入/, category: '新台入替', label: '新台入替' },
  { pattern: /(\d+)周年/, category: '周年', label: '周年' },
  { pattern: /実戦取材|実践取材|実戦来店|実践来店/, category: '実践来店', label: '実戦来店' },
  { pattern: /取材/, category: '取材', label: '取材' },
  { pattern: /来店/, category: '来店', label: '来店' },
  { pattern: /特定日|特日/, category: '特定日', label: '特定日' },
]

const pad2 = (n: number) => String(n).padStart(2, '0')

interface ParsedDate {
  iso: string
}

/** 投稿本文から開催日候補を抽出する（M/D・M月D日・本日・明日） */
export const extractDates = (normalizedText: string, postedAtIso: string): ParsedDate[] => {
  const posted = new Date(postedAtIso)
  const postedY = posted.getFullYear()
  const postedM = posted.getMonth() + 1
  const results = new Map<string, ParsedDate>()

  const push = (year: number, month: number, day: number) => {
    const d = new Date(year, month - 1, day)
    if (d.getMonth() !== month - 1 || d.getDate() !== day) return
    const iso = `${d.getFullYear()}-${pad2(month)}-${pad2(day)}`
    results.set(iso, { iso })
  }

  // M/D または M月D日
  const re = /(\d{1,2})\s*[/月]\s*(\d{1,2})\s*日?/g
  let m: RegExpExecArray | null
  while ((m = re.exec(normalizedText)) !== null) {
    const month = Number(m[1])
    const day = Number(m[2])
    if (month < 1 || month > 12 || day < 1 || day > 31) continue
    // 年は投稿日基準で解決: 半年以上前に見える月は翌年扱い
    let year = postedY
    if (month - postedM < -6) year = postedY + 1
    else if (month - postedM > 6) year = postedY - 1
    push(year, month, day)
  }

  if (/本日|今日/.test(normalizedText)) {
    push(posted.getFullYear(), posted.getMonth() + 1, posted.getDate())
  }
  if (/明日/.test(normalizedText)) {
    const t = new Date(posted)
    t.setDate(t.getDate() + 1)
    push(t.getFullYear(), t.getMonth() + 1, t.getDate())
  }

  return [...results.values()]
}

/** 「」内にキーワードを含む語句があればイベントの正式名称として使う */
const extractName = (normalizedText: string, keyword: { pattern: RegExp; label: string }): string => {
  const quoted = normalizedText.match(/「([^」]{1,40})」/g) ?? []
  for (const q of quoted) {
    const inner = q.slice(1, -1)
    if (keyword.pattern.test(inner)) return inner
  }
  return keyword.label
}

export interface XPost {
  id: string
  text: string
  createdAt: string
  url: string
}

/**
 * 1投稿から観測を抽出する。日付とイベント種別キーワードの両方が
 * 見つからない投稿は取り込まない（誤検知より取りこぼしを許容する）。
 */
export const extractEventObservations = (
  post: XPost,
  storeId: string,
  sourceName: string,
  maxPastDays = 45,
  maxFutureDays = 90,
): EventObservation[] => {
  const text = post.text.normalize('NFKC')
  const keyword = CATEGORY_KEYWORDS.find((k) => k.pattern.test(text))
  if (!keyword) return []

  const dates = extractDates(text, post.createdAt)
  if (dates.length === 0) return []

  const posted = Date.parse(post.createdAt)
  const source: ObservationSource = { sourceId: 'official_sns', sourceName, url: post.url }
  const name = extractName(text, keyword)
  const detail = post.text.length > 200 ? `${post.text.slice(0, 200)}…` : post.text

  const observations: EventObservation[] = []
  for (const { iso } of dates) {
    const diffDays = (Date.parse(iso) - posted) / 86_400_000
    if (diffDays < -maxPastDays || diffDays > maxFutureDays) continue
    observations.push({
      storeId,
      date: iso,
      name,
      category: keyword.category,
      detail,
      source,
      observedAt: post.createdAt,
    })
  }
  return observations
}
