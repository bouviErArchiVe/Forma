import { describe, expect, it } from 'vitest'
import { calcAreaRect, calcSlope, ruleOfThree, simplifyRatio } from './arch-calculator'

describe('arch-calculator', () => {
  it('computes rectangle area', () => {
    expect(calcAreaRect(3, 4)).toBe(12)
  })

  it('computes slope', () => {
    const s = calcSlope(1, 10)
    expect(s?.pct).toBeCloseTo(10)
  })

  it('rule of three', () => {
    expect(ruleOfThree(2, 6, 5)).toBe(15)
  })

  it('simplifies ratio', () => {
    expect(simplifyRatio(4, 8)).toEqual({ a: 1, b: 2, decimal: 0.5 })
  })
})
