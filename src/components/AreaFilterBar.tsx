import type { AreaFilterMode } from '../types'

interface AreaFilterBarProps {
  mode: AreaFilterMode
  onChange: (mode: AreaFilterMode) => void
}

export function AreaFilterBar({ mode, onChange }: AreaFilterBarProps) {
  return (
    <div className="area-filter-bar">
      <span className="area-filter-label">エリア表示</span>
      <div className="area-filter-toggle" role="group" aria-label="エリアフィルタ">
        <button
          type="button"
          className={mode === 'nagano' ? 'active' : ''}
          onClick={() => onChange('nagano')}
        >
          長野県内
        </button>
        <button
          type="button"
          className={mode === 'all' ? 'active' : ''}
          onClick={() => onChange('all')}
        >
          近隣含む
        </button>
      </div>
    </div>
  )
}
