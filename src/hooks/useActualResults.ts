import { useLocalStorageState } from './useLocalStorageState'
import type { ActualResult } from '../types'

const STORAGE_KEY = 'event-calendar:actual-results'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface ImportSummary {
  added: number
  skipped: number
}

export function useActualResults() {
  const [actualResults, setActualResults] = useLocalStorageState<ActualResult[]>(STORAGE_KEY, [])

  /** 同じ日付があれば上書き、なければ追加 */
  const upsertActualResult = (input: ActualResult) => {
    setActualResults((prev) => [
      ...prev.filter((r) => r.date !== input.date),
      input,
    ])
  }

  const deleteActualResult = (date: string) => {
    setActualResults((prev) => prev.filter((r) => r.date !== date))
  }

  /**
   * 「日付,来店数」形式のテキストを一括登録する。
   * ヘッダ行・空行・不正な行は読み飛ばし、同一日付は上書きする。
   */
  const importActualResultsCSV = (text: string): ImportSummary => {
    const parsed: ActualResult[] = []
    let skipped = 0
    for (const rawLine of text.replace(/^\uFEFF/, '').split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line) continue
      const [dateCell, visitorsCell] = line.split(',').map((cell) => cell.trim().replace(/^"|"$/g, ''))
      const date = dateCell?.replace(/\//g, '-')
      const visitors = Number(visitorsCell)
      if (!date || !ISO_DATE_RE.test(date) || !Number.isFinite(visitors) || visitors < 0) {
        skipped++
        continue
      }
      parsed.push({ date, visitors })
    }

    if (parsed.length > 0) {
      setActualResults((prev) => {
        const byDate = new Map(prev.map((r) => [r.date, r]))
        for (const record of parsed) {
          byDate.set(record.date, record)
        }
        return Array.from(byDate.values())
      })
    }
    return { added: parsed.length, skipped }
  }

  return { actualResults, upsertActualResult, deleteActualResult, importActualResultsCSV }
}
