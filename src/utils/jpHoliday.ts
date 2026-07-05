import { addDays, toISODate } from './date'

/**
 * 日本の祝日判定（2020年以降の祝日ルールに対応）。
 * 固定日・ハッピーマンデー・春分/秋分（近似式）・振替休日・国民の休日を扱う。
 */

const nthMonday = (year: number, month: number, nth: number): number => {
  const first = new Date(year, month - 1, 1)
  const firstMondayDate = 1 + ((8 - first.getDay()) % 7)
  return firstMondayDate + (nth - 1) * 7
}

// 1980〜2099年で有効な近似式
const vernalEquinoxDay = (year: number): number =>
  Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))

const autumnalEquinoxDay = (year: number): number =>
  Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4))

/** その年の祝日（振替休日を除く基本の祝日）を "M-D" 形式のSetで返す */
const baseHolidays = (year: number): Map<string, string> => {
  const map = new Map<string, string>()
  const set = (month: number, day: number, name: string) => map.set(`${month}-${day}`, name)

  set(1, 1, '元日')
  set(1, nthMonday(year, 1, 2), '成人の日')
  set(2, 11, '建国記念の日')
  set(2, 23, '天皇誕生日')
  set(3, vernalEquinoxDay(year), '春分の日')
  set(4, 29, '昭和の日')
  set(5, 3, '憲法記念日')
  set(5, 4, 'みどりの日')
  set(5, 5, 'こどもの日')
  set(7, nthMonday(year, 7, 3), '海の日')
  set(8, 11, '山の日')
  set(9, nthMonday(year, 9, 3), '敬老の日')
  set(9, autumnalEquinoxDay(year), '秋分の日')
  set(10, nthMonday(year, 10, 2), 'スポーツの日')
  set(11, 3, '文化の日')
  set(11, 23, '勤労感謝の日')
  return map
}

const holidayCache = new Map<number, Set<string>>()

/** その年の全祝日（振替休日・国民の休日を含む）をISO日付のSetで返す */
const holidaysOfYear = (year: number): Set<string> => {
  const cached = holidayCache.get(year)
  if (cached) return cached

  const base = baseHolidays(year)
  const dates = new Set<string>()
  for (const key of base.keys()) {
    const [m, d] = key.split('-').map(Number)
    dates.add(toISODate(new Date(year, m - 1, d)))
  }

  // 振替休日: 祝日が日曜の場合、直後の平日（祝日でない日）が休日になる
  for (const iso of Array.from(dates)) {
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (date.getDay() !== 0) continue
    let next = addDays(date, 1)
    while (dates.has(toISODate(next))) {
      next = addDays(next, 1)
    }
    dates.add(toISODate(next))
  }

  // 国民の休日: 前日と翌日が祝日に挟まれた平日（9月のシルバーウィークで発生）
  for (const key of base.keys()) {
    const [m, d] = key.split('-').map(Number)
    const between = new Date(year, m - 1, d + 1)
    const after = new Date(year, m - 1, d + 2)
    if (
      dates.has(toISODate(after)) &&
      !dates.has(toISODate(between)) &&
      between.getDay() !== 0
    ) {
      dates.add(toISODate(between))
    }
  }

  holidayCache.set(year, dates)
  return dates
}

export const isJapaneseHoliday = (date: Date): boolean =>
  holidaysOfYear(date.getFullYear()).has(toISODate(date))
