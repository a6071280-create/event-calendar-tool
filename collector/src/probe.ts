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
import { extractFromPage, loadSiteConfigs, matchStore } from './adapters/sites'
import { CATEGORY_KEYWORDS, extractDates } from './extractCore'
import { htmlToTextBlocks } from './htmlText'
import { nowJstIso, readJson } from './io'
import { REPO_ROOT, STORES_FILE } from './paths'
import { isPathAllowed, parseRobots } from './robots'
import { politeFetch, PolitenessError, USER_AGENT } from './politeFetch'

interface ProbeResult {
  id: string
  url: string
  enabled: boolean
  /** 接続成功/失敗 */
  connection: '成功' | '失敗'
  robots: string
  fetch: string
  /** ページから取得したテキストブロック数（取得件数） */
  blocksScanned: number
  /** 抽出できたイベント件数 */
  extracted: number
  /** イベントを抽出できた店舗数 */
  storeCount: number
  /** エラー内容（なければ空） */
  error: string
  samples: string[]
  /** 診断: 日付は含むがキーワードがないブロック数 */
  dateOnlyBlocks: number
  /** 診断: キーワードは含むが日付がないブロック数 */
  keywordOnlyBlocks: number
  /** 診断: mediaモードで登録店舗名に一致したブロック数 */
  storeMatchedBlocks: number
  /** 診断: 抽出に至らなかった惜しいブロックの例 */
  nearMissSamples: string[]
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
    connection: '失敗',
    robots: '未確認',
    fetch: '未実施',
    blocksScanned: 0,
    extracted: 0,
    storeCount: 0,
    error: '',
    samples: [],
    dateOnlyBlocks: 0,
    keywordOnlyBlocks: 0,
    storeMatchedBlocks: 0,
    nearMissSamples: [],
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
      result.connection = '成功'
      const html = await res.text()
      result.fetch += ` (${Math.round(html.length / 1024)}KB)`
      const blocks = htmlToTextBlocks(html)
      result.blocksScanned = blocks.length
      // 診断: 抽出条件（日付+キーワード+店舗）にどこまで近づいているか
      for (const block of blocks) {
        const norm = block.normalize('NFKC')
        const hasDate = extractDates(norm, now).length > 0
        const hasKeyword = CATEGORY_KEYWORDS.some((k) => k.pattern.test(norm))
        const matched = site.mode === 'media' ? matchStore(block, stores) : null
        if (site.mode === 'media' && matched) result.storeMatchedBlocks++
        if (hasDate && !hasKeyword) result.dateOnlyBlocks++
        if (!hasDate && hasKeyword) {
          result.keywordOnlyBlocks++
          if (result.nearMissSamples.length < 5) {
            result.nearMissSamples.push(`[日付なし] ${block.slice(0, 90)}`)
          }
        }
        if (site.mode === 'media' && hasDate && hasKeyword && !matched && result.nearMissSamples.length < 5) {
          result.nearMissSamples.push(`[店舗名不一致] ${block.slice(0, 90)}`)
        }
      }
      const observations = extractFromPage(html, site, stores, now)
      result.extracted = observations.length
      result.storeCount = new Set(observations.map((o) => o.storeId)).size
      result.samples = observations
        .slice(0, 10)
        .map((o) => `${o.date} ${stores.find((s) => s.id === o.storeId)?.shortName ?? o.storeId} ${o.name} (${o.category})`)
    } else {
      result.error = `HTTPステータス ${res.status}`
    }
  } catch (err) {
    if (err instanceof PolitenessError) {
      result.fetch = 'robots.txt により拒否'
      result.error = 'robots.txt が対象URLの取得を許可していない'
    } else {
      result.fetch = 'エラー'
      result.error = String(err).slice(0, 160)
    }
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
    '| サイト | 有効 | 接続 | robots.txt | 取得 | 取得ブロック数 | イベント件数 | 対象店舗数 | エラー内容 |',
    '|---|---|---|---|---|---|---|---|---|',
    ...results.map(
      (r) =>
        `| ${r.id} | ${r.enabled ? '✅' : '－'} | ${r.connection} | ${r.robots} | ${r.fetch} | ${r.blocksScanned} | ${r.extracted} | ${r.storeCount} | ${r.error || '－'} |`,
    ),
    '',
  ]
  for (const r of results) {
    if (r.samples.length > 0) {
      lines.push(`## ${r.id} の抽出サンプル`, '', ...r.samples.map((s) => `- ${s}`), '')
    }
    if (r.connection === '成功') {
      lines.push(
        `## ${r.id} の診断`,
        '',
        `- 日付のみ（キーワードなし）のブロック: ${r.dateOnlyBlocks}`,
        `- キーワードのみ（日付なし）のブロック: ${r.keywordOnlyBlocks}`,
        ...(r.storeMatchedBlocks > 0 || r.id.includes('1geki')
          ? [`- 登録店舗名に一致したブロック: ${r.storeMatchedBlocks}`]
          : []),
        ...(r.nearMissSamples.length > 0
          ? ['- 抽出に至らなかった例:', ...r.nearMissSamples.map((s) => `  - ${s}`)]
          : []),
        '',
      )
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
    console.log(
      `  - ${r.id}: 接続=${r.connection} robots=${r.robots} 取得=${r.fetch} ブロック=${r.blocksScanned} イベント=${r.extracted} 店舗=${r.storeCount}${r.error ? ` エラー=${r.error}` : ''}`,
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
