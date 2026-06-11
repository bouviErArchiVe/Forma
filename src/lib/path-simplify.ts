/** Distance point → segment (Ramer–Douglas–Peucker). */
export interface Point2D {
  x: number
  y: number
}

function perpendicularDistance(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y)
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq))
  const px = a.x + t * dx
  const py = a.y + t * dy
  return Math.hypot(p.x - px, p.y - py)
}

/** Ramer–Douglas–Peucker — réduit les points sans changer visiblement le tracé. */
export function simplifyPolyline(points: Point2D[], tolerance: number): Point2D[] {
  if (points.length <= 2 || tolerance <= 0) return points

  let maxDist = 0
  let index = 0
  const end = points.length - 1
  for (let i = 1; i < end; i++) {
    const d = perpendicularDistance(points[i], points[0], points[end])
    if (d > maxDist) {
      maxDist = d
      index = i
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyPolyline(points.slice(0, index + 1), tolerance)
    const right = simplifyPolyline(points.slice(index), tolerance)
    return [...left.slice(0, -1), ...right]
  }
  return [points[0], points[end]]
}

const SVG_MIN_POINTS = 8

/** Tolérance export SVG — traits longs uniquement. */
export function simplifyStrokePointsForSvg(
  points: Point2D[],
  tool: 'pen' | 'pencil' | 'highlighter',
): Point2D[] {
  if (points.length < SVG_MIN_POINTS) return points
  const tolerance =
    tool === 'highlighter' ? 1.25
    : tool === 'pencil' ? 0.65
    : 0.5
  const simplified = simplifyPolyline(points, tolerance)
  return simplified.length >= 2 ? simplified : points.slice(0, 2)
}
