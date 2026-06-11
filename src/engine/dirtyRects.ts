import type { InkClip } from '../lib/page-render'
import type { ImageElement, ShapeElement, Stroke } from '../types'
import { getStrokeBounds } from '../lib/stroke-render'

export interface DirtyRect {
  x: number
  y: number
  w: number
  h: number
}

export type InvalidationReason =
  | 'stroke'
  | 'stroke-preview'
  | 'erase'
  | 'image'
  | 'shape'
  | 'move'
  | 'selection'
  | 'eraser-cursor'
  | 'lasso'
  | 'tape'
  | 'undo-redo'
  | 'page-change'
  | 'resize'
  | 'zoom'
  | 'template'
  | 'init'

export interface InvalidationState {
  rects: DirtyRect[]
  fullRedraw: boolean
  reason: InvalidationReason
}

const FULL_REDRAW_THRESHOLD_RATIO = 0.75

export function unionRects(a: DirtyRect, b: DirtyRect): DirtyRect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  const right = Math.max(a.x + a.w, b.x + b.w)
  const bottom = Math.max(a.y + a.h, b.y + b.h)
  return { x, y, w: right - x, h: bottom - y }
}

export function intersectRects(a: DirtyRect, b: DirtyRect): DirtyRect | null {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const right = Math.min(a.x + a.w, b.x + b.w)
  const bottom = Math.min(a.y + a.h, b.y + b.h)
  if (right <= x || bottom <= y) return null
  return { x, y, w: right - x, h: bottom - y }
}

export function inflateRect(r: DirtyRect, pad: number): DirtyRect {
  return { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 }
}

export function clampRect(r: DirtyRect, pageW: number, pageH: number): DirtyRect {
  const x = Math.max(0, r.x)
  const y = Math.max(0, r.y)
  const right = Math.min(pageW, r.x + r.w)
  const bottom = Math.min(pageH, r.y + r.h)
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) }
}

export function isValidRect(r: DirtyRect): boolean {
  return (
    isFinite(r.x) &&
    isFinite(r.y) &&
    isFinite(r.w) &&
    isFinite(r.h) &&
    r.w > 0 &&
    r.h > 0
  )
}

export function mergeNearbyRects(rects: DirtyRect[], mergeDistance = 40): DirtyRect[] {
  if (rects.length <= 1) return rects
  const result: DirtyRect[] = [rects[0]]
  for (let i = 1; i < rects.length; i++) {
    const cur = rects[i]
    let merged = false
    for (let j = 0; j < result.length; j++) {
      const r = result[j]
      const expanded = inflateRect(r, mergeDistance)
      if (intersectRects(expanded, cur)) {
        result[j] = unionRects(r, cur)
        merged = true
        break
      }
    }
    if (!merged) result.push(cur)
  }
  return result
}

export function rectFromStroke(stroke: Stroke, pad = 28): DirtyRect | null {
  if (stroke.points.length < 1) return null
  const b = getStrokeBounds(stroke)
  const r: DirtyRect = { x: b.minX, y: b.minY, w: b.maxX - b.minX, h: b.maxY - b.minY }
  return inflateRect(r, Math.max(pad, stroke.width * 2))
}

export function rectFromImage(img: ImageElement, pad = 4): DirtyRect {
  return inflateRect({ x: img.x, y: img.y, w: img.width, h: img.height }, pad)
}

export function rectFromShape(shape: ShapeElement, pad = 8): DirtyRect {
  const x = Math.min(shape.x1, shape.x2)
  const y = Math.min(shape.y1, shape.y2)
  const w = Math.abs(shape.x2 - shape.x1)
  const h = Math.abs(shape.y2 - shape.y1)
  return inflateRect({ x, y, w: Math.max(w, 1), h: Math.max(h, 1) }, pad + shape.width)
}

export function toInkClip(r: DirtyRect): InkClip {
  return { x: r.x, y: r.y, w: r.w, h: r.h }
}

export function needsFullRedraw(rects: DirtyRect[], pageW: number, pageH: number): boolean {
  if (rects.length === 0) return false
  if (rects.length > 12) return true
  const total = rects.reduce((sum, r) => sum + r.w * r.h, 0)
  return total / (pageW * pageH) > FULL_REDRAW_THRESHOLD_RATIO
}

export function buildInvalidation(
  rects: DirtyRect[],
  reason: InvalidationReason,
  pageW: number,
  pageH: number,
): InvalidationState {
  const valid = rects.filter(isValidRect).map((r) => clampRect(r, pageW, pageH)).filter(isValidRect)
  if (valid.length === 0) {
    return { rects: [], fullRedraw: true, reason }
  }
  const merged = mergeNearbyRects(valid)
  const full = needsFullRedraw(merged, pageW, pageH)
  return { rects: merged, fullRedraw: full, reason }
}

export function fullRedrawState(reason: InvalidationReason): InvalidationState {
  return { rects: [], fullRedraw: true, reason }
}
