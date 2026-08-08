import { describe, expect, it } from 'vitest'
import { extractDates, extractEventObservations, type XPost } from './xExtract'

const post = (text: string, createdAt = '2026-08-08T09:00:00+09:00'): XPost => ({
  id: '1',
  text,
  createdAt,
  url: 'https://x.com/dynam_00286/status/1',
})

describe('extractDates', () => {
  it('M/D と M月D日 を抽出する', () => {
    const dates = extractDates('8/18と8月28日はアツい', '2026-08-08T09:00:00+09:00')
    expect(dates.map((d) => d.iso).sort()).toEqual(['2026-08-18', '2026-08-28'])
  })

  it('本日・明日を投稿日基準で解決する', () => {
    const dates = extractDates('本日と明日は営業時間変更', '2026-08-31T09:00:00+09:00')
    expect(dates.map((d) => d.iso).sort()).toEqual(['2026-08-31', '2026-09-01'])
  })

  it('年またぎ: 12月の投稿にある1月の日付は翌年になる', () => {
    const dates = extractDates('1/8 新台入替', '2026-12-28T09:00:00+09:00')
    expect(dates[0].iso).toBe('2027-01-08')
  })

  it('存在しない日付は無視する', () => {
    expect(extractDates('2/30に開催', '2026-02-01T09:00:00+09:00')).toEqual([])
  })
})

describe('extractEventObservations', () => {
  it('日付+キーワードのある投稿から観測を作る', () => {
    const obs = extractEventObservations(
      post('【8/18】「ぞろぞろ取材」決定！お楽しみに！'),
      'dynam-nagano-saku',
      '公式X(@dynam_00286)',
    )
    expect(obs).toHaveLength(1)
    expect(obs[0]).toMatchObject({
      storeId: 'dynam-nagano-saku',
      date: '2026-08-18',
      name: 'ぞろぞろ取材',
      category: '取材',
    })
    expect(obs[0].source.url).toBe('https://x.com/dynam_00286/status/1')
  })

  it('「」がなければキーワードを名称にする', () => {
    const obs = extractEventObservations(post('8月10日 新台入替です'), 's', 'X')
    expect(obs[0].name).toBe('新台入替')
    expect(obs[0].category).toBe('新台入替')
  })

  it('キーワードがない投稿は取り込まない', () => {
    expect(extractEventObservations(post('8/18は通常営業です'), 's', 'X')).toHaveLength(0)
  })

  it('日付がない投稿は取り込まない', () => {
    expect(extractEventObservations(post('近日、取材が入ります！'), 's', 'X')).toHaveLength(0)
  })

  it('遠すぎる日付（過去45日超・未来90日超）は捨てる', () => {
    const obs = extractEventObservations(post('去年の1/8の取材の思い出'), 's', 'X')
    expect(obs).toHaveLength(0)
  })

  it('実戦系キーワードは実践来店に分類する', () => {
    const obs = extractEventObservations(post('8/11 実戦取材やります'), 's', 'X')
    expect(obs[0].category).toBe('実践来店')
  })

  it('複数日付は日付ごとに観測を作る', () => {
    const obs = extractEventObservations(post('8/18・8/28「特日取材」'), 's', 'X')
    expect(obs.map((o) => o.date)).toEqual(['2026-08-18', '2026-08-28'])
  })

  it('掲載日(年付き)とイベント日(M/D)が混在する場合はイベント日だけを使う', () => {
    const obs = extractEventObservations(post('2026/07/18 ★7/24新台入替★'), 's', 'X')
    expect(obs).toHaveLength(1)
    expect(obs[0].date).toBe('2026-07-24')
  })

  it('年付き日付しかない場合はそのまま使う', () => {
    const obs = extractEventObservations(post('2026年8月14日 新台入替'), 's', 'X')
    expect(obs).toHaveLength(1)
    expect(obs[0].date).toBe('2026-08-14')
  })
})
