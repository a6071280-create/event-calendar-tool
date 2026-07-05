import { useState } from 'react'
import type { CompetitorEvent, EventType, Prefecture, TimeSlot } from '../types'
import { EVENT_TYPES, PREFECTURES, TIME_SLOTS } from '../types'
import { NAGANO_PREFECTURE } from '../constants'

export type EventInput = Omit<CompetitorEvent, 'id' | 'createdAt' | 'updatedAt'>

interface EventModalProps {
  initialDate: string
  editingEvent?: CompetitorEvent
  storeNameSuggestions: string[]
  onSave: (input: EventInput) => void
  onDelete?: () => void
  onClose: () => void
}

export function EventModal({
  initialDate,
  editingEvent,
  storeNameSuggestions,
  onSave,
  onDelete,
  onClose,
}: EventModalProps) {
  const [storeName, setStoreName] = useState(editingEvent?.storeName ?? '')
  const [prefecture, setPrefecture] = useState<Prefecture>(editingEvent?.prefecture ?? NAGANO_PREFECTURE)
  const [area, setArea] = useState(editingEvent?.area ?? '')
  const [date, setDate] = useState(editingEvent?.date ?? initialDate)
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(editingEvent?.timeSlot ?? '終日')
  const [eventType, setEventType] = useState<EventType>(editingEvent?.eventType ?? EVENT_TYPES[0])
  const [memo, setMemo] = useState(editingEvent?.memo ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!storeName.trim()) {
      setError('店舗名を入力してください')
      return
    }
    if (!date) {
      setError('実施日を入力してください')
      return
    }
    onSave({ storeName: storeName.trim(), prefecture, area: area.trim(), date, timeSlot, eventType, memo })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editingEvent ? 'イベントを編集' : '競合イベントを登録'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            店舗名
            <input
              list="store-name-suggestions"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="例: ○○ホール△△店"
              autoFocus
            />
            <datalist id="store-name-suggestions">
              {storeNameSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <div className="modal__row">
            <label>
              都道府県
              <select value={prefecture} onChange={(e) => setPrefecture(e.target.value as Prefecture)}>
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label>
              エリア(市町村)
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="例: 長野市" />
            </label>
          </div>
          <div className="modal__row">
            <label>
              実施日
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label>
              時間帯
              <select value={timeSlot} onChange={(e) => setTimeSlot(e.target.value as TimeSlot)}>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            イベント種別
            <select value={eventType} onChange={(e) => setEventType(e.target.value as EventType)}>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            メモ
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} />
          </label>
          {error && <p className="modal__error">{error}</p>}
          <div className="modal__actions">
            {editingEvent && onDelete && (
              <button type="button" className="btn btn--danger" onClick={onDelete}>
                削除
              </button>
            )}
            <div className="modal__actions-right">
              <button type="button" className="btn" onClick={onClose}>
                キャンセル
              </button>
              <button type="submit" className="btn btn--primary">
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
