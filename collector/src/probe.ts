/**
 * 情報源プローブ — 実地検証ツール。
 *   npm run probe
 *
 * data/site-sources.json の全サイト（無効含む）について、
 *   1. robots.txt の取得と対象URLの許可/不許可判定
 *   2. ページ本体の取得（許可される場合のみ、politeFetch 経由）
 *   3. テキストブロック抽出とイベント抽出のドライラン（DBには書き込まない）
 * を行い、docs/probe-report.md にレポートを出力する。
 *
 * この開発環境からは外部サイトへ接続できないため、GitHub Actions の
 * probe ワークフロー（.github/workflows/probe.yml）で実行して結果を確認する。
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Store } from '../../src/saku/lib/types'
import { extractFromPage, loadSiteConfigs } from './adapters/sites'
import { nowJstIso, readJson } from './io'
import { REPO_ROOT, STORES_FILE } from './paths'
import { isPathAllowed, parseRobots } from './robots'
import { politeFetch, PolitenessError, USER_AGENT } from './politeFetch'

interface ProbeResult {
  id: string
  url: string
  enabled: boolean
  robots: string
  fetch: string
  blocks: number
  extracted: number
  samples: string[]
  note?: string
}

const probeSite = async (
  site: ReturnType<typeof loadSiteConfigs>[number],
  stores: Store[],
  now: string,
): Promise<ProbeResult> => {
  const result: ProbeResult = {
    id: site.id,
    url: site.url,
    enabled: site.enabled,
    robots: '未確認',
    fetch: '未実施',
    blocks: 0,
    extracted: 0,
    samples: [],
    note: site.notes,
  }

  const origin = new URL(site.url).origin
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { 'User-Agent': USER_AGENT } })
    if (res.ok) {
      const rules = parseRobots(await res.text(), USER_AGENT)
      const parsed = new URL(site.url)
      const allowed = isPathAllowed(rules, parsed.pathname + parsed.search)
      result.robots = allowed ? '許可' : `不許可 (Disallow: ${rules.disallow.join(', ') || '-'})`
    } else if (res.status >= 400 && res.status < 500) {
      result.robots = `robots.txt なし (HTTP ${res.status}) → 全許可扱い`
    } else {
      result.robots = `取得失敗 (HTTP ${res.status}) → 安全側で全拒否`
    }
  } catch (err) {
    result.robots = `取得エラー (${String(err).slice(0, 80)})`
  }

  try {
    const res = await politeFetch(site.url)
    result.fetch = `HTTP ${res.status}`
    if (res.ok) {
      const html = await res.text()
      result.fetch += ` (${Math.round(html.length / 1024)}KB)`
      const observations = extractFromPage(html, site, stores, now)
      result.blocks = observations.length > 0 ? observations.length : 0
      result.extracted = observations.length
      result.samples = observations
        .slice(0, 5)
        .map((o) => `${o.date} ${stores.find((s) => s.id === o.storeId)?.shortName ?? o.storeId} ${o.name} (${o.category})`)
    }
  } catch (err) {
    result.fetch = err instanceof PolitenessError ? 'robots.txt により拒否' : `エラー (${String(err).slice(0, 100)})`
  }

  return result
}

const main = async () => {
  const now = nowJstIso()
  const stores = readJson<{ stores: Store[] }>(STORES_FILE, { stores: [] }).stores
  const sites = loadSiteConfigs()

  const results: ProbeResult[] = []
  for (const site of sites) {
    console.log(`[probe] ${site.id} ...`)
    results.push(await probeSite(site, stores, now))
  }

  const lines: string[] = [
    '# 情報源プローブレポート',
    '',
    `実行日時: ${now} / UA: \`${USER_AGENT}\``,
    '',
    'DBには書き込まないドライラン。`npm run probe`（GitHub Actions の probe ワークフロー）で再生成される。',
    '',
    '| サイト | 有効 | robots.txt | 取得 | 抽出件数 |',
    '|---|---|---|---|---|',
    ...results.map(
      (r) => `| ${r.id} | ${r.enabled ? '✅' : '－'} | ${r.robots} | ${r.fetch} | ${r.extracted} |`,
    ),
    '',
  ]
  for (const r of results) {
    if (r.samples.length > 0) {
      lines.push(`## ${r.id} の抽出サンプル`, '', ...r.samples.map((s) => `- ${s}`), '')
    }
  }
  lines.push(
    '## 判定の見方',
    '',
    '- robots.txt「不許可」または取得「robots.txt により拒否」のサイトは、enabled に関わらず collector が自動的にスキップする。',
    '- 抽出件数が 0 のサイトはページ構造とキーワードの再確認が必要（collector/src/extractCore.ts）。',
    '- 抽出サンプルに誤りが多い場合はそのサイトを enabled:false にして手動運用に切り替える。',
    '',
  )

  const outFile = path.join(REPO_ROOT, 'docs', 'probe-report.md')
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, lines.join('\n'), 'utf8')
  console.log(`[probe] ${outFile} を出力しました`)
  for (const r of results) {
    console.log(`  - ${r.id}: robots=${r.robots} fetch=${r.fetch} extracted=${r.extracted}`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
