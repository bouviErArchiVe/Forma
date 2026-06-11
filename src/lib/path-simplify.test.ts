import { describe, expect, it } from 'vitest'
import { simplifyPolyline, simplifyStrokePointsForSvg } from './path-simplify'

describe('path-simplify', () => {
  it('keeps short polylines unchanged', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ]
    expect(simplifyPolyline(pts, 1)).toEqual(pts)
    expect(simplifyStrokePointsForSvg(pts, 'pen')).toEqual(pts)
  })

  it('reduces nearly collinear stroke points', () => {
    const pts = Array.from({ length: 40 }, (_, i) => ({ x: i, y: i * 0.02 }))
    const out = simplifyStrokePointsForSvg(pts, 'pen')
    expect(out.length).toBeLessThan(pts.length)
    expect(out[0]).toEqual(pts[0])
    expect(out[out.length - 1]).toEqual(pts[pts.length - 1])
  })

  it('preserves sharp turns in L-shaped strokes', () => {
    const horiz = Array.from({ length: 15 }, (_, i) => ({ x: i * 4, y: 0 }))
    const vert = Array.from({ length: 15 }, (_, i) => ({ x: 56, y: i * 4 }))
    const pts = [...horiz, ...vert.slice(1)]
    const out = simplifyPolyline(pts, 0.5)
    expect(out.length).toBeLessThan(pts.length)
    expect(out[0]).toEqual(pts[0])
    expect(out[out.length - 1]).toEqual(pts[pts.length - 1])
    expect(out.some((p) => p.x >= 52 && p.y <= 4)).toBe(true)
    expect(out.some((p) => p.x >= 52 && p.y >= 52)).toBe(true)
  })
})
