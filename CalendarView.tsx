import { useMemo } from 'react'
import type { CompetitorEvent, OwnPromotionDay } from '../../types'
import { addMonths, getMonthMatrix, isSameDay, isSameMonth, MONTH_LABEL, toISODate, WEEKDAY_LABELS } from '../../utils/date'
import { DayCell } from './DayCell'

interface CalendarViewProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  events: CompetitorEvent[]
  ownPromotions: OwnPromotionDay[]
  onAddClick: (dateISO: string) => void
  onEventClick: (event: CompetitorEvent) => void
  onOwnPromotionClick: (promo: OwnPromotionDay) => void
}

export function CalendarView({
  currentMonth,
  onMonthChange,
  events,
  ownPromotions,
  onAddClick,
  onEventClick,
  onOwnPromotionClick,
}: CalendarViewProps) {
  const weeks = useMemo(() => getMonthMatrix(currentMonth), [currentMonth])
  const today = useMemo(() => new Date(), [])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CompetitorEvent[]>()
    for (const event of events) {
      const list = map.get(event.date) ?? []
      list.push(event)
      map.set(event.date, list)
    }
    return map
  }, [events])

  const promotionsByDate = useMemo(() => {
    const map = new Map<string, OwnPromotionDay[]>()
    for (const promo of ownPromotions) {
      const list = map.get(promo.date) ?? []
      list.push(promo)
      map.set(promo.date, list)
    }
    return map
  }, [ownPromotions])

  return (
    <div className="calendar-view">
      <div className="calendar-view__toolbar">
        <button type="button" onClick={() => onMonthChange(addMonths(currentMonth, -1))}>
          ＜ 前月
        </button>
        <h2>{MONTH_LABEL(currentMonth)}</h2>
        <button type="button" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
          翌月 ＞
        </button>
        <button type="button" className="calendar-view__today" onClick={() => onMonthChange(new Date())}>
          今月
        </button>
      </div>
      <div className="calendar-grid calendar-grid--header">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-grid__weekday">
            {label}
          </div>
        ))}
      </div>
      <div className="calendar-grid">
        {weeks.flat().map((date) => {
          const dateISO = toISODate(date)
          return (
            <DayCell
              key={dateISO}
              date={date}
              inCurrentMonth={isSameMonth(date, currentMonth)}
              isToday={isSameDay(date, today)}
              events={eventsByDate.get(dateISO) ?? []}
              ownPromotions={promotionsByDate.get(dateISO) ?? []}
              onAddClick={onAddClick}
              onEventClick={onEventClick}
              onOwnPromotionClick={onOwnPromotionClick}
            />
          )
        })}
      </div>
    </div>
  )
}
