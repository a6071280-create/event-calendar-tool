import { describe, expect, it } from 'vitest'
import type { Store } from '../../src/saku/lib/types'
import { extractFromPage, matchStore, type SiteConfig } from './adapters/sites'
import { htmlToTextBlocks } from './htmlText'

const NOW = '2026-08-08T06:00:00+09:00'

const stores: Store[] = [
  {
    id: 'maruhan-saku',
    name: 'マルハン佐久店',
    shortName: 'マルハン佐久',
    regionId: 'nagano-saku',
    prefecture: '長野県',
    city: '佐久市',
    address: '',
    isOwn: false,
    businessStatus: 'open',
    displayOrder: 2,
    urls: {},
  },
  {
    id: 'super-arena-sakudaira',
    name: 'スーパーアリーナ佐久平店',
    shortName: 'スーパーアリーナ',
    regionId: 'nagano-saku',
    prefecture: '長野県',
    city: '佐久市',
    address: '',
    isOwn: false,
    businessStatus: 'open',
    displayOrder: 3,
    urls: {},
  },
]

describe('htmlToTextBlocks', () => {
  it('script/style を除去しブロック単位のテキストにする', () => {
    const html = `
      <html><head><style>.a{color:red}</style><script>var x=1;</script></head>
      <body><div class="news"><h2>お知らせ</h2>
      <p>8/10（月）<b>新台入替</b>を実施します</p>
      <li>8月18日 「特日取材」開催</li></div></body></html>`
    const blocks = htmlToTextBlocks(html)
    expect(blocks.some((b) => b.includes('8/10') && b.includes('新台入替'))).toBe(true)
    expect(blocks.some((b) => b.includes('特日取材'))).toBe(true)
    expect(blocks.join(' ')).not.toContain('var x=1')
  })

  it('HTMLエンティティを復号する', () => {
    const blocks = htmlToTextBlocks('<p>8/10&nbsp;新台入替&amp;リニューアル</p>')
    expect(blocks[0]).toContain('新台入替&リニューアル')
  })

  it('長すぎるブロックは捨てる（偶然の日付+キーワード同居を防ぐ）', () => {
    const long = `<p>8/10 新台入替 ${'あ'.repeat(500)}</p>`
    expect(htmlToTextBlocks(long)).toHaveLength(0)
  })
})

describe('matchStore', () => {
  it('店舗名・略称の包含一致で店舗を特定する', () => {
    expect(matchStore('8/18 マルハン佐久店 で取材開催', stores)?.id).toBe('maruhan-saku')
    expect(matchStore('スーパーアリーナ佐久平店（長野県）', stores)?.id).toBe('super-arena-sakudaira')
    expect(matchStore('マルハン高崎店の情報', stores)).toBeNull()
  })

  it('全角/半角・空白ゆれを吸収する', () => {
    expect(matchStore('ﾏﾙﾊﾝ佐久店', stores)?.id).toBe('maruhan-saku')
  })
})

describe('extractFromPage', () => {
  const storeSite: SiteConfig = {
    id: 'maruhan-official-saku',
    mode: 'store',
    storeId: 'maruhan-saku',
    sourceId: 'official_site',
    sourceName: 'マルハン公式サイト',
    url: 'https://www.maruhan.co.jp/hall/0647/',
    enabled: true,
  }

  it('store モード: ページ内の日付+キーワードブロックを観測にする', () => {
    const html = `<div><p>2026/8/14 新台入替のお知らせ</p><p>営業時間 10:00〜22:45</p></div>`
    const obs = extractFromPage(html, storeSite, stores, NOW)
    expect(obs).toHaveLength(1)
    expect(obs[0]).toMatchObject({
      storeId: 'maruhan-saku',
      date: '2026-08-14',
      category: '新台入替',
    })
    expect(obs[0].source.url).toBe(storeSite.url)
  })

  it('media モード: 登録店舗名を含むブロックだけ取り込む', () => {
    const mediaSite: SiteConfig = {
      id: '1geki',
      mode: 'media',
      sourceId: 'other_site',
      sourceName: '一撃 取材スケジュール',
      url: 'https://shuzai.1geki.jp/shuzai/',
      enabled: true,
    }
    const html = `
      <li>8/18 マルハン佐久店 「ぞろ目の日」取材</li>
      <li>8/18 マルハン高崎店 「ぞろ目の日」取材</li>
      <li>8/20 スーパーアリーナ佐久平店 実戦取材</li>`
    const obs = extractFromPage(html, mediaSite, stores, NOW)
    expect(obs).toHaveLength(2)
    expect(obs.map((o) => o.storeId).sort()).toEqual(['maruhan-saku', 'super-arena-sakudaira'])
    expect(obs.find((o) => o.storeId === 'super-arena-sakudaira')?.category).toBe('実践来店')
  })

  it('キーワードのないブロックは取り込まない', () => {
    const html = `<p>8/12 マルハン佐久店 通常営業</p>`
    expect(extractFromPage(html, storeSite, stores, NOW)).toHaveLength(0)
  })

  it('見出しと日付が別ブロックでも隣接結合で抽出する（ダイナム型レイアウト）', () => {
    const html = `<div><p>★新台入替★</p><p>8月14日(金) 10時開店</p></div>`
    const obs = extractFromPage(html, storeSite, stores, NOW)
    expect(obs).toHaveLength(1)
    expect(obs[0]).toMatchObject({ date: '2026-08-14', category: '新台入替' })
  })

  it('日付→キーワードの順でも隣接結合で抽出する', () => {
    const html = `<div><p>8月5日(水)</p><p>★新台入替★</p></div>`
    const obs = extractFromPage(html, storeSite, stores, NOW)
    expect(obs).toHaveLength(1)
    expect(obs[0]).toMatchObject({ date: '2026-08-05', category: '新台入替' })
  })

  it('同一イベントが単独ブロックと結合ブロックの両方で見つかっても1件にする', () => {
    const html = `<p>8/14 新台入替</p><p>ご案内</p>`
    expect(extractFromPage(html, storeSite, stores, NOW)).toHaveLength(1)
  })

  it('「ご来店お待ちしております」は来店イベントとして誤検知しない', () => {
    const html = `<p>8/14 ご来店お待ちしております</p>`
    expect(extractFromPage(html, storeSite, stores, NOW)).toHaveLength(0)
  })
})
