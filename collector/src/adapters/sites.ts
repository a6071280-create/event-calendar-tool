/**
 * 汎用ページ収集アダプタ。data/site-sources.json に登録されたページを
 * politeFetch（robots.txt 遵守・アクセス間隔制御を機械的に強制）で取得し、
 * DOM構造に依存しないテキストブロック抽出でイベント観測を作る。
 *
 * - mode: 'store'  … 特定店舗のページ。全ブロックを対象に抽出
 * - mode: 'media'  … 取材メディア等の複数ホール掲載ページ。
 *                     登録店舗名を含むブロックだけを対象に抽出
 */
import fs from 'node:fs'
import type { EventObservation, ObservationBatch, Store } from '../../../src/saku/lib/types'
import { EMPTY_BATCH } from '../../../src/saku/lib/types'
import { extractFromText } from '../extractCore'
import { htmlToTextBlocks } from '../htmlText'
import { SITE_SOURCES_FILE } from '../paths'
import { politeFetch, PolitenessError } from '../politeFetch'
import type { Adapter, AdapterContext } from './types'

export interface SiteConfig {
  id: string
  mode: 'store' | 'media'
  storeId?: string
  sourceId: string
  sourceName: string
  url: string
  enabled: boolean
  notes?: string
}

/** 1サイトあたりの観測数上限（抽出暴走時の安全弁） */
const MAX_OBSERVATIONS_PER_SITE = 60

const normalize = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '')

/** ブロックがどの登録店舗のものか判定する（店舗名・略称の包含一致） */
export const matchStore = (block: string, stores: Store[]): Store | null => {
  const norm = normalize(block)
  for (const store of stores) {
    if (norm.includes(normalize(store.name)) || norm.includes(normalize(store.shortName))) {
      return store
    }
  }
  return null
}

export const extractFromPage = (
  html: string,
  site: SiteConfig,
  stores: Store[],
  nowIso: string,
): EventObservation[] => {
  const blocks = htmlToTextBlocks(html)
  const observations: EventObservation[] = []
  const source = { sourceId: site.sourceId, sourceName: site.sourceName, url: site.url }

  for (const block of blocks) {
    if (observations.length >= MAX_OBSERVATIONS_PER_SITE) break
    const storeId =
      site.mode === 'store' ? (site.storeId ?? null) : (matchStore(block, stores)?.id ?? null)
    if (!storeId) continue
    observations.push(...extractFromText(block, nowIso, storeId, source, nowIso))
  }
  return observations.slice(0, MAX_OBSERVATIONS_PER_SITE)
}

export const loadSiteConfigs = (): SiteConfig[] => {
  if (!fs.existsSync(SITE_SOURCES_FILE)) return []
  const raw = JSON.parse(fs.readFileSync(SITE_SOURCES_FILE, 'utf8')) as { sites?: SiteConfig[] }
  return raw.sites ?? []
}

export const sitesAdapter: Adapter = {
  sourceId: 'sites',
  async collect(ctx: AdapterContext): Promise<ObservationBatch> {
    const configs = loadSiteConfigs().filter((s) => s.enabled)
    if (configs.length === 0) return EMPTY_BATCH

    const batch: ObservationBatch = { observations: [], noEvents: [], removals: [] }
    for (const site of configs) {
      try {
        const res = await politeFetch(site.url)
        if (!res.ok) {
          console.warn(`[sites] ${site.id}: HTTP ${res.status}`)
          continue
        }
        const observations = extractFromPage(await res.text(), site, ctx.stores, ctx.nowIso)
        console.log(`[sites] ${site.id}: ${observations.length}件抽出`)
        batch.observations.push(...observations)
      } catch (err) {
        if (err instanceof PolitenessError) {
          console.warn(`[sites] ${site.id}: robots.txt により取得不可のためスキップ`)
        } else {
          console.warn(`[sites] ${site.id}: ${String(err)}`)
        }
      }
    }
    return batch
  },
}
