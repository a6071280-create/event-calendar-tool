import { describe, expect, it } from 'vitest'
import { isJapaneseHoliday } from './jpHoliday'

const d = (iso: string) => {
  const [y, m, day] = iso.split('-').map(Number)
  return new Date(y, m - 1, day)
}

describe('isJapaneseHoliday', () => {
  it('固定日の祝日を判定する', () => {
    expect(isJapaneseHoliday(d('2026-01-01'))).toBe(true) // 元日
    expect(isJapaneseHoliday(d('2026-02-11'))).toBe(true) // 建国記念の日
    expect(isJapaneseHoliday(d('2026-02-23'))).toBe(true) // 天皇誕生日
    expect(isJapaneseHoliday(d('2026-11-03'))).toBe(true) // 文化の日
  })

  it('ハッピーマンデーの祝日を判定する', () => {
    expect(isJapaneseHoliday(d('2026-01-12'))).toBe(true) // 成人の日（1月第2月曜）
    expect(isJapaneseHoliday(d('2026-07-20'))).toBe(true) // 海の日（7月第3月曜）
    expect(isJapaneseHoliday(d('2026-09-21'))).toBe(true) // 敬老の日（9月第3月曜）
    expect(isJapaneseHoliday(d('2026-10-12'))).toBe(true) // スポーツの日（10月第2月曜）
  })

  it('春分・秋分を判定する', () => {
    expect(isJapaneseHoliday(d('2026-03-20'))).toBe(true) // 春分の日
    expect(isJapaneseHoliday(d('2026-09-23'))).toBe(true) // 秋分の日
  })

  it('振替休日を判定する', () => {
    // 2026-05-03(憲法記念日)が日曜のため、5/4・5/5の祝日を挟んで5/6が振替休日
    expect(isJapaneseHoliday(d('2026-05-06'))).toBe(true)
  })

  it('平日は祝日でない', () => {
    expect(isJapaneseHoliday(d('2026-06-03'))).toBe(false)
    expect(isJapaneseHoliday(d('2026-07-06'))).toBe(false)
    expect(isJapaneseHoliday(d('2026-05-07'))).toBe(false)
  })
})
