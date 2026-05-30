import { beforeEach, describe, expect, it } from 'vitest'
import { cellKey } from './cells'
import { computeSheet, sheetToCsv } from './formulas'
import { createSheet } from './model'

describe('spreadsheet formulas', () => {
  it('computes SUM over range', () => {
    let sheet = createSheet('Test')
    sheet = {
      ...sheet,
      cells: {
        [cellKey(0, 0)]: { raw: '10' },
        [cellKey(1, 0)]: { raw: '20' },
        [cellKey(2, 0)]: { raw: '=SOMME(A1:A2)' },
      },
    }
    const computed = computeSheet(sheet)
    expect(computed[cellKey(2, 0)]?.value).toBe('30')
  })

  it('detects circular reference', () => {
    let sheet = createSheet('Ref')
    sheet = {
      ...sheet,
      cells: {
        [cellKey(0, 0)]: { raw: '=A1' },
      },
    }
    const computed = computeSheet(sheet)
    expect(computed[cellKey(0, 0)]?.value).toBe('#REF')
  })

  it('exports csv with computed values', () => {
    let sheet = createSheet('Csv')
    sheet = {
      ...sheet,
      rows: 2,
      cols: 2,
      cells: {
        [cellKey(0, 0)]: { raw: '1' },
        [cellKey(0, 1)]: { raw: '=A1*2' },
      },
    }
    const csv = sheetToCsv(sheet)
    expect(csv).toContain('1')
    expect(csv).toContain('2')
  })
})
