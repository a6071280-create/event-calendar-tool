import type { Store } from '../lib/types'
import { CATEGORY_GROUPS } from '../lib/types'

export type StoreFilter = 'all' | 'own' | string
export type GroupKey = string
export type DiffFilterKey = 'anomaly' | 'new' | 'changed'

const DIFF_FILTERS: { key: DiffFilterKey; label: string }[] = [
  { key: 'anomaly', label: '⚠ 通常パターン外' },
  { key: 'new', label: 'NEW' },
  { key: 'changed', label: '変更・削除' },
]

interface Props {
  stores: Store[]
  storeFilter: StoreFilter
  onStoreFilterChange: (v: StoreFilter) => void
  groupKeys: GroupKey[]
  onGroupKeysChange: (v: GroupKey[]) => void
  diffKeys: DiffFilterKey[]
  onDiffKeysChange: (v: DiffFilterKey[]) => void
  manualCount: number
  onExport: () => void
  onClear: () => void
}

export function FilterBar({
  stores,
  storeFilter,
  onStoreFilterChange,
  groupKeys,
  onGroupKeysChange,
  diffKeys,
  onDiffKeysChange,
  manualCount,
  onExport,
  onClear,
}: Props) {
  const toggleGroup = (key: GroupKey) => {
    onGroupKeysChange(
      groupKeys.includes(key) ? groupKeys.filter((k) => k !== key) : [...groupKeys, key],
    )
  }
  const toggleDiff = (key: DiffFilterKey) => {
    onDiffKeysChange(diffKeys.includes(key) ? diffKeys.filter((k) => k !== key) : [...diffKeys, key])
  }

  return (
    <div className="saku-filters">
      <label className="saku-filters__store">
        店舗
        <select value={storeFilter} onChange={(e) => onStoreFilterChange(e.target.value)}>
          <option value="all">全店舗</option>
          <option value="own">自店のみ</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.shortName}
            </option>
          ))}
        </select>
      </label>

      <div className="saku-filters__chips" role="group" aria-label="イベント種類">
        {CATEGORY_GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            className={`saku-chip ${groupKeys.includes(g.key) ? 'saku-chip--on' : ''}`}
            onClick={() => toggleGroup(g.key)}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="saku-filters__chips" role="group" aria-label="差分">
        {DIFF_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`saku-chip saku-chip--diff ${diffKeys.includes(f.key) ? 'saku-chip--on' : ''}`}
            onClick={() => toggleDiff(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="saku-filters__manual">
        <button type="button" className="btn" onClick={onExport} disabled={manualCount === 0}>
          手動登録をエクスポート ({manualCount})
        </button>
        {manualCount > 0 && (
          <button type="button" className="btn btn--danger" onClick={onClear}>
            クリア
          </button>
        )}
      </div>
    </div>
  )
}
