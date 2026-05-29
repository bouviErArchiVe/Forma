import type { Point, Stroke } from '../types'
import { createId } from './id'

const MAX_POINTS = 5000
const MAX_DURATION_MS = 10_000

/** Découpe un trait trop long (spec addendum §8.1). */
export function splitStrokeIfNeeded(stroke: Stroke): Stroke[] {
  if (stroke.points.length < 2) return stroke.points.length ? [stroke] : []

  const chunks: Point[][] = []
  let current: Point[] = []
  let chunkStart = stroke.points[0].timestamp

  for (const p of stroke.points) {
    const duration = p.timestamp - chunkStart
    if (
      current.length > 0 &&
      (current.length >= MAX_POINTS || duration > MAX_DURATION_MS)
    ) {
      chunks.push(current)
      current = [p]
      chunkStart = p.timestamp
    } else {
      if (!current.length) chunkStart = p.timestamp
      current.push(p)
    }
  }
  if (current.length) chunks.push(current)

  if (chunks.length <= 1) return [stroke]

  return chunks.map((points, i) => ({
    ...stroke,
    id: i === 0 ? stroke.id : createId(),
    points,
  }))
}

export function appendStrokes(pageStrokes: Stroke[], stroke: Stroke): Stroke[] {
  return [...pageStrokes, ...splitStrokeIfNeeded(stroke)]
}
