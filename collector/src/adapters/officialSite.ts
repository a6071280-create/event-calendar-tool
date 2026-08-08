/**
 * 店舗公式サイト用アダプタの雛形。
 *
 * 【重要】既定では無効。有効化する前に必ず店舗ごとに
 *   1. サイトの利用規約に自動取得を禁じる条項がないこと
 *   2. robots.txt（politeFetch が機械的に確認する）
 * を確認し、data/sources.json の official_site.enabled を true にした上で、
 * 下の SITE_CONFIGS に対象店舗の設定を追加すること。
 *
 * politeFetch は robots.txt が許可しない URL の取得を拒否し、
 * ホストごとに最低5秒（Crawl-delay があればそれ以上）の間隔を空ける。
 */
import type { EventObservation, ObservationBatch } from '../../../src/saku/lib/types'
import { EMPTY_BATCH } from '../../../src/saku/lib/types'
import { politeFetch, PolitenessError } from '../politeFetch'
import type { Adapter, AdapterContext } from './types'

interface OfficialSiteConfig {
  storeId: string
  /** イベント告知が掲載されるページ */
  url: string
  /**
   * ページのHTMLからイベント観測を抽出する。サイトごとに実装する。
   * 抽出できる形式が変わったら null を返し、運用者へログで知らせる。
   */
  extract: (html: string, ctx: AdapterContext) => EventObservation[] | null
}

/** 許可確認済みサイトの設定をここへ追加する（現在は0件） */
const SITE_CONFIGS: OfficialSiteConfig[] = []

export const officialSiteAdapter: Adapter = {
  sourceId: 'official_site',
  async collect(ctx: AdapterContext): Promise<ObservationBatch> {
    const batch: ObservationBatch = { observations: [], noEvents: [], removals: [] }
    for (const config of SITE_CONFIGS) {
      try {
        const res = await politeFetch(config.url)
        if (!res.ok) {
          console.warn(`[official_site] ${config.storeId}: HTTP ${res.status}`)
          continue
        }
        const extracted = config.extract(await res.text(), ctx)
        if (extracted === null) {
          console.warn(`[official_site] ${config.storeId}: 抽出失敗（ページ構造が変わった可能性）`)
          continue
        }
        batch.observations.push(...extracted)
        // ページを正常に確認できてイベントが無かった日は confirmed_no_event を記録できる
        // （対象日付範囲の扱いはサイトごとの extract 実装に委ねる）
      } catch (err) {
        if (err instanceof PolitenessError) {
          console.warn(`[official_site] ${config.storeId}: robots.txt により取得不可 — 設定を無効化してください`)
        } else {
          console.warn(`[official_site] ${config.storeId}: ${String(err)}`)
        }
      }
    }
    return SITE_CONFIGS.length === 0 ? EMPTY_BATCH : batch
  },
}
