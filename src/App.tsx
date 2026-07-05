import { useMemo, useState } from 'react'
import { AreaFilterBar } from './components/AreaFilterBar'
import { CalendarView } from './components/CalendarView/CalendarView'
import { EventModal } from './components/EventModal'
import type { EventInput } from './components/EventModal'
import { ForecastView } from './components/ForecastView'
import { ListView } from './components/ListView'
import { OwnPromotionModal } from './components/OwnPromotionModal'
import type { OwnPromotionInput } from './components/OwnPromotionModal'
import { SummaryView } from './components/SummaryView'
import { NAGANO_PREFECTURE } from './constants'
import { useEvents } from './hooks/useEvents'
import { useOwnPromotions } from './hooks/useOwnPromotions'
import type { AreaFilterMode, CompetitorEvent, OwnPromotionDay, ViewTab } from './types'
import { toISODate } from './utils/date'

interface EventModalState {
  date: string
  editing?: CompetitorEvent
}

interface PromotionModalState {
  date: string
  editing?: OwnPromotionDay
}

const TABS: { key: ViewTab; label: string }[] = [
  { key: 'calendar', label: 'カレンダー' },
  { key: 'list', label: 'リスト' },
  { key: 'summary', label: '集計' },
  { key: 'forecast', label: '稼働予測' },
]

function App() {
  const { events, addEvent, updateEvent, deleteEvent, storeNameSuggestions } = useEvents()
  const { ownPromotions, addOwnPromotion, deleteOwnPromotion } = useOwnPromotions()

  const [activeTab, setActiveTab] = useState<ViewTab>('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [areaFilterMode, setAreaFilterMode] = useState<AreaFilterMode>('all')
  const [eventModal, setEventModal] = useState<EventModalState | null>(null)
  const [promotionModal, setPromotionModal] = useState<PromotionModalState | null>(null)

  const visibleEvents = useMemo(() => {
    if (areaFilterMode === 'all') return events
    return events.filter((event) => event.prefecture === NAGANO_PREFECTURE)
  }, [events, areaFilterMode])

  const handleSaveEvent = (input: EventInput) => {
    if (eventModal?.editing) {
      updateEvent(eventModal.editing.id, input)
    } else {
      addEvent(input)
    }
    setEventModal(null)
  }

  const handleDeleteEvent = () => {
    if (eventModal?.editing) {
      deleteEvent(eventModal.editing.id)
    }
    setEventModal(null)
  }

  const handleSavePromotion = (input: OwnPromotionInput) => {
    if (!promotionModal?.editing) {
      addOwnPromotion(input)
    }
    setPromotionModal(null)
  }

  const handleDeletePromotion = () => {
    if (promotionModal?.editing) {
      deleteOwnPromotion(promotionModal.editing.id)
    }
    setPromotionModal(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>競合イベントカレンダー</h1>
        <span className="subtitle">店舗イベント・自社販促の重複を可視化</span>
        <nav className="app-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? 'active' : ''}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="btn btn--own-promo"
          onClick={() => setPromotionModal({ date: toISODate(new Date()) })}
        >
          ＋ 自社販促日
        </button>
      </header>

      <AreaFilterBar mode={areaFilterMode} onChange={setAreaFilterMode} />

      <main className="app-main">
        {activeTab === 'calendar' && (
          <CalendarView
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            events={visibleEvents}
            ownPromotions={ownPromotions}
            onAddClick={(date) => setEventModal({ date })}
            onEventClick={(event) => setEventModal({ date: event.date, editing: event })}
            onOwnPromotionClick={(promo) => setPromotionModal({ date: promo.date, editing: promo })}
          />
        )}
        {activeTab === 'list' && (
          <ListView
            events={visibleEvents}
            currentMonth={currentMonth}
            onEventClick={(event) => setEventModal({ date: event.date, editing: event })}
          />
        )}
        {activeTab === 'summary' && <SummaryView events={visibleEvents} currentMonth={currentMonth} />}
        {activeTab === 'forecast' && <ForecastView events={events} ownPromotions={ownPromotions} />}
      </main>

      {eventModal && (
        <EventModal
          initialDate={eventModal.date}
          editingEvent={eventModal.editing}
          storeNameSuggestions={storeNameSuggestions}
          onSave={handleSaveEvent}
          onDelete={eventModal.editing ? handleDeleteEvent : undefined}
          onClose={() => setEventModal(null)}
        />
      )}

      {promotionModal && (
        <OwnPromotionModal
          initialDate={promotionModal.date}
          editingPromotion={promotionModal.editing}
          onSave={handleSavePromotion}
          onDelete={promotionModal.editing ? handleDeletePromotion : undefined}
          onClose={() => setPromotionModal(null)}
        />
      )}
    </div>
  )
}

export default App
