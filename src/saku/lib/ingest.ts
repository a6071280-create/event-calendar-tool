/**
 * 観測(Observation)をイベントDBへマージする純粋ロジック。
 * collector（定期実行）とフロントエンド（手動登録オーバーレイ）の両方で同じ実装を使う。
 *
 * ルール:
 * - イベントの同一性は 店舗ID×開催日×正規化名称。複数情報源の同一イベントは1レコードに
 *   まとめ、sources[] に情報源を紐付ける（重複排除）。
 * - レコードは削除しない。取り下げは status='removed' とし、履歴を changes[] に残す。
 * - 内容変更（種類・詳細）は changes[] に before/after を記録する。
 */
import type {
  DayStatusRecord,
  EventCategory,
  EventChange,
  EventDb,
  EventObservation,
  EventRecord,
  NoEventObservation,
  ObservationBatch,
  RemovalObservation,
} from './types'
import { dayStatusKey, eventIdFromKey, eventKey, normalizeEventName } from './normalize'

// タイムゾーン表記（+09:00 / Z）が混在しても正しく比較できるよう実時刻で比較する
const maxIso = (a: string, b: string): string => (Date.parse(a) > Date.parse(b) ? a : b)
const minIso = (a: string, b: string): string => (Date.parse(a) < Date.parse(b) ? a : b)

const cloneEvent = (e: EventRecord): EventRecord => ({
  ...e,
  sources: e.sources.map((s) => ({ ...s })),
  changes: e.changes.map((c) => ({ ...c })),
})

const mergeSourceRef = (event: EventRecord, obs: EventObservation | RemovalObservation): void => {
  const url = 'url' in obs.source ? obs.source.url : undefined
  const existing = event.sources.find(
    (s) => s.sourceId === obs.source.sourceId && (s.url ?? null) === (url ?? null),
  )
  if (existing) {
    existing.lastSeenAt = maxIso(existing.lastSeenAt, obs.observedAt)
    existing.firstSeenAt = minIso(existing.firstSeenAt, obs.observedAt)
  } else {
    event.sources.push({
      sourceId: obs.source.sourceId,
      sourceName: obs.source.sourceName,
      url: url ?? null,
      firstSeenAt: obs.observedAt,
      lastSeenAt: obs.observedAt,
    })
  }
}

const applyEventObservation = (
  byKey: Map<string, EventRecord>,
  obs: EventObservation,
  now: string,
): void => {
  const key = eventKey(obs.storeId, obs.date, obs.name)
  const existing = byKey.get(key)

  if (!existing) {
    const record: EventRecord = {
      id: eventIdFromKey(key),
      storeId: obs.storeId,
      date: obs.date,
      name: obs.name,
      category: obs.category,
      detail: obs.detail,
      status: 'active',
      sources: [],
      firstSeenAt: obs.observedAt,
      lastSeenAt: obs.observedAt,
      createdAt: now,
      updatedAt: now,
      changes: [{ at: obs.observedAt, type: 'added' }],
      demo: obs.demo || undefined,
    }
    mergeSourceRef(record, obs)
    byKey.set(key, record)
    return
  }

  const changes: EventChange[] = []
  if (existing.status === 'removed') {
    existing.status = 'active'
    changes.push({ at: obs.observedAt, type: 'restored' })
  }
  if (existing.category !== obs.category) {
    changes.push({
      at: obs.observedAt,
      type: 'updated',
      field: 'category',
      before: existing.category,
      after: obs.category,
    })
    existing.category = obs.category
  }
  if (obs.detail !== undefined && obs.detail !== '' && (existing.detail ?? '') !== obs.detail) {
    changes.push({
      at: obs.observedAt,
      type: 'updated',
      field: 'detail',
      before: existing.detail ?? '',
      after: obs.detail,
    })
    existing.detail = obs.detail
  }
  if (!obs.demo) existing.demo = undefined

  mergeSourceRef(existing, obs)
  existing.firstSeenAt = minIso(existing.firstSeenAt, obs.observedAt)
  existing.lastSeenAt = maxIso(existing.lastSeenAt, obs.observedAt)
  if (changes.length > 0) {
    existing.changes.push(...changes)
    existing.updatedAt = now
  }
}

const applyRemoval = (
  byKey: Map<string, EventRecord>,
  removal: RemovalObservation,
  now: string,
): void => {
  const key = eventKey(removal.storeId, removal.date, removal.name)
  const existing = byKey.get(key)
  if (!existing || existing.status === 'removed') return

  existing.status = 'removed'
  existing.changes.push(
    removal.movedToDate
      ? {
          at: removal.observedAt,
          type: 'date_changed',
          field: 'date',
          before: removal.date,
          after: removal.movedToDate,
        }
      : { at: removal.observedAt, type: 'removed' },
  )
  existing.updatedAt = now

  // 開催日変更: 変更後の日付側のレコードに date_changed 履歴を付ける
  if (removal.movedToDate) {
    const movedKey = eventKey(removal.storeId, removal.movedToDate, removal.name)
    const moved = byKey.get(movedKey)
    if (moved && !moved.changes.some((c) => c.type === 'date_changed')) {
      moved.changes.push({
        at: removal.observedAt,
        type: 'date_changed',
        field: 'date',
        before: removal.date,
        after: removal.movedToDate,
      })
      moved.updatedAt = now
    }
  }
}

const applyNoEvent = (
  byDay: Map<string, DayStatusRecord>,
  obs: NoEventObservation,
): void => {
  const key = dayStatusKey(obs.storeId, obs.date)
  const existing = byDay.get(key)
  if (existing) {
    existing.checkedAt = maxIso(existing.checkedAt, obs.observedAt)
    if (obs.observedAt >= existing.checkedAt) existing.sourceName = obs.source.sourceName
  } else {
    byDay.set(key, {
      storeId: obs.storeId,
      date: obs.date,
      status: 'confirmed_no_event',
      checkedAt: obs.observedAt,
      sourceName: obs.source.sourceName,
    })
  }
}

export interface MergeResult {
  db: EventDb
  added: number
  updated: number
  removed: number
}

/** DBへ観測バッチ群をマージした新しいDBを返す（入力は変更しない）。 */
export const mergeBatches = (
  db: EventDb,
  batches: ObservationBatch[],
  now: string,
): MergeResult => {
  const byKey = new Map<string, EventRecord>()
  for (const e of db.events) {
    byKey.set(eventKey(e.storeId, e.date, e.name), cloneEvent(e))
  }
  const byDay = new Map<string, DayStatusRecord>()
  for (const d of db.dayStatuses) {
    byDay.set(dayStatusKey(d.storeId, d.date), { ...d })
  }

  const before = new Map<string, { status: string; changeCount: number }>()
  for (const [k, e] of byKey) before.set(k, { status: e.status, changeCount: e.changes.length })

  for (const batch of batches) {
    for (const obs of batch.observations) applyEventObservation(byKey, obs, now)
    for (const removal of batch.removals) applyRemoval(byKey, removal, now)
    for (const noEvent of batch.noEvents) applyNoEvent(byDay, noEvent)
  }

  let added = 0
  let updated = 0
  let removed = 0
  for (const [k, e] of byKey) {
    const prev = before.get(k)
    if (!prev) added++
    else if (e.status === 'removed' && prev.status !== 'removed') removed++
    else if (e.changes.length > prev.changeCount) updated++
  }

  const events = [...byKey.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.storeId.localeCompare(b.storeId) || a.name.localeCompare(b.name),
  )
  const dayStatuses = [...byDay.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.storeId.localeCompare(b.storeId),
  )

  return { db: { events, dayStatuses }, added, updated, removed }
}

/** 表示用: 店舗×日付の情報状態を導出する。 */
export const dayInfoStatus = (
  hasActiveEvents: boolean,
  dayStatus: DayStatusRecord | undefined,
): 'confirmed_event' | 'confirmed_no_event' | 'unknown' => {
  if (hasActiveEvents) return 'confirmed_event'
  if (dayStatus) return 'confirmed_no_event'
  return 'unknown'
}

export { normalizeEventName }
export type { EventCategory }
