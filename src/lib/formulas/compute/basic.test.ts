import { describe, expect, it } from 'vitest'
import { circleArea, degToRad, pythagore, sinDeg } from './basic'

describe('formulas/basic', () => {
  it('returns a renderable result (rows + summary) for trig', () => {
    const r = sinDeg({ angle: '30' })
    expect(r.error).toBeUndefined()
    expect(r.rows && r.rows.length).toBeGreaterThan(0)
    expect(r.summary).toBeTruthy()
    expect(r.rows?.[0].label).toBe('sin(α)')
    expect(r.rows?.[0].value).toMatch(/^0[.,]5$/)
  })

  it('includes a detail row when provided', () => {
    const r = sinDeg({ angle: '30' })
    const detail = r.rows?.find((row) => row.label === 'Détail')
    expect(detail?.value).toContain('α = 30')
  })

  it('formats values with units', () => {
    const r = circleArea({ radius: '1' })
    expect(r.rows?.[0].value).toContain('m²')
    expect(r.summary).toContain('Aire cercle =')
  })

  it('computes pythagore hypotenuse', () => {
    const r = pythagore({ a: '3', b: '4' })
    expect(r.rows?.[0].value).toBe('5 m')
  })

  it('handles empty input without throwing', () => {
    const r = degToRad({})
    expect(r.error).toBeUndefined()
    expect(r.summary).toBeTruthy()
  })
})
