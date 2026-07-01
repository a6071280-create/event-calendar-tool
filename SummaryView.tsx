import { useMemo } from 'react'
import type { CompetitorEvent } from '../types'
import { isSameMonth, MONTH_LABEL, parseISODate } from '../utils/date'

interface SummaryViewProps {
  events: CompetitorEvent[]
  currentMonth: Date
}

interface RankingRow {
  label: string
  count: number
}

const buildRanking = (entries: string[]): RankingRow[] => {
  const counts = new Map<string, number>()
  for (const entry of entries) {
    counts.set(entry, (counts.get(entry) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function RankingTable({ title, rows }: { title: string; rows: RankingRow[] }) {
  const max = rows[0]?.count ?? 1
  return (
    <div className="summary-view__panel">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="summary-view__empty">データがありません</p>
      ) : (
        <ol className="summary-view__ranking">
          {rows.map((row) => (
            <li key={row.label}>
              <span className="summary-view__ranking-label">{row.label}</span>
              <div className="summary-view__bar-track">
                <div className="summary-view__bar" style={{ width: `${(row.count / max) * 100}%` }} />
              </div>
              <span className="summary-view__ranking-count">{row.count}件</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export function SummaryView({ events, currentMonth }: SummaryViewProps) {
  const monthEvents = useMemo(
    () => events.filter((event) => isSameMonth(parseISODate(event.date), currentMonth)),
    [events, currentMonth],
  )

  const areaRanking = useMemo(
    () => buildRanking(monthEvents.map((e) => `${e.prefecture} ${e.area}`.trim())),
    [monthEvents],
  )
  const storeRanking = useMemo(() => buildRanking(monthEvents.map((e) => e.storeName)), [monthEvents])

  return (
    <div className="summary-view">
      <h2>{MONTH_LABEL(currentMonth)} のイベント密度</h2>
      <div className="summary-view__panels">
        <RankingTable title="エリア別ランキング" rows={areaRanking} />
        <RankingTable title="店舗別ランキング" rows={storeRanking} />
      </div>
    </div>
  )
}
