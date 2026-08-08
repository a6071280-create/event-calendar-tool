/** イベント名の名寄せ用正規化。全角/半角・大文字小文字・空白の揺れを吸収する。 */
export const normalizeEventName = (name: string): string =>
  name.normalize('NFKC').toLowerCase().replace(/\s+/g, '')

/** イベントの同一性キー。同一店舗・同一開催日・同一名称なら同一イベントとして扱う。 */
export const eventKey = (storeId: string, date: string, name: string): string =>
  `${storeId}|${date}|${normalizeEventName(name)}`

/** キーから安定したレコードIDを生成する（FNV-1a 32bit）。 */
export const eventIdFromKey = (key: string): string => {
  let hash = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return `ev_${hash.toString(36)}_${key.split('|')[1] ?? ''}`
}

export const dayStatusKey = (storeId: string, date: string): string => `${storeId}|${date}`
