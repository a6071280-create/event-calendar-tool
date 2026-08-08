/**
 * HTMLをテキストブロックに変換する（依存ライブラリなしの簡易実装）。
 * ページのDOM構造に依存せず「日付+キーワードが同一ブロックにある」ことだけを
 * 手掛かりに抽出するため、サイトのデザイン変更に比較的強い。
 */

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

const decodeEntities = (s: string): string =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&[a-zA-Z]+;|&#\d+;/g, (e) => ENTITIES[e] ?? ' ')

/** ブロック要素の境界とみなすタグ */
const BLOCK_TAGS =
  /<\/?(?:p|div|section|article|li|ul|ol|table|tr|td|th|h[1-6]|br|hr|header|footer|main|aside|nav|dl|dt|dd|figure|blockquote)\b[^>]*>/gi

export const htmlToTextBlocks = (html: string, maxBlockLength = 400): string[] => {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')

  const withBreaks = withoutScripts.replace(BLOCK_TAGS, '\n')
  const text = decodeEntities(withBreaks.replace(/<[^>]+>/g, ' '))

  const blocks: string[] = []
  for (const raw of text.split(/\n+/)) {
    const line = raw.replace(/\s+/g, ' ').trim()
    if (line.length < 4) continue
    // 長すぎるブロックは日付とキーワードの偶然の同居が起きやすいので分割せず捨てる
    if (line.length > maxBlockLength) continue
    blocks.push(line)
  }
  return blocks
}
