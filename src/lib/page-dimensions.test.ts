import { describe, expect, it } from 'vitest'
import {
  PAGE_HEIGHT_PORTRAIT,
  PAGE_WIDTH_PORTRAIT,
  basePageDimensions,
  displayPageDimensions,
  unrotatePoint,
} from './page-dimensions'

describe('basePageDimensions', () => {
  it('returns portrait dimensions by default', () => {
    expect(basePageDimensions()).toEqual({ width: PAGE_WIDTH_PORTRAIT, height: PAGE_HEIGHT_PORTRAIT })
  })

  it('returns portrait dimensions explicitly', () => {
    expect(basePageDimensions('portrait')).toEqual({ width: PAGE_WIDTH_PORTRAIT, height: PAGE_HEIGHT_PORTRAIT })
  })

  it('swaps width/height for landscape', () => {
    expect(basePageDimensions('landscape')).toEqual({ width: PAGE_HEIGHT_PORTRAIT, height: PAGE_WIDTH_PORTRAIT })
  })
})

describe('displayPageDimensions', () => {
  it('returns base dimensions for rotation 0', () => {
    expect(displayPageDimensions('portrait', 0)).toEqual({ width: PAGE_WIDTH_PORTRAIT, height: PAGE_HEIGHT_PORTRAIT })
  })

  it('swaps dimensions for 90 degree rotation', () => {
    expect(displayPageDimensions('portrait', 90)).toEqual({ width: PAGE_HEIGHT_PORTRAIT, height: PAGE_WIDTH_PORTRAIT })
  })

  it('swaps dimensions for 270 degree rotation', () => {
    expect(displayPageDimensions('portrait', 270)).toEqual({ width: PAGE_HEIGHT_PORTRAIT, height: PAGE_WIDTH_PORTRAIT })
  })

  it('does not swap for 180 degree rotation', () => {
    expect(displayPageDimensions('portrait', 180)).toEqual({ width: PAGE_WIDTH_PORTRAIT, height: PAGE_HEIGHT_PORTRAIT })
  })

  it('handles landscape with rotation', () => {
    expect(displayPageDimensions('landscape', 90)).toEqual({ width: PAGE_WIDTH_PORTRAIT, height: PAGE_HEIGHT_PORTRAIT })
  })
})

describe('unrotatePoint', () => {
  it('returns the same point for rotation 0', () => {
    expect(unrotatePoint(10, 20, 0, 100, 200)).toEqual({ x: 10, y: 20 })
  })

  it('rotates a point by 90 degrees around the center', () => {
    // center is (50, 100); point at (50, 0) is directly above center
    const result = unrotatePoint(50, 0, 90, 100, 200)
    expect(result.x).toBeCloseTo(-50, 5)
    expect(result.y).toBeCloseTo(100, 5)
  })

  it('rotates a point by 180 degrees around the center', () => {
    const result = unrotatePoint(0, 0, 180, 100, 200)
    expect(result.x).toBeCloseTo(100, 5)
    expect(result.y).toBeCloseTo(200, 5)
  })

  it('rotates a point by 270 degrees around the center', () => {
    const result = unrotatePoint(50, 0, 270, 100, 200)
    expect(result.x).toBeCloseTo(150, 5)
    expect(result.y).toBeCloseTo(100, 5)
  })
})
