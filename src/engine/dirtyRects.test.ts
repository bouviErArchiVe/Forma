import { describe, expect, it } from 'vitest'
import {
  buildInvalidation,
  clampRect,
  fullRedrawState,
  inflateRect,
  intersectRects,
  isValidRect,
  mergeNearbyRects,
  needsFullRedraw,
  toInkClip,
  unionRects,
  type DirtyRect,
} from './dirtyRects'

describe('unionRects', () => {
  it('merges two non-overlapping rects', () => {
    const a: DirtyRect = { x: 0, y: 0, w: 10, h: 10 }
    const b: DirtyRect = { x: 20, y: 20, w: 10, h: 10 }
    const r = unionRects(a, b)
    expect(r).toEqual({ x: 0, y: 0, w: 30, h: 30 })
  })

  it('merges overlapping rects', () => {
    const a: DirtyRect = { x: 0, y: 0, w: 20, h: 20 }
    const b: DirtyRect = { x: 10, y: 10, w: 20, h: 20 }
    const r = unionRects(a, b)
    expect(r).toEqual({ x: 0, y: 0, w: 30, h: 30 })
  })
})

describe('intersectRects', () => {
  it('returns intersection of overlapping rects', () => {
    const a: DirtyRect = { x: 0, y: 0, w: 20, h: 20 }
    const b: DirtyRect = { x: 10, y: 10, w: 20, h: 20 }
    const r = intersectRects(a, b)
    expect(r).toEqual({ x: 10, y: 10, w: 10, h: 10 })
  })

  it('returns null when rects do not overlap', () => {
    const a: DirtyRect = { x: 0, y: 0, w: 10, h: 10 }
    const b: DirtyRect = { x: 20, y: 20, w: 10, h: 10 }
    expect(intersectRects(a, b)).toBeNull()
  })
})

describe('inflateRect', () => {
  it('inflates by the given padding', () => {
    const r: DirtyRect = { x: 10, y: 10, w: 20, h: 20 }
    expect(inflateRect(r, 5)).toEqual({ x: 5, y: 5, w: 30, h: 30 })
  })
})

describe('clampRect', () => {
  it('clamps to page bounds', () => {
    const r: DirtyRect = { x: -10, y: -5, w: 800, h: 400 }
    const c = clampRect(r, 500, 300)
    expect(c.x).toBe(0)
    expect(c.y).toBe(0)
    expect(c.w).toBe(500)
    expect(c.h).toBe(300)
  })

  it('returns zero-size rect when entirely outside', () => {
    const r: DirtyRect = { x: 600, y: 400, w: 100, h: 100 }
    const c = clampRect(r, 500, 300)
    expect(c.w).toBe(0)
    expect(isValidRect(c)).toBe(false)
  })
})

describe('isValidRect', () => {
  it('rejects NaN', () => {
    expect(isValidRect({ x: NaN, y: 0, w: 10, h: 10 })).toBe(false)
  })
  it('rejects zero width', () => {
    expect(isValidRect({ x: 0, y: 0, w: 0, h: 10 })).toBe(false)
  })
  it('accepts valid rect', () => {
    expect(isValidRect({ x: 0, y: 0, w: 10, h: 10 })).toBe(true)
  })
})

describe('mergeNearbyRects', () => {
  it('returns single rect unchanged', () => {
    const r: DirtyRect = { x: 0, y: 0, w: 10, h: 10 }
    expect(mergeNearbyRects([r])).toEqual([r])
  })

  it('merges adjacent rects within distance', () => {
    const a: DirtyRect = { x: 0, y: 0, w: 10, h: 10 }
    const b: DirtyRect = { x: 30, y: 0, w: 10, h: 10 } // 20px gap, default distance 40
    const result = mergeNearbyRects([a, b])
    expect(result).toHaveLength(1)
  })

  it('keeps distant rects separate', () => {
    const a: DirtyRect = { x: 0, y: 0, w: 10, h: 10 }
    const b: DirtyRect = { x: 200, y: 200, w: 10, h: 10 }
    const result = mergeNearbyRects([a, b], 40)
    expect(result).toHaveLength(2)
  })
})

describe('needsFullRedraw', () => {
  it('returns false for empty rects', () => {
    expect(needsFullRedraw([], 500, 800)).toBe(false)
  })

  it('returns true when too many rects', () => {
    const rects: DirtyRect[] = Array.from({ length: 13 }, (_, i) => ({
      x: i * 10, y: 0, w: 5, h: 5,
    }))
    expect(needsFullRedraw(rects, 500, 800)).toBe(true)
  })

  it('returns true when total area exceeds threshold', () => {
    const r: DirtyRect = { x: 0, y: 0, w: 500, h: 700 } // ~87% of 500×800
    expect(needsFullRedraw([r], 500, 800)).toBe(true)
  })

  it('returns false for small rect', () => {
    const r: DirtyRect = { x: 0, y: 0, w: 100, h: 100 }
    expect(needsFullRedraw([r], 500, 800)).toBe(false)
  })
})

describe('buildInvalidation', () => {
  it('produces full redraw for empty rect list', () => {
    const s = buildInvalidation([], 'stroke', 500, 800)
    expect(s.fullRedraw).toBe(true)
  })

  it('filters NaN rects and falls back to full redraw', () => {
    const s = buildInvalidation([{ x: NaN, y: 0, w: 10, h: 10 }], 'stroke', 500, 800)
    expect(s.fullRedraw).toBe(true)
  })

  it('produces partial redraw for valid small rect', () => {
    const s = buildInvalidation([{ x: 10, y: 10, w: 50, h: 50 }], 'stroke', 500, 800)
    expect(s.fullRedraw).toBe(false)
    expect(s.rects).toHaveLength(1)
  })

  it('preserves reason', () => {
    const s = buildInvalidation([{ x: 0, y: 0, w: 10, h: 10 }], 'eraser-cursor', 500, 800)
    expect(s.reason).toBe('eraser-cursor')
  })
})

describe('fullRedrawState', () => {
  it('always sets fullRedraw=true', () => {
    const s = fullRedrawState('page-change')
    expect(s.fullRedraw).toBe(true)
    expect(s.rects).toHaveLength(0)
    expect(s.reason).toBe('page-change')
  })
})

describe('toInkClip', () => {
  it('converts DirtyRect to InkClip', () => {
    const r: DirtyRect = { x: 5, y: 10, w: 100, h: 200 }
    expect(toInkClip(r)).toEqual({ x: 5, y: 10, w: 100, h: 200 })
  })
})
