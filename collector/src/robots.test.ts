import { describe, expect, it } from 'vitest'
import { isPathAllowed, parseRobots } from './robots'

const SAMPLE = `
User-agent: *
Disallow: /admin/
Disallow: /private*
Allow: /private/public.html
Crawl-delay: 10

User-agent: badbot
Disallow: /
`

describe('parseRobots', () => {
  it('ワイルドカードグループを選ぶ', () => {
    const rules = parseRobots(SAMPLE, 'saku-event-collector/1.0')
    expect(rules.disallow).toEqual(['/admin/', '/private*'])
    expect(rules.allow).toEqual(['/private/public.html'])
    expect(rules.crawlDelaySeconds).toBe(10)
  })

  it('UA固有グループを優先する', () => {
    const rules = parseRobots(SAMPLE, 'BadBot/2.0')
    expect(rules.disallow).toEqual(['/'])
  })

  it('robots.txt が空なら全許可', () => {
    const rules = parseRobots('', 'x')
    expect(isPathAllowed(rules, '/anything')).toBe(true)
  })
})

describe('isPathAllowed', () => {
  const rules = parseRobots(SAMPLE, 'collector')

  it('Disallow パスを拒否する', () => {
    expect(isPathAllowed(rules, '/admin/settings')).toBe(false)
    expect(isPathAllowed(rules, '/private/page.html')).toBe(false)
  })

  it('許可パスを通す', () => {
    expect(isPathAllowed(rules, '/events/today')).toBe(true)
  })

  it('最長一致の Allow が Disallow に勝つ', () => {
    expect(isPathAllowed(rules, '/private/public.html')).toBe(true)
  })

  it('Disallow: / は全拒否', () => {
    const bad = parseRobots(SAMPLE, 'badbot')
    expect(isPathAllowed(bad, '/')).toBe(false)
    expect(isPathAllowed(bad, '/index.html')).toBe(false)
  })
})
