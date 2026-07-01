import { describe, expect, it } from 'vitest'
import { addMonths, getMonthMatrix, isSameMonth, parseISODate, toISODate } from './date'

describe('toISODate / parseISODate', () => {
  it('round-trips a date', () => {
    const date = new Date(2026, 5, 30)
    expect(toISODate(date)).toBe('2026-06-30')
    expect(toISODate(parseISODate('2026-06-30'))).toBe('2026-06-30')
  })
})

describe('getMonthMatrix', () => {
  it('covers the entire month in full weeks starting on Sunday', () => {
    const weeks = getMonthMatrix(new Date(2026, 5, 1)) // June 2026
    expect(weeks.every((week) => week.length === 7)).toBe(true)
    expect(weeks[0][0].getDay()).toBe(0)

    const allDays = weeks.flat()
    const daysInMonth = allDays.filter((d) => isSameMonth(d, new Date(2026, 5, 1)))
    expect(daysInMonth).toHaveLength(30)
  })
})

describe('addMonths', () => {
  it('rolls over year boundaries', () => {
    const result = addMonths(new Date(2026, 11, 15), 1)
    expect(result.getFullYear()).toBe(2027)
    expect(result.getMonth()).toBe(0)
  })
})
