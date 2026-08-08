import type { ObservationBatch, Store } from '../../../src/saku/lib/types'

export interface SourceConfig {
  id: string
  name: string
  automation: 'prohibited' | 'conditional' | 'api_required' | 'manual'
  enabled: boolean
  notes?: string
}

export interface AdapterContext {
  stores: Store[]
  sources: SourceConfig[]
  nowIso: string
}

export interface Adapter {
  sourceId: string
  /** 有効な場合のみ collect が呼ばれる（data/sources.json の enabled フラグで制御） */
  collect(ctx: AdapterContext): Promise<ObservationBatch>
}
