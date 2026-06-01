/**
 * Tests for FormaTab v2 (PACK 4).
 * Covers: address helpers, range parsing, formula evaluation,
 *         serialization, CSV export.
 */
import { describe, expect, it } from 'vitest'
import {
  cellAddress,
  colIndexToLetter,
  colLetterToIndex,
  createDefaultTable,
  deserializeTable,
  evaluateCell,
  parseCellAddress,
  parseCellRange,
  serializeTable,
  tableToCSV,
  TAB_DEFAULT_COLS,
  TAB_DEFAULT_ROWS,
  type TabTable,
} from './formataб'

// ─── Address helpers ─────────────────────────────────────────────────────────

describe('colIndexToLetter', () => {
  it('converts 0 to A', () => expect(colIndexToLetter(0)).toBe('A'))
  it('converts 25 to Z', () => expect(colIndexToLetter(25)).toBe('Z'))
  it('returns ? for out-of-range', () => expect(colIndexToLetter(26)).toBe('?'))
})

describe('colLetterToIndex', () => {
  it('converts A to 0', () => expect(colLetterToIndex('A')).toBe(0))
  it('converts Z to 25', () => expect(colLetterToIndex('Z')).toBe(25))
  it('is case-insensitive', () => expect(colLetterToIndex('a')).toBe(0))
})

describe('cellAddress', () => {
  it('A1 for col=0, row=0', () => expect(cellAddress(0, 0)).toBe('A1'))
  it('B3 for col=1, row=2', () => expect(cellAddress(1, 2)).toBe('B3'))
  it('Z10 for col=25, row=9', () => expect(cellAddress(25, 9)).toBe('Z10'))
})

describe('parseCellAddress', () => {
  it('parses A1 → col=0, row=0', () => {
    const r = parseCellAddress('A1')
    expect(r).toEqual({ col: 0, row: 0 })
  })
  it('parses B3 → col=1, row=2', () => {
    const r = parseCellAddress('B3')
    expect(r).toEqual({ col: 1, row: 2 })
  })
  it('returns null for invalid address', () => {
    expect(parseCellAddress('ZZ999')).toBeNull()
    expect(parseCellAddress('')).toBeNull()
    expect(parseCellAddress('123')).toBeNull()
  })
  it('is case-insensitive', () => {
    expect(parseCellAddress('a1')).toEqual({ col: 0, row: 0 })
  })
})

describe('parseCellRange', () => {
  it('parses A1:A3 → 3 cells', () => {
    const addrs = parseCellRange('A1:A3')
    expect(addrs).toEqual(['A1', 'A2', 'A3'])
  })
  it('parses A1:B2 → 4 cells', () => {
    const addrs = parseCellRange('A1:B2')
    expect(addrs).toHaveLength(4)
    expect(addrs).toContain('A1')
    expect(addrs).toContain('B2')
  })
  it('handles reversed range B2:A1', () => {
    const addrs = parseCellRange('B2:A1')
    expect(addrs).toHaveLength(4)
  })
  it('returns [] for invalid range', () => {
    expect(parseCellRange('A1')).toEqual([])
    expect(parseCellRange('invalid')).toEqual([])
  })
})

// ─── Default table ───────────────────────────────────────────────────────────

describe('createDefaultTable', () => {
  it('creates table with default dimensions', () => {
    const t = createDefaultTable()
    expect(t.rows).toBe(TAB_DEFAULT_ROWS)
    expect(t.cols).toBe(TAB_DEFAULT_COLS)
    expect(t.cells).toEqual({})
  })

  it('accepts custom dimensions', () => {
    const t = createDefaultTable(5, 3)
    expect(t.rows).toBe(5)
    expect(t.cols).toBe(3)
  })
})

// ─── Serialization ───────────────────────────────────────────────────────────

describe('serializeTable / deserializeTable', () => {
  it('round-trips a table', () => {
    const t: TabTable = {
      rows: 5, cols: 3,
      cells: { A1: { value: 'hello' }, B2: { value: '42' } },
    }
    const json = serializeTable(t)
    const t2 = deserializeTable(json)
    expect(t2.rows).toBe(5)
    expect(t2.cols).toBe(3)
    expect(t2.cells['A1']?.value).toBe('hello')
    expect(t2.cells['B2']?.value).toBe('42')
  })

  it('returns default table for undefined/empty JSON', () => {
    const t = deserializeTable(undefined)
    expect(t.rows).toBe(TAB_DEFAULT_ROWS)
  })

  it('returns default table for invalid JSON', () => {
    const t = deserializeTable('not json')
    expect(t.rows).toBe(TAB_DEFAULT_ROWS)
  })

  it('clamps out-of-range rows/cols', () => {
    const json = JSON.stringify({ rows: 9999, cols: 999, cells: {} })
    const t = deserializeTable(json)
    expect(t.rows).toBeLessThanOrEqual(200)
    expect(t.cols).toBeLessThanOrEqual(26)
  })
})

// ─── evaluateCell ─────────────────────────────────────────────────────────────

describe('evaluateCell', () => {
  function makeTable(cells: Record<string, string>): TabTable {
    return {
      rows: 10, cols: 10,
      cells: Object.fromEntries(Object.entries(cells).map(([k, v]) => [k, { value: v }])),
    }
  }

  it('returns empty string for empty/missing cell', () => {
    const t = makeTable({})
    expect(evaluateCell('A1', t)).toBe('')
  })

  it('returns raw value for non-formula', () => {
    const t = makeTable({ A1: 'hello' })
    expect(evaluateCell('A1', t)).toBe('hello')
  })

  it('evaluates simple addition =1+2', () => {
    const t = makeTable({ A1: '=1+2' })
    expect(evaluateCell('A1', t)).toBe('3')
  })

  it('evaluates multiplication =3*4', () => {
    const t = makeTable({ A1: '=3*4' })
    expect(evaluateCell('A1', t)).toBe('12')
  })

  it('evaluates division =10/4', () => {
    const t = makeTable({ A1: '=10/4' })
    expect(evaluateCell('A1', t)).toBe('2.5')
  })

  it('returns #DIV/0! for division by zero', () => {
    const t = makeTable({ A1: '=1/0' })
    expect(evaluateCell('A1', t)).toBe('#DIV/0!')
  })

  it('evaluates cell reference =B1', () => {
    const t = makeTable({ A1: '=B1', B1: '7' })
    expect(evaluateCell('A1', t)).toBe('7')
  })

  it('returns #REF! for invalid reference', () => {
    const t = makeTable({ A1: '=ZZZ999' })
    expect(evaluateCell('A1', t)).toBe('#REF!')
  })

  it('returns #VAL! for non-numeric reference', () => {
    const t = makeTable({ A1: '=B1', B1: 'text' })
    expect(evaluateCell('A1', t)).toBe('#VAL!')
  })

  it('evaluates =SUM(A1:A3)', () => {
    const t = makeTable({ A1: '10', A2: '20', A3: '30', B1: '=SUM(A1:A3)' })
    expect(evaluateCell('B1', t)).toBe('60')
  })

  it('evaluates =AVG(A1:A4)', () => {
    const t = makeTable({ A1: '2', A2: '4', A3: '6', A4: '8', B1: '=AVG(A1:A4)' })
    expect(evaluateCell('B1', t)).toBe('5')
  })

  it('evaluates =MIN and =MAX', () => {
    const t = makeTable({ A1: '5', A2: '2', A3: '8', B1: '=MIN(A1:A3)', B2: '=MAX(A1:A3)' })
    expect(evaluateCell('B1', t)).toBe('2')
    expect(evaluateCell('B2', t)).toBe('8')
  })

  it('evaluates =COUNT', () => {
    const t = makeTable({ A1: '1', A2: 'text', A3: '3', B1: '=COUNT(A1:A3)' })
    expect(evaluateCell('B1', t)).toBe('2') // 'text' is not numeric
  })

  it('evaluates =ABS(-5)', () => {
    const t = makeTable({ A1: '=ABS(-5)' })
    expect(evaluateCell('A1', t)).toBe('5')
  })

  it('evaluates =SQRT(9)', () => {
    const t = makeTable({ A1: '=SQRT(9)' })
    expect(evaluateCell('A1', t)).toBe('3')
  })

  it('evaluates =ROUND(3.14159, 2)', () => {
    const t = makeTable({ A1: '=ROUND(3.14159,2)' })
    expect(evaluateCell('A1', t)).toBe('3.14')
  })

  it('handles unary minus =-(3+2)', () => {
    const t = makeTable({ A1: '=-(3+2)' })
    expect(evaluateCell('A1', t)).toBe('-5')
  })

  it('protects against circular references (cycle guard)', () => {
    const t = makeTable({ A1: '=B1', B1: '=A1' })
    const result = evaluateCell('A1', t)
    // A circular reference resolves to an error (either #ERR! or #VAL! depending on depth)
    expect(result).toMatch(/^#/)
  })

  it('returns #ERR! for unknown function', () => {
    const t = makeTable({ A1: '=FOO(1)' })
    expect(evaluateCell('A1', t)).toBe('#ERR!')
  })
})

// ─── CSV export ───────────────────────────────────────────────────────────────

describe('tableToCSV', () => {
  it('exports plain values correctly', () => {
    const t: TabTable = {
      rows: 2, cols: 2,
      cells: { A1: { value: 'Name' }, B1: { value: 'Score' }, A2: { value: 'Alice' }, B2: { value: '42' } },
    }
    const csv = tableToCSV(t)
    expect(csv).toContain('Name,Score')
    expect(csv).toContain('Alice,42')
  })

  it('quotes cells with commas', () => {
    const t: TabTable = {
      rows: 1, cols: 1,
      cells: { A1: { value: 'hello, world' } },
    }
    const csv = tableToCSV(t)
    expect(csv).toContain('"hello, world"')
  })

  it('evaluates formulas before exporting', () => {
    const t: TabTable = {
      rows: 1, cols: 2,
      cells: { A1: { value: '5' }, B1: { value: '=A1*2' } },
    }
    const csv = tableToCSV(t)
    expect(csv).toContain('10')
  })

  it('produces rows separated by CRLF', () => {
    const t: TabTable = {
      rows: 2, cols: 1,
      cells: { A1: { value: 'row1' }, A2: { value: 'row2' } },
    }
    const csv = tableToCSV(t)
    expect(csv).toContain('\r\n')
  })
})
