import type { CellData } from '../SakuView'
import { isChangedEvent, isNewEvent } from '../lib/badges'
import type { DiffSettings, Store } from '../lib/types'
import { WEEKDAY_LABELS, parseISODate } from '../../utils/date'

interface Props {
  stores: Store[]
  monthDates: string[]
  getCell: (storeId: string, date: string) => CellData
  todayIso: string
  nowIso: string
  settings: DiffSettings
  highlight: { from: string; to: string } | null
  onCellClick: (storeId: string, date: string) => void
  onStoreClick: (storeId: string) => void
}

/** メイン画面: 縦=日付、横=店舗の月間マトリクス */
export function MatrixCalendar({
  stores,
  monthDates,
  getCell,
  todayIso,
  nowIso,
  settings,
  highlight,
  onCellClick,
  onStoreClick,
}: Props) {
  if (stores.length === 0) {
    return <p className="saku-empty">店舗データがありません。</p>
  }

  return (
    <div className="saku-matrix">
      <table>
        <thead>
          <tr>
            <th className="saku-matrix__corner">日付</th>
            {stores.map((s) => (
              <th key={s.id} className={s.isOwn ? 'saku-matrix__store saku-matrix__store--own' : 'saku-matrix__store'}>
                <button type="button" onClick={() => onStoreClick(s.id)} title={s.name}>
                  {s.shortName}
                  {s.isOwn && <span className="saku-own-badge">自店</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthDates.map((date) => {
            const d = parseISODate(date)
            const weekday = d.getDay()
            const isToday = date === todayIso
            const inHighlight = highlight && date >= highlight.from && date <= highlight.to
            const rowClass = [
              isToday ? 'saku-row--today' : '',
              inHighlight ? 'saku-row--highlight' : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <tr key={date} className={rowClass} data-day={date}>
                <th
                  className={`saku-matrix__date ${weekday === 0 ? 'saku-sun' : weekday === 6 ? 'saku-sat' : ''}`}
                  scope="row"
                >
                  <span className="saku-matrix__daynum">{d.getDate()}</span>
                  <span className="saku-matrix__weekday">{WEEKDAY_LABELS[weekday]}</span>
                  {isToday && <span className="saku-today-badge">今日</span>}
                </th>
                {stores.map((s) => (
                  <Cell key={s.id} cell={getCell(s.id, date)} nowIso={nowIso} settings={settings} onClick={() => onCellClick(s.id, date)} isOwn={s.isOwn} />
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Cell({
  cell,
  nowIso,
  settings,
  onClick,
  isOwn,
}: {
  cell: CellData
  nowIso: string
  settings: DiffSettings
  onClick: () => void
  isOwn: boolean
}) {
  const missing = cell.anomalies.filter((a) => a.kind === 'missing_regular')
  const isEmpty = cell.events.length === 0 && cell.removedEvents.length === 0 && missing.length === 0

  return (
    <td className={isOwn ? 'saku-cell saku-cell--own' : 'saku-cell'}>
      <button type="button" className="saku-cell__button" onClick={onClick}>
        {cell.removedEvents.map((e) => (
          <span key={e.id} className="saku-tag saku-tag--removed">
            <s>{e.name}</s>
            <em className="saku-badge saku-badge--removed">削除</em>
          </span>
        ))}
        {cell.events.map((e) => {
          const isNewPattern = cell.newPatternByEventId.has(e.id)
          return (
            <span key={e.id} className={`saku-tag ${isNewPattern ? 'saku-tag--anomaly' : ''}`}>
              {isNewPattern && <em className="saku-warn">⚠</em>}
              {e.name}
              {isNewEvent(e, nowIso, settings.newBadgeDays) && <em className="saku-badge saku-badge--new">NEW</em>}
              {!isNewEvent(e, nowIso, settings.newBadgeDays) && isChangedEvent(e, nowIso, settings.newBadgeDays) && (
                <em className="saku-badge saku-badge--changed">変更</em>
              )}
            </span>
          )
        })}
        {missing.map((a) => (
          <span key={`${a.evidence.kind}-${a.eventName}`} className="saku-tag saku-tag--missing">
            <em className="saku-warn">⚠</em> 通常は{a.eventName}
          </span>
        ))}
        {isEmpty && (
          <span
            className={`saku-cell__none ${cell.infoStatus === 'confirmed_no_event' ? 'saku-cell__none--confirmed' : ''}`}
            title={cell.infoStatus === 'confirmed_no_event' ? 'イベントなし（確認済み）' : '情報なし'}
          >
            —
          </span>
        )}
      </button>
    </td>
  )
}
