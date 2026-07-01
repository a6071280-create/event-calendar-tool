import { useState } from 'react'
import type { OwnPromotionDay } from '../types'

export type OwnPromotionInput = Omit<OwnPromotionDay, 'id' | 'createdAt'>

interface OwnPromotionModalProps {
  initialDate: string
  editingPromotion?: OwnPromotionDay
  onSave: (input: OwnPromotionInput) => void
  onDelete?: () => void
  onClose: () => void
}

export function OwnPromotionModal({
  initialDate,
  editingPromotion,
  onSave,
  onDelete,
  onClose,
}: OwnPromotionModalProps) {
  const [title, setTitle] = useState(editingPromotion?.title ?? '')
  const [date, setDate] = useState(editingPromotion?.date ?? initialDate)
  const [memo, setMemo] = useState(editingPromotion?.memo ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('施策名を入力してください')
      return
    }
    if (!date) {
      setError('実施日を入力してください')
      return
    }
    onSave({ title: title.trim(), date, memo })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{editingPromotion ? '自社販促日を編集' : '自社販促日を登録'}</h3>
        <form onSubmit={handleSubmit}>
          <label>
            施策名
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: スロセレ" autoFocus />
          </label>
          <label>
            実施日
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            メモ
            <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} />
          </label>
          {error && <p className="modal__error">{error}</p>}
          <div className="modal__actions">
            {editingPromotion && onDelete && (
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
