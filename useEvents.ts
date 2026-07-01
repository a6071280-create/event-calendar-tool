import { useMemo } from 'react'
import { useLocalStorageState } from './useLocalStorageState'
import type { CompetitorEvent } from '../types'

const STORAGE_KEY = 'event-calendar:events'

const genId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function useEvents() {
  const [events, setEvents] = useLocalStorageState<CompetitorEvent[]>(STORAGE_KEY, [])

  const addEvent = (input: Omit<CompetitorEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    const event: CompetitorEvent = { ...input, id: genId(), createdAt: now, updatedAt: now }
    setEvents((prev) => [...prev, event])
    return event
  }

  const updateEvent = (id: string, input: Omit<CompetitorEvent, 'id' | 'createdAt' | 'updatedAt'>) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...input, updatedAt: new Date().toISOString() } : e)),
    )
  }

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  const storeNameSuggestions = useMemo(() => {
    const names = new Set(events.map((e) => e.storeName).filter(Boolean))
    return Array.from(names).sort()
  }, [events])

  return { events, addEvent, updateEvent, deleteEvent, storeNameSuggestions }
}
