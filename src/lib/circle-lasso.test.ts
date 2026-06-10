import { describe, expect, it } from 'vitest'
import { detectCircleStroke, pointInCircle, strokeInCircle, type CircleRegion } from './circle-lasso'
import { createPoint } from './stroke-render'

function circlePoints(cx: number, cy: number, r: number, n = 24): { x: number; y: number; pressure: number; timestamp: number; tiltX: number; tiltY: number }[] {
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push(createPoint(cx + Math.cos(a) * r, cy + Math.sin(a) * r))
  }
  return pts
}

describe('detectCircleStroke', () => {
  it('returns null for fewer than 12 points', () => {
    const pts = circlePoints(100, 100, 50, 5)
    expect(detectCircleStroke(pts)).toBeNull()
  })

  it('detects a roughly circular closed stroke', () => {
    const pts = circlePoints(100, 100, 50)
    const region = detectCircleStroke(pts)
    expect(region).not.toBeNull()
    expect(region!.cx).toBeCloseTo(100, 0)
    expect(region!.cy).toBeCloseTo(100, 0)
    expect(region!.r).toBeCloseTo(50, 0)
  })

  it('returns null when the stroke does not close (start/end far apart)', () => {
    const pts = circlePoints(100, 100, 50, 24).slice(0, 18) // open arc
    expect(detectCircleStroke(pts)).toBeNull()
  })

  it('returns null when the bounding box is too small', () => {
    const pts = circlePoints(100, 100, 5)
    expect(detectCircleStroke(pts)).toBeNull()
  })

  it('returns null for an elongated (non-circular) shape', () => {
    // Build a flat ellipse-like loop: wide but short
    const pts = []
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 2
      pts.push(createPoint(100 + Math.cos(a) * 100, 100 + Math.sin(a) * 20))
    }
    expect(detectCircleStroke(pts)).toBeNull()
  })
})

describe('pointInCircle', () => {
  const circle: CircleRegion = { cx: 0, cy: 0, r: 10 }

  it('returns true for a point inside the circle', () => {
    expect(pointInCircle(5, 5, circle)).toBe(true)
  })

  it('returns true for a point exactly on the boundary', () => {
    expect(pointInCircle(10, 0, circle)).toBe(true)
  })

  it('returns false for a point outside the circle', () => {
    expect(pointInCircle(20, 20, circle)).toBe(false)
  })
})

describe('strokeInCircle', () => {
  const circle: CircleRegion = { cx: 0, cy: 0, r: 10 }

  it('returns true if any point is inside the circle', () => {
    expect(strokeInCircle([{ x: 100, y: 100 }, { x: 0, y: 0 }], circle)).toBe(true)
  })

  it('returns false if no points are inside the circle', () => {
    expect(strokeInCircle([{ x: 100, y: 100 }, { x: 200, y: 200 }], circle)).toBe(false)
  })

  it('returns false for an empty points array', () => {
    expect(strokeInCircle([], circle)).toBe(false)
  })
})
