import { beforeEach, describe, expect, it } from 'vitest'
import {
  consumeFormulaRestoreIntent,
  FORMA_FORMULA_RESTORE_KEY,
  prepareFormulaNavigationFromSearch,
  setFormulaRestoreIntent,
} from './nav'

describe('formulas/nav', () => {
  beforeEach(() => {
    sessionStorage.removeItem(FORMA_FORMULA_RESTORE_KEY)
    localStorage.removeItem('forma-formula-history')
  })

  it('round-trips a restore intent via sessionStorage', () => {
    setFormulaRestoreIntent({
      formulaId: 'blondel',
      mode: 'height-steps',
      values: { totalHeight: '280' },
    })
    expect(consumeFormulaRestoreIntent()).toEqual({
      formulaId: 'blondel',
      mode: 'height-steps',
      values: { totalHeight: '280' },
    })
    expect(consumeFormulaRestoreIntent()).toBeNull()
  })

  it('prepares formula catalog navigation', () => {
    prepareFormulaNavigationFromSearch({
      type: 'formula',
      meta: { formulaId: 'mur-porteur' },
    })
    expect(consumeFormulaRestoreIntent()).toEqual({ formulaId: 'mur-porteur' })
  })

  it('prepares history entry navigation from persisted store', () => {
    localStorage.setItem(
      'forma-formula-history',
      JSON.stringify({
        state: {
          entries: [
            {
              id: 'h1',
              formulaId: 'blondel',
              title: 'Loi de Blondel',
              mode: 'height-steps',
              values: { totalHeight: '280', steps: '18' },
              summary: '2H + G = 62 cm',
              createdAt: 1000,
            },
          ],
        },
      }),
    )
    prepareFormulaNavigationFromSearch({
      type: 'formula-history',
      meta: { formulaId: 'blondel', historyId: 'h1' },
    })
    expect(consumeFormulaRestoreIntent()).toEqual({
      formulaId: 'blondel',
      mode: 'height-steps',
      values: { totalHeight: '280', steps: '18' },
    })
  })
})
