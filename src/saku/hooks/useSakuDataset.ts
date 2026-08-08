import { useEffect, useState } from 'react'
import type { Dataset } from '../lib/types'
import { DEFAULT_DIFF_SETTINGS } from '../lib/types'

export const EMPTY_DATASET: Dataset = {
  generatedAt: '',
  regions: [],
  stores: [],
  events: [],
  dayStatuses: [],
  settings: DEFAULT_DIFF_SETTINGS,
  containsDemoData: false,
}

interface DatasetState {
  dataset: Dataset
  loading: boolean
  error: string | null
}

/** collector が生成した public/data/dataset.json を読み込む */
export const useSakuDataset = (): DatasetState => {
  const [state, setState] = useState<DatasetState>({
    dataset: EMPTY_DATASET,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}data/dataset.json`
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<Dataset>
      })
      .then((dataset) => {
        if (!cancelled) setState({ dataset, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({
            dataset: EMPTY_DATASET,
            loading: false,
            error: `データセットを読み込めませんでした (${String(err)})`,
          })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
