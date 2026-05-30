import { describe, expect, it } from 'vitest'
import { FORMULAS, getFormulaById } from './catalog'

describe('formulas catalog', () => {
  it('loads 60+ architecture formulas', () => {
    expect(FORMULAS.length).toBeGreaterThanOrEqual(60)
  })

  it('finds blondel formula', () => {
    const f = getFormulaById('blondel')
    expect(f?.title).toMatch(/Blondel/i)
    const r = f?.compute('height-steps', { totalHeight: '280', steps: '18' }, { lengthUnit: 'cm' })
    expect(r?.summary).toBeTruthy()
  })
})
