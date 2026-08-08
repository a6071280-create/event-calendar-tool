/**
 * data/manual/*.json を取り込むアダプタ。
 * アプリの「エクスポート」で出力したファイルや手書きのファイルをここに置くと
 * 定期実行時に正式なDBへ取り込まれる。ファイル形式は ObservationBatch と同じ:
 * { "observations": [...], "noEvents": [...], "removals": [...] }
 */
import fs from 'node:fs'
import path from 'node:path'
import type { ObservationBatch } from '../../../src/saku/lib/types'
import { EMPTY_BATCH } from '../../../src/saku/lib/types'
import { MANUAL_DIR } from '../paths'
import type { Adapter } from './types'

export const manualAdapter: Adapter = {
  sourceId: 'manual',
  async collect(): Promise<ObservationBatch> {
    if (!fs.existsSync(MANUAL_DIR)) return EMPTY_BATCH
    const files = fs
      .readdirSync(MANUAL_DIR)
      .filter((f) => f.endsWith('.json'))
      .sort()
    const merged: ObservationBatch = { observations: [], noEvents: [], removals: [] }
    for (const file of files) {
      const raw = JSON.parse(fs.readFileSync(path.join(MANUAL_DIR, file), 'utf8')) as Partial<ObservationBatch>
      merged.observations.push(...(raw.observations ?? []))
      merged.noEvents.push(...(raw.noEvents ?? []))
      merged.removals.push(...(raw.removals ?? []))
    }
    return merged
  },
}
