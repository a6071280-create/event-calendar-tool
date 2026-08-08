/**
 * 収集パイプラインのエントリポイント。GitHub Actions から定期実行される。
 *   npm run collect
 *
 * 1. マスタ（stores/regions/sources/settings）を読み込む
 * 2. 有効なアダプタから観測を集める（手動取込 + 許可済み自動収集）
 * 3. イベントDBへマージ（重複排除・複数情報源紐付け・変更/削除履歴）
 * 4. data/db/ と public/data/dataset.json を書き出す
 */
import type {
  Dataset,
  DiffSettings,
  EventDb,
  ObservationBatch,
  Region,
  Store,
} from '../../src/saku/lib/types'
import { DEFAULT_DIFF_SETTINGS } from '../../src/saku/lib/types'
import { mergeBatches } from '../../src/saku/lib/ingest'
import { manualAdapter } from './adapters/manual'
import { officialSiteAdapter } from './adapters/officialSite'
import type { Adapter, SourceConfig } from './adapters/types'
import { nowJstIso, readJson, writeJson } from './io'
import {
  DATASET_FILE,
  DAY_STATUS_DB_FILE,
  EVENTS_DB_FILE,
  REGIONS_FILE,
  RUNS_FILE,
  SETTINGS_FILE,
  SOURCES_FILE,
  STORES_FILE,
} from './paths'

interface RunLogEntry {
  at: string
  batches: number
  added: number
  updated: number
  removed: number
  errors: string[]
}

const ADAPTERS: Adapter[] = [manualAdapter, officialSiteAdapter]

const main = async (): Promise<void> => {
  const now = nowJstIso()
  const stores = readJson<{ stores: Store[] }>(STORES_FILE, { stores: [] }).stores
  const regions = readJson<{ regions: Region[] }>(REGIONS_FILE, { regions: [] }).regions
  const sources = readJson<{ sources: SourceConfig[] }>(SOURCES_FILE, { sources: [] }).sources
  const settingsFile = readJson<{ diff: Partial<DiffSettings> }>(SETTINGS_FILE, { diff: {} })
  const settings: DiffSettings = { ...DEFAULT_DIFF_SETTINGS, ...settingsFile.diff }

  const db: EventDb = {
    events: readJson(EVENTS_DB_FILE, { events: [] }).events,
    dayStatuses: readJson(DAY_STATUS_DB_FILE, { dayStatuses: [] }).dayStatuses,
  }

  const batches: ObservationBatch[] = []
  const errors: string[] = []
  for (const adapter of ADAPTERS) {
    const config = sources.find((s) => s.id === adapter.sourceId)
    if (!config?.enabled) {
      console.log(`[collector] ${adapter.sourceId}: 無効のためスキップ`)
      continue
    }
    try {
      const batch = await adapter.collect({ stores, sources, nowIso: now })
      console.log(
        `[collector] ${adapter.sourceId}: 観測${batch.observations.length}件 / なし確認${batch.noEvents.length}件 / 削除${batch.removals.length}件`,
      )
      batches.push(batch)
    } catch (err) {
      const message = `${adapter.sourceId}: ${String(err)}`
      console.error(`[collector] ${message}`)
      errors.push(message)
    }
  }

  const result = mergeBatches(db, batches, now)
  console.log(
    `[collector] マージ結果: 新規${result.added}件 / 変更${result.updated}件 / 削除${result.removed}件（イベント総数 ${result.db.events.length}）`,
  )

  writeJson(EVENTS_DB_FILE, { events: result.db.events })
  writeJson(DAY_STATUS_DB_FILE, { dayStatuses: result.db.dayStatuses })

  const runs = readJson<{ runs: RunLogEntry[] }>(RUNS_FILE, { runs: [] }).runs
  runs.push({
    at: now,
    batches: batches.length,
    added: result.added,
    updated: result.updated,
    removed: result.removed,
    errors,
  })
  writeJson(RUNS_FILE, { runs: runs.slice(-200) })

  const dataset: Dataset = {
    generatedAt: now,
    regions,
    stores: [...stores].sort((a, b) => a.displayOrder - b.displayOrder),
    events: result.db.events,
    dayStatuses: result.db.dayStatuses,
    settings,
    containsDemoData: result.db.events.some((e) => e.demo),
  }
  writeJson(DATASET_FILE, dataset)
  console.log(`[collector] dataset.json を出力しました (${now})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
