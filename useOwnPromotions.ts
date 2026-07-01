import { useLocalStorageState } from './useLocalStorageState'
import type { OwnPromotionDay } from '../types'

const STORAGE_KEY = 'event-calendar:own-promotions'

const genId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function useOwnPromotions() {
  const [ownPromotions, setOwnPromotions] = useLocalStorageState<OwnPromotionDay[]>(STORAGE_KEY, [])

  const addOwnPromotion = (input: Omit<OwnPromotionDay, 'id' | 'createdAt'>) => {
    const promo: OwnPromotionDay = { ...input, id: genId(), createdAt: new Date().toISOString() }
    setOwnPromotions((prev) => [...prev, promo])
    return promo
  }

  const deleteOwnPromotion = (id: string) => {
    setOwnPromotions((prev) => prev.filter((p) => p.id !== id))
  }

  return { ownPromotions, addOwnPromotion, deleteOwnPromotion }
}
