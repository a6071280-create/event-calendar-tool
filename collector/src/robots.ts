/**
 * robots.txt の取得・判定。
 * 自動収集アダプタはすべて politeFetch 経由でアクセスし、politeFetch は
 * ここでの判定で許可されない URL の取得を拒否する（規約遵守を機械的に強制）。
 */

export interface RobotsRules {
  /** 適用されるグループの Disallow パス */
  disallow: string[]
  allow: string[]
  crawlDelaySeconds?: number
}

/** robots.txt 本文をパースし、指定 UA に適用されるルールを返す */
export const parseRobots = (body: string, userAgent: string): RobotsRules => {
  interface Group {
    agents: string[]
    disallow: string[]
    allow: string[]
    crawlDelay?: number
  }
  const groups: Group[] = []
  let current: Group | null = null
  let lastWasAgent = false

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const field = line.slice(0, idx).trim().toLowerCase()
    const value = line.slice(idx + 1).trim()

    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], disallow: [], allow: [] }
        groups.push(current)
      }
      current.agents.push(value.toLowerCase())
      lastWasAgent = true
      continue
    }
    lastWasAgent = false
    if (!current) continue
    if (field === 'disallow') current.disallow.push(value)
    else if (field === 'allow') current.allow.push(value)
    else if (field === 'crawl-delay') {
      const n = Number(value)
      if (Number.isFinite(n)) current.crawlDelay = n
    }
  }

  const ua = userAgent.toLowerCase()
  const specific = groups.find((g) => g.agents.some((a) => a !== '*' && ua.includes(a)))
  const wildcard = groups.find((g) => g.agents.includes('*'))
  const chosen = specific ?? wildcard
  if (!chosen) return { disallow: [], allow: [] }
  return {
    disallow: chosen.disallow,
    allow: chosen.allow,
    crawlDelaySeconds: chosen.crawlDelay,
  }
}

const matchLength = (pattern: string, urlPath: string): number => {
  if (pattern === '') return -1
  // robots.txt の * と $ をサポート
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  const anchored = escaped.endsWith('\\$') ? `^${escaped.slice(0, -2)}$` : `^${escaped}`
  return new RegExp(anchored).test(urlPath) ? pattern.length : -1
}

/** 最長一致で Allow/Disallow を判定する（Google 方式） */
export const isPathAllowed = (rules: RobotsRules, urlPath: string): boolean => {
  let bestAllow = -1
  let bestDisallow = -1
  for (const p of rules.allow) bestAllow = Math.max(bestAllow, matchLength(p, urlPath))
  for (const p of rules.disallow) bestDisallow = Math.max(bestDisallow, matchLength(p, urlPath))
  if (bestDisallow < 0) return true
  return bestAllow >= bestDisallow
}
