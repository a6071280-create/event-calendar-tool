/**
 * 規約遵守を強制するフェッチ層。すべての自動収集アダプタはこれを使うこと。
 * - 取得前に必ず robots.txt を確認し、許可されないパスは PolitenessError で拒否
 * - UA を明示し、ホストごとに最低間隔（既定5秒、Crawl-delay があればそれ以上）を空ける
 */
import { isPathAllowed, parseRobots, type RobotsRules } from './robots'

export const USER_AGENT = 'saku-event-calendar-collector/1.0 (+https://github.com/a6071280-create/event-calendar-tool)'

const DEFAULT_MIN_INTERVAL_MS = 5000

export class PolitenessError extends Error {}

const robotsCache = new Map<string, RobotsRules>()
const lastFetchAtByHost = new Map<string, number>()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getRobots = async (origin: string): Promise<RobotsRules> => {
  const cached = robotsCache.get(origin)
  if (cached) return cached
  let rules: RobotsRules
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } })
    if (res.ok) {
      rules = parseRobots(await res.text(), USER_AGENT)
    } else if (res.status >= 400 && res.status < 500) {
      // robots.txt が無いサイトは全許可扱い（RFC 9309）
      rules = { disallow: [], allow: [] }
    } else {
      // サーバーエラー時は安全側に倒して全拒否
      rules = { disallow: ['/'], allow: [] }
    }
  } catch {
    rules = { disallow: ['/'], allow: [] }
  }
  robotsCache.set(origin, rules)
  return rules
}

export const politeFetch = async (url: string): Promise<Response> => {
  const parsed = new URL(url)
  const rules = await getRobots(parsed.origin)
  const pathWithQuery = parsed.pathname + parsed.search
  if (!isPathAllowed(rules, pathWithQuery)) {
    throw new PolitenessError(`robots.txt disallows ${url}`)
  }

  const minInterval = Math.max(DEFAULT_MIN_INTERVAL_MS, (rules.crawlDelaySeconds ?? 0) * 1000)
  const last = lastFetchAtByHost.get(parsed.host) ?? 0
  const wait = last + minInterval - Date.now()
  if (wait > 0) await sleep(wait)
  lastFetchAtByHost.set(parsed.host, Date.now())

  return fetch(url, { headers: { 'User-Agent': USER_AGENT } })
}
