import { describe, expect, it } from 'vitest'
import type { EventDb, EventObservation, ObservationBatch } from './types'
import { EMPTY_BATCH } from './types'
import { mergeBatches } from './ingest'

const NOW = '2026-08-08T06:00:00+09:00'

const emptyDb: EventDb = { events: [], dayStatuses: [] }

const obs = (overrides: Partial<EventObservation> = {}): EventObservation => ({
  storeId: 'super-arena-sakudaira',
  date: '2026-08-08',
  name: 'ぞろぞろ取材',
  category: '取材',
  source: { sourceId: 'manual', sourceName: 'DMMぱちタウン(手動確認)', url: 'https://example.com/a' },
  observedAt: '2026-08-01T09:00:00+09:00',
  ...overrides,
})

const batch = (partial: Partial<ObservationBatch>): ObservationBatch => ({ ...EMPTY_BATCH, ...partial })

describe('mergeBatches', () => {
  it('新規イベントを登録する', () => {
    const { db, added } = mergeBatches(emptyDb, [batch({ observations: [obs()] })], NOW)
    expect(added).toBe(1)
    expect(db.events).toHaveLength(1)
    const e = db.events[0]
    expect(e.status).toBe('active')
    expect(e.sources).toHaveLength(1)
    expect(e.changes[0].type).toBe('added')
    expect(e.firstSeenAt).toBe('2026-08-01T09:00:00+09:00')
  })

  it('同一イベントの複数情報源を1レコードにまとめる（重複排除）', () => {
    const batches = [
      batch({
        observations: [
          obs(),
          obs({
            source: { sourceId: 'manual', sourceName: 'P-WORLD(手動確認)', url: 'https://example.com/b' },
            observedAt: '2026-08-02T09:00:00+09:00',
          }),
          // 全角/空白ゆれも同一イベントに名寄せ
          obs({
            name: 'ぞろぞろ 取材',
            source: { sourceId: 'manual', sourceName: '公式SNS(手動確認)' },
            observedAt: '2026-08-03T09:00:00+09:00',
          }),
        ],
      }),
    ]
    const { db, added } = mergeBatches(emptyDb, batches, NOW)
    expect(added).toBe(1)
    expect(db.events).toHaveLength(1)
    expect(db.events[0].sources).toHaveLength(3)
    expect(db.events[0].lastSeenAt).toBe('2026-08-03T09:00:00+09:00')
  })

  it('同じ情報源の再観測は lastSeenAt だけ更新する', () => {
    const first = mergeBatches(emptyDb, [batch({ observations: [obs()] })], NOW)
    const second = mergeBatches(
      first.db,
      [batch({ observations: [obs({ observedAt: '2026-08-05T09:00:00+09:00' })] })],
      '2026-08-05T09:10:00+09:00',
    )
    expect(second.added).toBe(0)
    expect(second.updated).toBe(0)
    expect(second.db.events[0].sources).toHaveLength(1)
    expect(second.db.events[0].lastSeenAt).toBe('2026-08-05T09:00:00+09:00')
  })

  it('内容変更を履歴に記録する', () => {
    const first = mergeBatches(emptyDb, [batch({ observations: [obs()] })], NOW)
    const second = mergeBatches(
      first.db,
      [
        batch({
          observations: [obs({ detail: '10:00開店に変更', observedAt: '2026-08-06T09:00:00+09:00' })],
        }),
      ],
      '2026-08-06T09:10:00+09:00',
    )
    expect(second.updated).toBe(1)
    const changes = second.db.events[0].changes
    expect(changes.some((c) => c.type === 'updated' && c.field === 'detail')).toBe(true)
  })

  it('削除観測で status=removed になり履歴が残る（レコードは消さない）', () => {
    const first = mergeBatches(emptyDb, [batch({ observations: [obs()] })], NOW)
    const second = mergeBatches(
      first.db,
      [
        batch({
          removals: [
            {
              storeId: 'super-arena-sakudaira',
              date: '2026-08-08',
              name: 'ぞろぞろ取材',
              source: { sourceId: 'manual', sourceName: '手動確認' },
              observedAt: '2026-08-07T09:00:00+09:00',
            },
          ],
        }),
      ],
      '2026-08-07T09:10:00+09:00',
    )
    expect(second.removed).toBe(1)
    expect(second.db.events).toHaveLength(1)
    expect(second.db.events[0].status).toBe('removed')
    expect(second.db.events[0].changes.some((c) => c.type === 'removed')).toBe(true)
  })

  it('開催日変更は旧日付の removed と新日付の date_changed 履歴で表現する', () => {
    const first = mergeBatches(emptyDb, [batch({ observations: [obs()] })], NOW)
    const second = mergeBatches(
      first.db,
      [
        batch({
          observations: [obs({ date: '2026-08-09', observedAt: '2026-08-07T09:00:00+09:00' })],
          removals: [
            {
              storeId: 'super-arena-sakudaira',
              date: '2026-08-08',
              name: 'ぞろぞろ取材',
              movedToDate: '2026-08-09',
              source: { sourceId: 'manual', sourceName: '手動確認' },
              observedAt: '2026-08-07T09:00:00+09:00',
            },
          ],
        }),
      ],
      '2026-08-07T09:10:00+09:00',
    )
    const old = second.db.events.find((e) => e.date === '2026-08-08')!
    const moved = second.db.events.find((e) => e.date === '2026-08-09')!
    expect(old.status).toBe('removed')
    expect(old.changes.some((c) => c.type === 'date_changed')).toBe(true)
    expect(moved.status).toBe('active')
    expect(moved.changes.some((c) => c.type === 'date_changed' && c.before === '2026-08-08')).toBe(true)
  })

  it('イベントなし確認を dayStatus として保存する', () => {
    const { db } = mergeBatches(
      emptyDb,
      [
        batch({
          noEvents: [
            {
              storeId: 'maruhan-saku',
              date: '2026-08-08',
              source: { sourceId: 'manual', sourceName: '手動確認' },
              observedAt: '2026-08-08T07:00:00+09:00',
            },
          ],
        }),
      ],
      NOW,
    )
    expect(db.dayStatuses).toHaveLength(1)
    expect(db.dayStatuses[0].status).toBe('confirmed_no_event')
  })

  it('削除より古い観測を再取り込みしても復活しない（同一ファイル再処理の冪等性）', () => {
    const removal = {
      storeId: 'super-arena-sakudaira',
      date: '2026-08-08',
      name: 'ぞろぞろ取材',
      source: { sourceId: 'manual', sourceName: '手動確認' },
      observedAt: '2026-08-06T09:00:00+09:00',
    }
    const first = mergeBatches(
      emptyDb,
      [batch({ observations: [obs()], removals: [removal] })],
      NOW,
    )
    expect(first.db.events[0].status).toBe('removed')
    const changeCount = first.db.events[0].changes.length

    // 同じバッチをもう一度取り込んでも状態・履歴は変わらない
    const second = mergeBatches(
      first.db,
      [batch({ observations: [obs()], removals: [removal] })],
      '2026-08-08T07:00:00+09:00',
    )
    expect(second.db.events[0].status).toBe('removed')
    expect(second.db.events[0].changes).toHaveLength(changeCount)
    expect(second.updated).toBe(0)
  })

  it('削除後に再掲載されたら restored 履歴付きで active に戻す', () => {
    const first = mergeBatches(emptyDb, [batch({ observations: [obs()] })], NOW)
    const second = mergeBatches(
      first.db,
      [
        batch({
          removals: [
            {
              storeId: 'super-arena-sakudaira',
              date: '2026-08-08',
              name: 'ぞろぞろ取材',
              source: { sourceId: 'manual', sourceName: '手動確認' },
              observedAt: '2026-08-06T09:00:00+09:00',
            },
          ],
        }),
      ],
      '2026-08-06T09:10:00+09:00',
    )
    const third = mergeBatches(
      second.db,
      [batch({ observations: [obs({ observedAt: '2026-08-07T09:00:00+09:00' })] })],
      '2026-08-07T09:10:00+09:00',
    )
    expect(third.db.events[0].status).toBe('active')
    expect(third.db.events[0].changes.some((c) => c.type === 'restored')).toBe(true)
  })
})
