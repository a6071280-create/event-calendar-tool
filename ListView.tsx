import { useMemo, useState } from 'react'
import type { CompetitorEvent } from '../types'
import { addDays, endOfWeek, isSameMonth, MONTH_LABEL, parseISODate, startOfWeek, toISODate } from '../utils/date'
import { downloadCSV, toCSV } from '../utils/csv'

type Scope = 'month' | 'week'

interface ListViewProps {
  events: CompetitorEvent[]
  currentMonth: Date
  onEventClick: (event: CompetitorEvent) => void
}

export function ListView({ events, currentMonth, onEventClick }: ListViewProps) {
  const [scope, setScope] = useState<Scope>('month')
  const [weekAnchor, setWeekAnchor] = useState(currentMonth)
  const [trackedMonth, setTrackedMonth] = useState(currentMonth)

  if (trackedMonth !== currentMonth) {
    setTrackedMonth(currentMonth)
    setWeekAnchor(currentMonth)
  }

  const weekStart = useMemo(() => startOfWeek(weekAnchor), [weekAnchor])
  const weekEnd = useMemo(() => endOfWeek(weekAnchor), [weekAnchor])

  const filtered = useMemo(() => {
    return events
      .filter((event) => {
        const date = parseISODate(event.date)
        if (scope === 'month') return isSameMonth(date, currentMonth)
        return date >= weekStart && date <= weekEnd
      })
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [events, scope, currentMonth, weekStart, weekEnd])

  const handleExport = () => {
    const headers = ['日付', '店舗名', '都道府県', 'エリア', '種別', '時間帯', 'メモ']
    const rows = filtered.map((e) => [e.date, e.storeName, e.prefecture, e.area, e.eventType, e.timeSlot, e.memo])
    const csv = toCSV(headers, rows)
    const label = scope === 'month' ? MONTH_LABEL(currentMonth) : `${toISODate(weekStart)}_${toISODate(weekEnd)}`
    downloadCSV(`競合イベント_${label}.csv`, csv)
  }

  return (
    <div className="list-view">
      <div className="list-view__toolbar">
        <div className="list-view__scope" role="group" aria-label="表示範囲">
          <button type="button" className={scope === 'month' ? 'active' : ''} onClick={() => setScope('month')}>
            月次
          </button>
          <button type="button" className={scope === 'week' ? 'active' : ''} onClick={() => setScope('week')}>
            週次
          </button>
        </div>
        {scope === 'week' && (
          <div className="list-view__week-nav">
            <button type="button" onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}>
              ＜ 前週
            </button>
            <span>
              {toISODate(weekStart)} 〜 {toISODate(weekEnd)}
            </span>
            <button type="button" onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}>
              翌週 ＞
            </button>
          </div>
        )}
        <button type="button" className="btn btn--primary" onClick={handleExport} disabled={filtered.length === 0}>
          CSVエクスポート
        </button>
      </div>
      <table className="list-view__table">
        <thead>
          <tr>
            <th>日付</th>
            <th>店舗名</th>
            <th>エリア</th>
            <th>種別</th>
            <th>時間帯</th>
            <th>メモ</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="list-view__empty">
                該当するイベントがありません
              </td>
            </tr>
          )}
          {filtered.map((event) => (
            <tr key={event.id} onClick={() => onEventClick(event)}>
              <td>{event.date}</td>
              <td>{event.storeName}</td>
              <td>
                {event.prefecture} {event.area}
              </td>
              <td>{event.eventType}</td>
              <td>{event.timeSlot}</td>
              <td className="list-view__memo">{event.memo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
