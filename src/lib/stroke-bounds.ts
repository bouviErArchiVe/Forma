import type { Stroke } from '../types'

export function strokeIntersectsCircle(
  stroke: Stroke,
  cx: number,
  cy: number,
  radius: number,
): boolean {
  const pad = radius + stroke.width / 2
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const p of stroke.points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }
  if (!stroke.points.length) return false
  const closestX = Math.max(minX, Math.min(cx, maxX))
  const closestY = Math.max(minY, Math.min(cy, maxY))
  return Math.hypot(cx - closestX, cy - closestY) <= pad
}
