import type { Point } from '../types'

export interface CircleRegion {
  cx: number
  cy: number
  r: number
}

/** Détecte un tracé circulaire fermé (geste Circle to Lasso) */
export function detectCircleStroke(points: Point[]): CircleRegion | null {
  if (points.length < 12) return null
  const first = points[0]
  const last = points[points.length - 1]
  const closeDist = Math.hypot(last.x - first.x, last.y - first.y)
  if (closeDist > 40) return null

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  const w = maxX - minX
  const h = maxY - minY
  if (w < 30 || h < 30) return null
  const ratio = w / h
  if (ratio < 0.65 || ratio > 1.45) return null

  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const r = Math.max(w, h) / 2
  return { cx, cy, r }
}

export function pointInCircle(
  x: number,
  y: number,
  circle: CircleRegion,
): boolean {
  return Math.hypot(x - circle.cx, y - circle.cy) <= circle.r
}

export function strokeInCircle(
  points: { x: number; y: number }[],
  circle: CircleRegion,
): boolean {
  return points.some((p) => pointInCircle(p.x, p.y, circle))
}
