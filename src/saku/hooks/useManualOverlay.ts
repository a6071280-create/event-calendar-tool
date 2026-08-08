import { useCallback } from 'react'
import { useLocalStorageState } from '../../hooks/useLocalStorageState'
import type { EventObservation, NoEventObservation, ObservationBatch } from '../lib/types'
import { eventKey } from '../lib/normalize'

const STORAGE_KEY = 'saku-manual-overlay-v1'

const EMPTY: ObservationBatch = { observations: [], noEvents: [], removals: [] }

/**
 * 画面から手動登録した観測のオーバーレイ。localStorage に保持し、
 * データセットと同じマージロジックで合成される。エクスポートして
 * data/manual/ にコミットすれば正式なDBへ取り込まれる。
 */
export const useManualOverlay = () => {
  const [batch, setBatch] = useLocalStorageState<ObservationBatch>(STORAGE_KEY, EMPTY)

  const addObservation = useCallback(
    (obs: EventObservation) => {
      setBatch((prev) => ({ ...prev, observations: [...prev.observations, obs] }))
    },
    [setBatch],
  )

  const removeObservation = useCallback(
    (storeId: string, date: string, name: string) => {
      const key = eventKey(storeId, date, name)
      setBatch((prev) => ({
        ...prev,
        observations: prev.observations.filter((o) => eventKey(o.storeId, o.date, o.name) !== key),
      }))
    },
    [setBatch],
  )

  const addNoEvent = useCallback(
    (obs: NoEventObservation) => {
      setBatch((prev) => ({
        ...prev,
        noEvents: [
          ...prev.noEvents.filter((n) => !(n.storeId === obs.storeId && n.date === obs.date)),
          obs,
        ],
      }))
    },
    [setBatch],
  )

  const clear = useCallback(() => setBatch(EMPTY), [setBatch])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(batch, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
    a.href = url
    a.download = `manual-${stamp}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [batch])

  const entryCount = batch.observations.length + batch.noEvents.length + batch.removals.length

  return { batch, addObservation, removeObservation, addNoEvent, clear, exportJson, entryCount }
}
