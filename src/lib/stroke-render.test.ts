import { describe, expect, it, vi } from 'vitest'
import {
  createPoint,
  drawStroke,
  getStrokeBounds,
  pointNearStroke,
  strokeIntersectsRect,
} from './stroke-render'
import type { Stroke } from '../types'

function makeStroke(overrides: Partial<Stroke> = {}): Stroke {
  return {
    id: 'test',
    tool: 'pen',
    color: '#000',
    width: 2,
    opacity: 1,
    pageId: 'p1',
    points: [createPoint(10, 10), createPoint(20, 20), createPoint(30, 10)],
    ...overrides,
  }
}

function makeCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    strokeStyle: '',
    lineCap: '',
    lineJoin: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D
}

describe('getStrokeBounds', () => {
  it('returns zero bounds for empty stroke', () => {
    const b = getStrokeBounds(makeStroke({ points: [] }))
    expect(b).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 })
  })

  it('pads bounds by 2× stroke width', () => {
    const stroke = makeStroke({ width: 4, points: [createPoint(10, 20), createPoint(30, 40)] })
    const b = getStrokeBounds(stroke)
    expect(b.minX).toBe(10 - 8)
    expect(b.minY).toBe(20 - 8)
    expect(b.maxX).toBe(30 + 8)
    expect(b.maxY).toBe(40 + 8)
  })
})

describe('strokeIntersectsRect', () => {
  it('detects intersection when stroke bounds overlap rect', () => {
    const stroke = makeStroke({ width: 1, points: [createPoint(50, 50), createPoint(60, 60)] })
    expect(strokeIntersectsRect(stroke, 40, 40, 30, 30)).toBe(true)
  })

  it('returns false when stroke is outside rect', () => {
    const stroke = makeStroke({ width: 1, points: [createPoint(200, 200), createPoint(210, 210)] })
    expect(strokeIntersectsRect(stroke, 0, 0, 100, 100)).toBe(false)
  })
})

describe('pointNearStroke', () => {
  it('returns true when query point is within threshold of a stroke point', () => {
    const stroke = makeStroke({ width: 2 })
    expect(pointNearStroke(stroke, 10, 10, 5)).toBe(true)
  })

  it('accounts for stroke.width / 2 in threshold', () => {
    const stroke = makeStroke({ width: 8, points: [createPoint(0, 0), createPoint(100, 100)] })
    // threshold=1 but stroke.width/2=4, so a point 4px away should pass
    expect(pointNearStroke(stroke, 4, 0, 1)).toBe(true)
  })

  it('returns false when point is far from all stroke points', () => {
    const stroke = makeStroke({ width: 2, points: [createPoint(0, 0), createPoint(5, 5)] })
    expect(pointNearStroke(stroke, 100, 100, 5)).toBe(false)
  })
})

describe('drawStroke', () => {
  it('does nothing for a stroke with fewer than 2 points', () => {
    const ctx = makeCtx()
    drawStroke(ctx, makeStroke({ points: [createPoint(0, 0)] }))
    expect(ctx.save).not.toHaveBeenCalled()
  })

  it('sets globalAlpha=0.82 for pencil tool', () => {
    const ctx = makeCtx()
    drawStroke(ctx, makeStroke({ tool: 'pencil' }))
    expect(ctx.globalAlpha).toBe(0.82)
  })

  it('uses multiply composite for highlighter', () => {
    const ctx = makeCtx()
    drawStroke(ctx, makeStroke({ tool: 'highlighter', opacity: 0.4 }))
    expect(ctx.globalCompositeOperation).toBe('multiply')
    expect(ctx.globalAlpha).toBe(0.4)
  })

  it('calls ctx.stroke for a valid pen stroke', () => {
    const ctx = makeCtx()
    drawStroke(ctx, makeStroke())
    expect(ctx.stroke).toHaveBeenCalled()
  })
})
