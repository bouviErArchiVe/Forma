import { describe, expect, it } from 'vitest'
import { convertDrawingScale, convertValue, parseScaleFactor } from './units'

describe('units', () => {
  it('converts length mm to m', () => {
    expect(convertValue(1000, 'length', 'mm', 'm')).toBe(1)
  })

  it('parses scale factor 1:50', () => {
    expect(parseScaleFactor('1:50')).toBe(50)
  })

  it('converts drawing scale', () => {
    const r = convertDrawingScale(10, 'mm', '1:50')
    expect(r?.mm).toBe(500)
  })
})
