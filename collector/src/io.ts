import fs from 'node:fs'
import path from 'node:path'

export const readJson = <T>(file: string, fallback: T): T => {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T
}

export const writeJson = (file: string, value: unknown): void => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

/** JST の現在時刻を ISO 形式（+09:00 固定）で返す */
export const nowJstIso = (): string => {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jst.toISOString().replace('Z', '+09:00').replace(/\.\d{3}/, '')
}

export const todayJstIso = (): string => nowJstIso().slice(0, 10)
