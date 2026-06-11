import { describe, expect, it } from 'vitest'
import { bboxIntersectsRect, filterStrokesByRect, getStrokeBBox, invalidateBBox } from './spatialIndex'
import { createPoint } from '../lib/stroke-render'
import type { Stroke } from '../types'
import type { DirtyRect } from './dirtyRects'

function makeStroke(points: { x: number; y: number }[], width = 2): Stroke {
  return {
    id: 'test',
    tool: 'pen',
    color: '#000',
    width,
    opacity: 1,
    pageId: 'p1',
    points: points.map((p) => createPoint(p.x, p.y)),
  }
}

describe('getStrokeBBox', () => {
  it('returns cached bbox on second call', () => {
    const s = makeStroke([{ x: 10, y: 20 }, { x: 30, y: 40 }])
    const b1 = getStrokeBBox(s)
    const b2 = getStrokeBBox(s)
    expect(b1).toBe(b2) // same object reference = cache hit
  })

  it('includes stroke width padding in bounds', () => {
    const s = makeStroke([{ x: 10, y: 10 }, { x: 20, y: 20 }], 4)
    const b = getStrokeBBox(s)
    // getStrokeBounds pads by 2×width = 8
    expect(b.minX).toBeLessThan(10)
    expect(b.minY).toBeLessThan(10)
  })
})

describe('invalidateBBox', () => {
  it('forces recompute after invalidation', () => {
    const s = makeStroke([{ x: 0, y: 0 }, { x: 10, y: 10 }])
    const b1 = getStrokeBBox(s)
    invalidateBBox(s)
    const b2 = getStrokeBBox(s)
    // different object reference = cache was cleared
    expect(b1).not.toBe(b2)
    // but values are equal
    expect(b1).toEqual(b2)
  })
})

describe('bboxIntersectsRect', () => {
  it('returns true when bbox overlaps rect', () => {
    const bbox = { minX: 0, minY: 0, maxX: 50, maxY: 50 }
    const rect: DirtyRect = { x: 30, y: 30, w: 40, h: 40 }
    expect(bboxIntersectsRect(bbox, rect)).toBe(true)
  })

  it('returns false when bbox is to the left of rect', () => {
    const bbox = { minX: 0, minY: 0, maxX: 10, maxY: 10 }
    const rect: DirtyRect = { x: 50, y: 0, w: 10, h: 10 }
    expect(bboxIntersectsRect(bbox, rect)).toBe(false)
  })

  it('returns false when bbox is above rect', () => {
    const bbox = { minX: 0, minY: 0, maxX: 10, maxY: 10 }
    const rect: DirtyRect = { x: 0, y: 50, w: 10, h: 10 }
    expect(bboxIntersectsRect(bbox, rect)).toBe(false)
  })
})

describe('filterStrokesByRect', () => {
  it('returns only strokes intersecting the rect', () => {
    const s1 = makeStroke([{ x: 0, y: 0 }, { x: 10, y: 10 }])
    const s2 = makeStroke([{ x: 200, y: 200 }, { x: 210, y: 210 }])
    const rect: DirtyRect = { x: 0, y: 0, w: 50, h: 50 }
    const result = filterStrokesByRect([s1, s2], rect)
    expect(result).toContain(s1)
    expect(result).not.toContain(s2)
  })

  it('returns empty array when no strokes intersect', () => {
    const s = makeStroke([{ x: 500, y: 500 }, { x: 510, y: 510 }])
    const rect: DirtyRect = { x: 0, y: 0, w: 10, h: 10 }
    expect(filterStrokesByRect([s], rect)).toHaveLength(0)
  })
})
