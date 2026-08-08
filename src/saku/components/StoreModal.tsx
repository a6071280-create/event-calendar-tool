import { formatDateTime } from '../lib/format'
import { summarizeRegularPatterns, type StoreHistoryIndex } from '../lib/patterns'
import type { DiffSettings, EventRecord, Store } from '../lib/types'

interface Props {
  store: Store
  index?: StoreHistoryIndex
  events: EventRecord[]
  todayIso: string
  settings: DiffSettings
  onClose: () => void
}

/** 店舗詳細: 基本情報・通常パターン・過去イベント履歴 */
export function StoreModal({ store, index, events, todayIso, settings, onClose }: Props) {
  const patterns = index ? summarizeRegularPatterns(index, store.id, todayIso, settings) : []
  const history = [...events]
    .filter((e) => e.date <= todayIso)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 40)

  const links: { label: string; url: string }[] = []
  if (store.urls.official) links.push({ label: '公式サイト', url: store.urls.official })
  if (store.urls.dmmPtown) links.push({ label: 'DMMぱちタウン', url: store.urls.dmmPtown })
  if (store.urls.pworld) links.push({ label: 'P-WORLD', url: store.urls.pworld })
  for (const sns of store.urls.sns ?? []) links.push({ label: '公式SNS', url: sns })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal saku-store-modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {store.name}
          {store.isOwn && <span className="saku-own-badge">自店</span>}
        </h3>
        <p className="saku-store-modal__address">{store.address}</p>
        {links.length > 0 && (
          <p className="saku-store-modal__links">
            {links.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            ))}
          </p>
        )}

        <h4>通常パターン（過去実績の集計）</h4>
        {patterns.length === 0 ? (
          <p className="saku-store-modal__empty">
            比較可能な実績が{settings.minSamples}回以上たまると通常パターンを表示します。
          </p>
        ) : (
          <ul className="saku-pattern-list">
            {patterns.map((p) => (
              <li key={`${p.kind}-${p.label}-${p.eventName}`}>
                <strong>
                  {p.kind === 'dayOfMonth' ? '毎月' : '毎週'}
                  {p.label}
                </strong>{' '}
                {p.eventName}
                <span className="saku-pattern-list__stat">
                  過去{p.samples}回中{p.hits}回
                </span>
              </li>
            ))}
          </ul>
        )}

        <h4>過去イベント履歴（直近{history.length}件）</h4>
        {history.length === 0 ? (
          <p className="saku-store-modal__empty">過去のイベント実績はまだありません。</p>
        ) : (
          <table className="saku-history">
            <tbody>
              {history.map((e) => (
                <tr key={e.id} className={e.status === 'removed' ? 'saku-history--removed' : ''}>
                  <td>{e.date}</td>
                  <td>{e.status === 'removed' ? <s>{e.name}</s> : e.name}</td>
                  <td>{e.category}</td>
                  <td className="saku-history__seen">{formatDateTime(e.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="modal__actions">
          <div className="modal__actions-right">
            <button type="button" className="btn" onClick={onClose}>
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
