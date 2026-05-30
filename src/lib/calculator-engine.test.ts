import { describe, expect, it } from 'vitest'
import { evaluateExpression, formatResult } from './calculator-engine'

describe('calculator-engine', () => {
  it('evaluates basic arithmetic', () => {
    expect(evaluateExpression('2+3*4')).toBe(14)
  })

  it('evaluates sqrt', () => {
    expect(evaluateExpression('sqrt(16)')).toBe(4)
  })

  it('formats results', () => {
    expect(formatResult(3.1415926535)).toBe('3.1415926535')
  })
})
