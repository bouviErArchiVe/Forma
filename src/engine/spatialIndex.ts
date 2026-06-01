import type { Stroke } from '../types'
import type { DirtyRect } from './dirtyRects'
import { getStrokeBounds } from '../lib/stroke-render'

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const bboxCache = new WeakMap<Stroke, BBox>()

export function getStrokeBBox(stroke: Stroke): BBox {
  const cached = bboxCache.get(stroke)
  if (cached) return cached
  const b = getStrokeBounds(stroke)
  const bbox: BBox = { minX: b.minX, minY: b.minY, maxX: b.maxX, maxY: b.maxY }
  bboxCache.set(stroke, bbox)
  return bbox
}

export function bboxIntersectsRect(bbox: BBox, rect: DirtyRect): boolean {
  return (
    bbox.maxX >= rect.x &&
    bbox.minX <= rect.x + rect.w &&
    bbox.maxY >= rect.y &&
    bbox.minY <= rect.y + rect.h
  )
}

export function filterStrokesByRect(strokes: Stroke[], rect: DirtyRect): Stroke[] {
  return strokes.filter((s) => bboxIntersectsRect(getStrokeBBox(s), rect))
}

export function invalidateBBox(stroke: Stroke): void {
  bboxCache.delete(stroke)
}
