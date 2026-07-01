import { useState } from 'react'
import type { CompetitorEvent, OwnPromotionDay } from '../../types'
import { EVENT_TYPE_COLORS, MAX_VISIBLE_TAGS_PER_DAY } from '../../constants'
import { toISODate } from '../../utils/date'

interface DayCellProps {
  date: Date
  inCurrentMonth: boolean
  isToday: boolean
  events: CompetitorEvent[]
  ownPromotions: OwnPromotionDay[]
  onAddClick: (dateISO: string) => void
  onEventClick: (event: CompetitorEvent) => void
  onOwnPromotionClick: (promo: OwnPromotionDay) => void
}

export function DayCell({
  date,
  inCurrentMonth,
  isToday,
  events,
  ownPromotions,
  onAddClick,
  onEventClick,
  onOwnPromotionClick,
}: DayCellProps) {
  const [expanded, setExpanded] = useState(false)
  const dateISO = toISODate(date)

  const totalCount = events.length + ownPromotions.length
  const visibleOwnPromotions = expanded ? ownPromotions : ownPromotions.slice(0, MAX_VISIBLE_TAGS_PER_DAY)
  const remainingSlots = Math.max(0, MAX_VISIBLE_TAGS_PER_DAY - visibleOwnPromotions.length)
  const visibleEvents = expanded ? events : events.slice(0, remainingSlots)
  const hiddenCount = totalCount - visibleOwnPromotions.length - visibleEvents.length

  return (
    <div
      className={[
        'day-cell',
        inCurrentMonth ? '' : 'day-cell--outside',
        isToday ? 'day-cell--today' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="day-cell__header">
        <span className="day-cell__date">{date.getDate()}</span>
        <button
          type="button"
          className="day-cell__add"
          aria-label="イベントを追加"
          onClick={() => onAddClick(dateISO)}
        >
          +
        </button>
      </div>
      <div className="day-cell__tags">
        {visibleOwnPromotions.map((promo) => (
          <button
            key={promo.id}
            type="button"
            className="event-tag event-tag--own"
            onClick={() => onOwnPromotionClick(promo)}
            title={promo.memo}
          >
            ★ {promo.title}
          </button>
        ))}
        {visibleEvents.map((event) => (
          <button
            key={event.id}
            type="button"
            className="event-tag"
            style={{ borderLeftColor: EVENT_TYPE_COLORS[event.eventType] }}
            onClick={() => onEventClick(event)}
            title={event.memo}
          >
            {event.storeName} / {event.eventType}
          </button>
        ))}
        {hiddenCount > 0 && (
          <button type="button" className="event-tag event-tag--more" onClick={() => setExpanded(true)}>
            +{hiddenCount}件
          </button>
        )}
        {expanded && totalCount > MAX_VISIBLE_TAGS_PER_DAY && (
          <button type="button" className="event-tag event-tag--collapse" onClick={() => setExpanded(false)}>
            閉じる
          </button>
        )}
      </div>
    </div>
  )
}
