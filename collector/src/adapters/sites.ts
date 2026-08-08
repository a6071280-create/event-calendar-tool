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
import { CATEGORY_KEYWORDS, extractDates, extractFromText } from '../extractCore'
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
  const seen = new Set<string>()
  const source = { sourceId: site.sourceId, sourceName: site.sourceName, url: site.url }

  // 見出しと日付が別ブロックに分かれるページ（例: 「★新台入替★」の次の行に日付）を
  // 拾えるよう、store モードに限り「キーワードのみのブロック + 日付を含む次ブロック」を
  // 結合して追加する。media モードは行ごとに完結する一覧が前提のため結合しない
  // （結合すると隣り合う別ホールの行が混ざり誤検知になる）。
  const texts: string[] = blocks.slice()
  if (site.mode === 'store') {
    for (let i = 0; i + 1 < blocks.length; i++) {
      const norm = blocks[i].normalize('NFKC')
      const next = blocks[i + 1].normalize('NFKC')
      const hasKeyword = CATEGORY_KEYWORDS.some((k) => k.pattern.test(norm))
      const hasDate = extractDates(norm, nowIso).length > 0
      const nextHasKeyword = CATEGORY_KEYWORDS.some((k) => k.pattern.test(next))
      const nextHasDate = extractDates(next, nowIso).length > 0
      // 「★新台入替★」→「8月5日(水)」／「8月5日(水)」→「★新台入替★」の両順に対応
      if ((hasKeyword && !hasDate && nextHasDate) || (hasDate && !hasKeyword && nextHasKeyword)) {
        texts.push(`${blocks[i]} ${blocks[i + 1]}`)
      }
    }
  }

  for (const text of texts) {
    if (observations.length >= MAX_OBSERVATIONS_PER_SITE) break
    const storeId =
      site.mode === 'store' ? (site.storeId ?? null) : (matchStore(text, stores)?.id ?? null)
    if (!storeId) continue
    for (const obs of extractFromText(text, nowIso, storeId, source, nowIso)) {
      const key = `${obs.storeId}|${obs.date}|${normalize(obs.name)}|${obs.category}`
      if (seen.has(key)) continue
      seen.add(key)
      observations.push(obs)
    }
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
