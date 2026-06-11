import type { Point, ShapeElement, ShapeType } from '../types'
import { createId } from './id'

export function detectShapeFromPoints(
  points: Point[],
  type: ShapeType,
  color: string,
  width: number,
  pageId: string,
): ShapeElement | null {
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]

  const autoType = type === 'rectangle' ? guessShapeType(points) : type

  if (autoType === 'ellipse' || autoType === 'rectangle') {
    const w = Math.abs(last.x - first.x)
    const h = Math.abs(last.y - first.y)
    if (w < 8 && h < 8) return null
    return {
      id: createId(),
      type: autoType,
      x1: first.x,
      y1: first.y,
      x2: last.x,
      y2: last.y,
      color,
      width,
      pageId,
    }
  }

  return {
    id: createId(),
    type: autoType === 'arrow' ? 'arrow' : 'line',
    x1: first.x,
    y1: first.y,
    x2: last.x,
    y2: last.y,
    color,
    width,
    pageId,
  }
}

function guessShapeType(points: Point[]): ShapeType {
  const first = points[0]
  const last = points[points.length - 1]
  const w = Math.abs(last.x - first.x)
  const h = Math.abs(last.y - first.y)
  if (w < 20 && h < 20) return 'line'
  const ratio = w / (h || 1)
  if (ratio > 0.75 && ratio < 1.33) return 'ellipse'
  if (w > h * 2 || h > w * 2) return 'rectangle'
  return 'rectangle'
}

export function snapLineToAxis(points: Point[]): Point[] {
  if (points.length < 2) return points
  const first = points[0]
  const last = points[points.length - 1]
  const dx = Math.abs(last.x - first.x)
  const dy = Math.abs(last.y - first.y)
  if (dx > dy * 2) {
    return [...points.slice(0, -1), { ...last, y: first.y }]
  }
  if (dy > dx * 2) {
    return [...points.slice(0, -1), { ...last, x: first.x }]
  }
  return points
}
