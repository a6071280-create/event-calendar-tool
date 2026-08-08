import { useCallback, useMemo, useRef, useState } from 'react'
import { formatDateTime } from './lib/format'
import { MONTH_LABEL, addDays, addMonths, endOfWeek, parseISODate, startOfWeek, toISODate } from '../utils/date'
import { CellModal } from './components/CellModal'
import { FilterBar } from './components/FilterBar'
import type { DiffFilterKey, GroupKey, StoreFilter } from './components/FilterBar'
import { MatrixCalendar } from './components/MatrixCalendar'
import { StoreModal } from './components/StoreModal'
import { useManualOverlay } from './hooks/useManualOverlay'
import { useSakuDataset } from './hooks/useSakuDataset'
import { isChangedEvent, isNewEvent, isRecentlyRemoved } from './lib/badges'
import { dayInfoStatus, mergeBatches } from './lib/ingest'
import { normalizeEventName } from './lib/normalize'
import {
  buildStoreHistoryIndex,
  detectAnomaliesForDay,
  type Anomaly,
  type StoreHistoryIndex,
} from './lib/patterns'
import type { DayInfoStatus, DayStatusRecord, EventRecord, Store } from './lib/types'
import { CATEGORY_GROUPS } from './lib/types'

export interface CellData {
  storeId: string
  date: string
  /** 表示するアクティブイベント（フィルタ適用済み） */
  events: EventRecord[]
  /** 最近取り下げられたイベント */
  removedEvents: EventRecord[]
  /** フィルタ適用済みの差分 */
  anomalies: Anomaly[]
  infoStatus: DayInfoStatus
  dayStatus?: DayStatusRecord
  /** イベントID -> new_pattern 差分 */
  newPatternByEventId: Map<string, Anomaly>
}

const ALL_GROUP_KEYS = CATEGORY_GROUPS.map((g) => g.key) as GroupKey[]

export function SakuView() {
  const { dataset, loading, error } = useSakuDataset()
  const overlay = useManualOverlay()

  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [storeFilter, setStoreFilter] = useState<StoreFilter>('all')
  const [groupKeys, setGroupKeys] = useState<GroupKey[]>(ALL_GROUP_KEYS)
  const [diffKeys, setDiffKeys] = useState<DiffFilterKey[]>([])
  const [cellModal, setCellModal] = useState<{ storeId: string; date: string } | null>(null)
  const [storeModalId, setStoreModalId] = useState<string | null>(null)
  const [highlight, setHighlight] = useState<{ from: string; to: string } | null>(null)
  const matrixRef = useRef<HTMLDivElement>(null)

  const nowIso = useMemo(() => new Date().toISOString(), [])
  const todayIso = toISODate(new Date())
  const settings = dataset.settings

  // データセット + 手動登録オーバーレイを同一ロジックで合成
  const db = useMemo(
    () =>
      mergeBatches(
        { events: dataset.events, dayStatuses: dataset.dayStatuses },
        [overlay.batch],
        nowIso,
      ).db,
    [dataset, overlay.batch, nowIso],
  )

  const visibleStores: Store[] = useMemo(() => {
    const open = dataset.stores.filter((s) => s.businessStatus !== 'closed')
    if (storeFilter === 'all') return open
    if (storeFilter === 'own') return open.filter((s) => s.isOwn)
    return open.filter((s) => s.id === storeFilter)
  }, [dataset.stores, storeFilter])

  const indexes = useMemo(() => {
    const map = new Map<string, StoreHistoryIndex>()
    for (const s of dataset.stores) {
      map.set(s.id, buildStoreHistoryIndex(s.id, db.events, db.dayStatuses))
    }
    return map
  }, [dataset.stores, db])

  const monthDates = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const last = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: last }, (_, i) => toISODate(new Date(year, month, i + 1)))
  }, [currentMonth])

  const allowedCategories = useMemo(() => {
    const set = new Set<string>()
    for (const g of CATEGORY_GROUPS) {
      if (groupKeys.includes(g.key as GroupKey)) g.categories.forEach((c) => set.add(c))
    }
    return set
  }, [groupKeys])

  const eventsByCell = useMemo(() => {
    const map = new Map<string, EventRecord[]>()
    for (const e of db.events) {
      const key = `${e.storeId}|${e.date}`
      const list = map.get(key)
      if (list) list.push(e)
      else map.set(key, [e])
    }
    return map
  }, [db])

  const dayStatusByCell = useMemo(() => {
    const map = new Map<string, DayStatusRecord>()
    for (const d of db.dayStatuses) map.set(`${d.storeId}|${d.date}`, d)
    return map
  }, [db])

  const anomaliesByCell = useMemo(() => {
    const map = new Map<string, Anomaly[]>()
    for (const store of dataset.stores) {
      const index = indexes.get(store.id)
      if (!index) continue
      for (const date of monthDates) {
        const anomalies = detectAnomaliesForDay(index, store.id, date, settings)
        if (anomalies.length > 0) map.set(`${store.id}|${date}`, anomalies)
      }
    }
    return map
  }, [dataset.stores, indexes, monthDates, settings])

  const diffActive = diffKeys.length > 0

  const getCell = useCallback(
    (storeId: string, date: string): CellData => {
      const key = `${storeId}|${date}`
      const all = eventsByCell.get(key) ?? []
      const active = all.filter((e) => e.status === 'active')
      const anomalies = (anomaliesByCell.get(key) ?? []).filter(
        (a) => !a.category || allowedCategories.has(a.category),
      )
      const newPatternByEventId = new Map<string, Anomaly>()
      for (const a of anomalies) {
        if (a.kind === 'new_pattern' && a.eventId) newPatternByEventId.set(a.eventId, a)
      }

      let events = active.filter((e) => allowedCategories.has(e.category))
      let removedEvents = all.filter((e) => isRecentlyRemoved(e, nowIso, settings.removedBadgeDays))
      let cellAnomalies = anomalies
      if (diffActive) {
        events = events.filter(
          (e) =>
            (diffKeys.includes('anomaly') && newPatternByEventId.has(e.id)) ||
            (diffKeys.includes('new') && isNewEvent(e, nowIso, settings.newBadgeDays)) ||
            (diffKeys.includes('changed') && isChangedEvent(e, nowIso, settings.newBadgeDays)),
        )
        removedEvents = diffKeys.includes('changed') ? removedEvents : []
        cellAnomalies = diffKeys.includes('anomaly')
          ? anomalies.filter((a) => a.kind === 'missing_regular' || a.eventId == null || events.some((e) => e.id === a.eventId))
          : []
      }

      const dayStatus = dayStatusByCell.get(key)
      return {
        storeId,
        date,
        events,
        removedEvents,
        anomalies: cellAnomalies,
        infoStatus: dayInfoStatus(active.length > 0, dayStatus),
        dayStatus,
        newPatternByEventId,
      }
    },
    [eventsByCell, anomaliesByCell, dayStatusByCell, allowedCategories, diffActive, diffKeys, nowIso, settings],
  )

  const scrollToDate = useCallback((date: string) => {
    requestAnimationFrame(() => {
      const el = matrixRef.current?.querySelector(`[data-day="${date}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [])

  const jumpToday = () => {
    setCurrentMonth(new Date())
    setHighlight({ from: todayIso, to: todayIso })
    scrollToDate(todayIso)
  }
  const jumpTomorrow = () => {
    const tomorrow = toISODate(addDays(new Date(), 1))
    setCurrentMonth(parseISODate(tomorrow))
    setHighlight({ from: tomorrow, to: tomorrow })
    scrollToDate(tomorrow)
  }
  const jumpThisWeek = () => {
    const from = toISODate(startOfWeek(new Date()))
    const to = toISODate(endOfWeek(new Date()))
    setCurrentMonth(new Date())
    setHighlight({ from, to })
    scrollToDate(todayIso)
  }

  const regionLabel = dataset.regions.find((r) => r.enabled)
  const cellModalStore = cellModal ? dataset.stores.find((s) => s.id === cellModal.storeId) : undefined
  const storeModalStore = storeModalId ? dataset.stores.find((s) => s.id === storeModalId) : undefined

  return (
    <div className="saku-view">
      <div className="saku-toolbar">
        <div className="saku-toolbar__month">
          <button type="button" onClick={() => setCurrentMonth((m) => addMonths(m, -1))}>◀ 前月</button>
          <h2>
            {regionLabel ? `${regionLabel.prefecture}${regionLabel.city}` : ''}・{MONTH_LABEL(currentMonth)}
          </h2>
          <button type="button" onClick={() => setCurrentMonth((m) => addMonths(m, 1))}>次月 ▶</button>
        </div>
        <div className="saku-toolbar__jump">
          <button type="button" onClick={jumpToday}>今日</button>
          <button type="button" onClick={jumpTomorrow}>明日</button>
          <button type="button" onClick={jumpThisWeek}>今週</button>
        </div>
      </div>

      {dataset.containsDemoData && (
        <div className="saku-banner saku-banner--demo">
          サンプルデータ表示中 — 実データの取り込みを始めると自動的に置き換わります（data/manual/README.md 参照）
        </div>
      )}
      {error && <div className="saku-banner saku-banner--error">{error}</div>}
      {loading && <div className="saku-banner">読み込み中…</div>}

      <FilterBar
        stores={dataset.stores}
        storeFilter={storeFilter}
        onStoreFilterChange={setStoreFilter}
        groupKeys={groupKeys}
        onGroupKeysChange={setGroupKeys}
        diffKeys={diffKeys}
        onDiffKeysChange={setDiffKeys}
        manualCount={overlay.entryCount}
        onExport={overlay.exportJson}
        onClear={() => {
          if (window.confirm('手動登録した内容をすべて消去します。エクスポート済みであることを確認してください。')) {
            overlay.clear()
          }
        }}
      />

      <div ref={matrixRef}>
        <MatrixCalendar
          stores={visibleStores}
          monthDates={monthDates}
          getCell={getCell}
          todayIso={todayIso}
          nowIso={nowIso}
          settings={settings}
          highlight={highlight}
          onCellClick={(storeId, date) => setCellModal({ storeId, date })}
          onStoreClick={setStoreModalId}
        />
      </div>

      {dataset.generatedAt && (
        <p className="saku-meta">データ最終更新: {formatDateTime(dataset.generatedAt)}（1日3回自動更新）</p>
      )}

      {cellModal && cellModalStore && (
        <CellModal
          store={cellModalStore}
          date={cellModal.date}
          cell={getCell(cellModal.storeId, cellModal.date)}
          nowIso={nowIso}
          settings={settings}
          isManualEntry={(e) =>
            overlay.batch.observations.some(
              (o) =>
                o.storeId === e.storeId &&
                o.date === e.date &&
                normalizeEventName(o.name) === normalizeEventName(e.name),
            )
          }
          onAddObservation={overlay.addObservation}
          onRemoveObservation={overlay.removeObservation}
          onConfirmNoEvent={() =>
            overlay.addNoEvent({
              storeId: cellModal.storeId,
              date: cellModal.date,
              source: { sourceId: 'manual', sourceName: '手動確認' },
              observedAt: new Date().toISOString(),
            })
          }
          onClose={() => setCellModal(null)}
        />
      )}

      {storeModalStore && (
        <StoreModal
          store={storeModalStore}
          index={indexes.get(storeModalStore.id)}
          events={db.events.filter((e) => e.storeId === storeModalStore.id)}
          todayIso={todayIso}
          settings={settings}
          onClose={() => setStoreModalId(null)}
        />
      )}
    </div>
  )
}
