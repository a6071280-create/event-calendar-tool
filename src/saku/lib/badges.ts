import type { EventRecord } from './types'

const withinDays = (iso: string, nowIso: string, days: number): boolean => {
  const t = Date.parse(iso)
  const now = Date.parse(nowIso)
  return Number.isFinite(t) && now - t <= days * 86_400_000
}

/** 初回確認から間もないイベント（NEW バッジ） */
export const isNewEvent = (e: EventRecord, nowIso: string, newBadgeDays: number): boolean =>
  e.status === 'active' && withinDays(e.firstSeenAt, nowIso, newBadgeDays)

/** 最近内容が変更されたイベント（変更バッジ） */
export const isChangedEvent = (e: EventRecord, nowIso: string, newBadgeDays: number): boolean =>
  e.changes.some(
    (c) => (c.type === 'updated' || c.type === 'date_changed' || c.type === 'restored') && withinDays(c.at, nowIso, newBadgeDays),
  )

/** 最近削除された（取り下げられた）イベント。しばらく打ち消し表示する */
export const isRecentlyRemoved = (e: EventRecord, nowIso: string, removedBadgeDays: number): boolean =>
  e.status === 'removed' &&
  e.changes.some((c) => (c.type === 'removed' || c.type === 'date_changed') && withinDays(c.at, nowIso, removedBadgeDays))
