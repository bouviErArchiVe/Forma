import { describe, expect, it } from 'vitest'
import { appendStrokes, splitStrokeIfNeeded } from './stroke-finalize'
import type { Point, Stroke } from '../types'

function makeStroke(points: Point[]): Stroke {
  return {
    id: 'base',
    tool: 'pen',
    color: '#000',
    width: 2,
    opacity: 1,
    pageId: 'p1',
    points,
  }
}

function pt(x: number, timestamp: number): Point {
  return { x, y: 0, pressure: 0.5, timestamp, tiltX: 0, tiltY: 0 }
}

describe('splitStrokeIfNeeded', () => {
  it('returns empty array for a stroke with no points', () => {
    expect(splitStrokeIfNeeded(makeStroke([]))).toEqual([])
  })

  it('returns the stroke unchanged for a single point', () => {
    const stroke = makeStroke([pt(0, 0)])
    expect(splitStrokeIfNeeded(stroke)).toEqual([stroke])
  })

  it('returns the stroke unchanged when under thresholds', () => {
    const stroke = makeStroke([pt(0, 0), pt(1, 100), pt(2, 200)])
    const result = splitStrokeIfNeeded(stroke)
    expect(result).toEqual([stroke])
  })

  it('splits a stroke that exceeds MAX_DURATION_MS', () => {
    const points = [pt(0, 0), pt(1, 5000), pt(2, 11000), pt(3, 12000)]
    const stroke = makeStroke(points)
    const result = splitStrokeIfNeeded(stroke)
    expect(result.length).toBe(2)
    expect(result[0].id).toBe('base')
    expect(result[0].points).toEqual(points.slice(0, 2))
    expect(result[1].points).toEqual(points.slice(2))
    expect(result[1].id).not.toBe('base')
  })

  it('splits a stroke that exceeds MAX_POINTS', () => {
    const points: Point[] = []
    for (let i = 0; i < 5001; i++) points.push(pt(i, i))
    const stroke = makeStroke(points)
    const result = splitStrokeIfNeeded(stroke)
    expect(result.length).toBe(2)
    expect(result[0].points.length).toBe(5000)
    expect(result[1].points.length).toBe(1)
  })
})

describe('appendStrokes', () => {
  it('appends a single stroke when within limits', () => {
    const stroke = makeStroke([pt(0, 0), pt(1, 100)])
    const result = appendStrokes([], stroke)
    expect(result).toEqual([stroke])
  })

  it('appends multiple chunks for an oversized stroke', () => {
    const points = [pt(0, 0), pt(1, 5000), pt(2, 11000), pt(3, 12000)]
    const stroke = makeStroke(points)
    const result = appendStrokes([], stroke)
    expect(result.length).toBe(2)
  })

  it('preserves existing strokes', () => {
    const existing = makeStroke([pt(0, 0)])
    const next = makeStroke([pt(1, 0), pt(2, 100)])
    const result = appendStrokes([existing], next)
    expect(result[0]).toBe(existing)
    expect(result.length).toBe(2)
  })

  it('drops a stroke with no points entirely', () => {
    const stroke = makeStroke([])
    const result = appendStrokes([], stroke)
    expect(result).toEqual([])
  })
})
