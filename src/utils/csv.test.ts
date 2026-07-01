import { describe, expect, it } from 'vitest'
import { toCSV } from './csv'

describe('toCSV', () => {
  it('joins headers and rows with CRLF', () => {
    const csv = toCSV(['a', 'b'], [['1', '2']])
    expect(csv).toBe('a,b\r\n1,2')
  })

  it('escapes commas, quotes, and newlines', () => {
    const csv = toCSV(['memo'], [['has,comma'], ['has"quote'], ['has\nnewline']])
    expect(csv).toContain('"has,comma"')
    expect(csv).toContain('"has""quote"')
    expect(csv).toContain('"has\nnewline"')
  })
})
