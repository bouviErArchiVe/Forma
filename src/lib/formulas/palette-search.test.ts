import { beforeEach, describe, expect, it } from 'vitest'
import {
  prepareFormulaPaletteNavigation,
  searchFormulasForPalette,
  type FormulaPaletteHit,
} from './palette-search'
import { consumeFormulaRestoreIntent, FORMA_FORMULA_RESTORE_KEY } from './nav'

describe('formulas/palette-search', () => {
  beforeEach(() => {
    sessionStorage.removeItem(FORMA_FORMULA_RESTORE_KEY)
    localStorage.removeItem('forma-formula-history')
  })

  it('returns nothing for queries shorter than 2 chars', () => {
    expect(searchFormulasForPalette('b')).toEqual([])
    expect(searchFormulasForPalette('  ')).toEqual([])
  })

  it('finds catalog formulas by title or tag', () => {
    const hits = searchFormulasForPalette('blondel')
    expect(hits.some((h) => h.formulaId === 'blondel')).toBe(true)
    expect(hits[0].hint).toBeTruthy()
  })

  it('finds saved calculations in history', () => {
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
              values: { totalHeight: '280' },
              summary: '2H + G = 62 cm',
              createdAt: 1000,
            },
          ],
        },
      }),
    )
    const hits = searchFormulasForPalette('62 cm')
    expect(hits).toHaveLength(1)
    expect(hits[0].id).toBe('formula-history:h1')
    expect(hits[0].values).toEqual({ totalHeight: '280' })
  })

  it('prepares restore intent for palette navigation', () => {
    const hit: FormulaPaletteHit = {
      id: 'formula:blondel',
      label: 'Loi de Blondel',
      hint: '2H + G',
      formulaId: 'blondel',
      mode: 'height-steps',
      values: { steps: '18' },
    }
    prepareFormulaPaletteNavigation(hit)
    expect(consumeFormulaRestoreIntent()).toEqual({
      formulaId: 'blondel',
      mode: 'height-steps',
      values: { steps: '18' },
    })
  })
})
