import { useState } from 'react'
import type { CellData } from '../SakuView'
import { formatDateTime } from '../lib/format'
import { WEEKDAY_LABELS, parseISODate } from '../../utils/date'
import { isNewEvent } from '../lib/badges'
import type { Anomaly } from '../lib/patterns'
import type { DiffSettings, EventCategory, EventObservation, EventRecord, Store } from '../lib/types'
import { EVENT_CATEGORIES } from '../lib/types'

interface Props {
  store: Store
  date: string
  cell: CellData
  nowIso: string
  settings: DiffSettings
  isManualEntry: (e: EventRecord) => boolean
  onAddObservation: (obs: EventObservation) => void
  onRemoveObservation: (storeId: string, date: string, name: string) => void
  onConfirmNoEvent: () => void
  onClose: () => void
}

const CHANGE_LABELS: Record<string, string> = {
  added: '新規掲載',
  updated: '内容変更',
  date_changed: '開催日変更',
  removed: '掲載終了',
  restored: '再掲載',
}

export function CellModal({
  store,
  date,
  cell,
  nowIso,
  settings,
  isManualEntry,
  onAddObservation,
  onRemoveObservation,
  onConfirmNoEvent,
  onClose,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const d = parseISODate(date)
  const title = `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAY_LABELS[d.getDay()]}) ${store.shortName}`
  const allEvents = [...cell.events, ...cell.removedEvents]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal saku-cell-modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {title}
          {store.isOwn && <span className="saku-own-badge">自店</span>}
        </h3>

        {cell.anomalies.filter((a) => a.kind === 'missing_regular').map((a) => (
          <AnomalyPanel key={`missing-${a.eventName}-${a.evidence.kind}`} anomaly={a} />
        ))}

        {allEvents.length === 0 && (
          <p className="saku-cell-modal__status">
            {cell.infoStatus === 'confirmed_no_event' ? (
              <>
                イベントなし（確認済み）
                {cell.dayStatus && <span className="saku-source__seen"> 最終確認: {formatDateTime(cell.dayStatus.checkedAt)}</span>}
              </>
            ) : (
              '情報なし — この日の掲載はまだ確認できていません（「イベントがない」とは限りません）'
            )}
          </p>
        )}

        {allEvents.map((e) => (
          <div key={e.id} className={`saku-event-item ${e.status === 'removed' ? 'saku-event-item--removed' : ''}`}>
            <button
              type="button"
              className="saku-event-item__head"
              onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}
            >
              {cell.newPatternByEventId.has(e.id) && <em className="saku-warn">⚠</em>}
              <strong>{e.status === 'removed' ? <s>{e.name}</s> : e.name}</strong>
              <span className="saku-event-item__cat">{e.category}</span>
              {isNewEvent(e, nowIso, settings.newBadgeDays) && <em className="saku-badge saku-badge--new">NEW</em>}
              {e.status === 'removed' && <em className="saku-badge saku-badge--removed">削除</em>}
              {e.demo && <em className="saku-badge saku-badge--demo">サンプル</em>}
            </button>

            {cell.newPatternByEventId.has(e.id) && <AnomalyPanel anomaly={cell.newPatternByEventId.get(e.id)!} />}

            {expandedId === e.id && (
              <div className="saku-event-item__detail">
                <dl>
                  <dt>店舗名</dt>
                  <dd>{store.name}</dd>
                  <dt>開催日</dt>
                  <dd>{date}</dd>
                  <dt>イベント名</dt>
                  <dd>{e.name}</dd>
                  <dt>種類</dt>
                  <dd>{e.category}</dd>
                  {e.detail && (
                    <>
                      <dt>詳細</dt>
                      <dd>{e.detail}</dd>
                    </>
                  )}
                  <dt>情報源</dt>
                  <dd>
                    {e.sources.map((s, i) => (
                      <div key={i} className="saku-source">
                        <span>{s.sourceName}</span>
                        <span className="saku-source__seen">最終確認: {formatDateTime(s.lastSeenAt)}</span>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="btn saku-source__open">
                            情報源を開く
                          </a>
                        )}
                      </div>
                    ))}
                  </dd>
                  <dt>初回確認</dt>
                  <dd>{formatDateTime(e.firstSeenAt)}</dd>
                  <dt>最終確認</dt>
                  <dd>{formatDateTime(e.lastSeenAt)}</dd>
                </dl>
                {e.changes.length > 0 && (
                  <div className="saku-changes">
                    <h4>変更履歴</h4>
                    <ul>
                      {e.changes.map((c, i) => (
                        <li key={i}>
                          {formatDateTime(c.at)} {CHANGE_LABELS[c.type] ?? c.type}
                          {c.field === 'date' && c.before && c.after && `（${c.before} → ${c.after}）`}
                          {c.field && c.field !== 'date' && c.before !== undefined && `（${c.before || '-'} → ${c.after || '-'}）`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {isManualEntry(e) && (
                  <button
                    type="button"
                    className="btn btn--danger"
                    onClick={() => onRemoveObservation(e.storeId, e.date, e.name)}
                  >
                    手動登録を取り消す
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        <div className="saku-cell-modal__actions">
          {showAdd ? (
            <QuickAddForm
              store={store}
              date={date}
              onSubmit={(obs) => {
                onAddObservation(obs)
                setShowAdd(false)
              }}
              onCancel={() => setShowAdd(false)}
            />
          ) : (
            <div className="modal__actions">
              <div className="saku-cell-modal__left-actions">
                <button type="button" className="btn" onClick={() => setShowAdd(true)}>
                  ＋ イベントを手動登録
                </button>
                {cell.infoStatus === 'unknown' && (
                  <button type="button" className="btn" onClick={onConfirmNoEvent}>
                    イベントなしを確認した
                  </button>
                )}
              </div>
              <div className="modal__actions-right">
                <button type="button" className="btn" onClick={onClose}>
                  閉じる
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/** 差分の根拠パネル: 必ず「過去N回中M回」の数値で表示する */
function AnomalyPanel({ anomaly }: { anomaly: Anomaly }) {
  const { evidence } = anomaly
  const currentLabel =
    anomaly.currentStatus === 'held' ? '開催' : anomaly.currentStatus === 'not_held' ? '開催なし' : '情報なし'
  return (
    <div className={`saku-anomaly ${anomaly.kind === 'new_pattern' ? 'saku-anomaly--new' : ''}`}>
      <p className="saku-anomaly__title">
        ⚠ {anomaly.kind === 'missing_regular' ? `通常は${anomaly.eventName}` : '新規パターン'}
      </p>
      <p className="saku-anomaly__evidence">
        {evidence.label}の{anomaly.eventName}：過去{evidence.sampleDates.length}回中{evidence.hitDates.length}回開催
        <br />
        今回：{currentLabel}
        {anomaly.firstTimeAtStore && <>（この店舗では初確認のイベント名）</>}
      </p>
      <details className="saku-anomaly__dates">
        <summary>根拠の日付</summary>
        <ul>
          {evidence.sampleDates.map((d) => (
            <li key={d}>
              {d} {evidence.hitDates.includes(d) ? '○ 開催' : '× なし'}
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

const SOURCE_PRESETS = ['DMMぱちタウン', 'P-WORLD', '公式サイト', '公式SNS', 'その他']

function QuickAddForm({
  store,
  date,
  onSubmit,
  onCancel,
}: {
  store: Store
  date: string
  onSubmit: (obs: EventObservation) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<EventCategory>('取材')
  const [sourceName, setSourceName] = useState(SOURCE_PRESETS[0])
  const [url, setUrl] = useState('')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState('')

  const submit = () => {
    if (!name.trim()) {
      setError('イベント名（情報源に掲載されている正式名称）を入力してください')
      return
    }
    onSubmit({
      storeId: store.id,
      date,
      name: name.trim(),
      category,
      detail: detail.trim() || undefined,
      source: {
        sourceId: 'manual',
        sourceName: `${sourceName}(手動確認)`,
        url: url.trim() || undefined,
      },
      observedAt: new Date().toISOString(),
    })
  }

  return (
    <form
      className="saku-quick-add"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <label>
        イベント名（正式名称）
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例: ぞろぞろ取材" />
      </label>
      <div className="modal__row">
        <label>
          種類
          <select value={category} onChange={(e) => setCategory(e.target.value as EventCategory)}>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          確認した情報源
          <select value={sourceName} onChange={(e) => setSourceName(e.target.value)}>
            {SOURCE_PRESETS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label>
        情報源URL（任意）
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." inputMode="url" />
      </label>
      <label>
        詳細（任意）
        <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} />
      </label>
      {error && <p className="modal__error">{error}</p>}
      <div className="modal__actions">
        <div className="modal__actions-right">
          <button type="button" className="btn" onClick={onCancel}>
            キャンセル
          </button>
          <button type="submit" className="btn btn--primary">
            登録
          </button>
        </div>
      </div>
    </form>
  )
}
