const pad2 = (n: number) => String(n).padStart(2, '0')

export const toISODate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

export const parseISODate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

export const isSameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export const addMonths = (date: Date, delta: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1)

export const addDays = (date: Date, delta: number): Date => {
  const next = new Date(date)
  next.setDate(next.getDate() + delta)
  return next
}

export const startOfMonth = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), 1)

export const startOfWeek = (date: Date): Date => addDays(date, -date.getDay())

export const endOfWeek = (date: Date): Date => addDays(startOfWeek(date), 6)

/** Returns a 7-column matrix of weeks covering the full month (leading/trailing days included). */
export const getMonthMatrix = (date: Date): Date[][] => {
  const first = startOfMonth(date)
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const gridStart = startOfWeek(first)
  const gridEnd = endOfWeek(last)

  const weeks: Date[][] = []
  let cursor = gridStart
  while (cursor <= gridEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(cursor)
      cursor = addDays(cursor, 1)
    }
    weeks.push(week)
  }
  return weeks
}

export const MONTH_LABEL = (date: Date): string =>
  `${date.getFullYear()}年${date.getMonth() + 1}月`

export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']
