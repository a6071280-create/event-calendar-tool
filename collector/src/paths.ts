import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

export const REPO_ROOT = path.resolve(here, '..', '..')
export const DATA_DIR = path.join(REPO_ROOT, 'data')
export const DB_DIR = path.join(DATA_DIR, 'db')
export const MANUAL_DIR = path.join(DATA_DIR, 'manual')
export const PUBLIC_DATA_DIR = path.join(REPO_ROOT, 'public', 'data')

export const STORES_FILE = path.join(DATA_DIR, 'stores.json')
export const REGIONS_FILE = path.join(DATA_DIR, 'regions.json')
export const SOURCES_FILE = path.join(DATA_DIR, 'sources.json')
export const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json')
export const SITE_SOURCES_FILE = path.join(DATA_DIR, 'site-sources.json')
export const EVENTS_DB_FILE = path.join(DB_DIR, 'events.json')
export const DAY_STATUS_DB_FILE = path.join(DB_DIR, 'day-status.json')
export const RUNS_FILE = path.join(DB_DIR, 'runs.json')
export const X_STATE_FILE = path.join(DB_DIR, 'x-state.json')
export const DATASET_FILE = path.join(PUBLIC_DATA_DIR, 'dataset.json')
