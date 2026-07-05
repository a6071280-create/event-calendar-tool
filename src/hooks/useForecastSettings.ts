import { useLocalStorageState } from './useLocalStorageState'
import { DEFAULT_FORECAST_SETTINGS } from '../utils/forecast'
import type { ForecastSettings } from '../types'

const STORAGE_KEY = 'event-calendar:forecast-settings'

export function useForecastSettings() {
  const [settings, setSettings] = useLocalStorageState<ForecastSettings>(
    STORAGE_KEY,
    DEFAULT_FORECAST_SETTINGS,
  )

  const updateSettings = (patch: Partial<ForecastSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  return { settings, updateSettings }
}
