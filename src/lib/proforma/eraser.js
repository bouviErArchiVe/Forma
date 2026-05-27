/** PROFORMA — gommes précision / auto / zone */

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function pointNearStroke(pt, stroke, radius) {
  const pts = stroke.pts || []
  for (let i = 0; i < pts.length; i += 1) {
    if (dist(pt, pts[i]) <= radius) return true
    if (i > 0 && distToSegment(pt, pts[i - 1], pts[i]) <= radius) return true
  }
  return false
}

function distToSegment(p, a, b) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len2 = dx * dx + dy * dy
  if (len2 < 1e-6) return dist(p, a)
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy })
}

function trimStrokeAtPoint(stroke, pt, radius) {
  const pts = stroke.pts || []
  if (pts.length < 2) return []
  const segments = []
  let current = []

  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i]
    const hit = dist(p, pt) <= radius || (i > 0 && distToSegment(pt, pts[i - 1], p) <= radius)
    if (hit) {
      if (current.length >= 2) segments.push(current)
      current = []
    } else {
      current.push(p)
    }
  }
  if (current.length >= 2) segments.push(current)
  if (!segments.length) return []
  return segments.map((seg, idx) => ({
    ...stroke,
    id: `${stroke.id}_e${idx}_${Date.now()}`,
    pts: seg,
  }))
}

export function eraseAtPoint(strokes, pt, { mode = 'precision', radius = 12, layerId = null } = {}) {
  const r = Math.max(2, radius)
  const next = []
  const removed = []

  strokes.forEach((stroke) => {
    if (layerId && stroke.layerId !== layerId) {
      next.push(stroke)
      return
    }
    const layerLocked = false
    if (layerLocked) {
      next.push(stroke)
      return
    }

    if (mode === 'auto') {
      if (pointNearStroke(pt, stroke, r)) removed.push(stroke.id)
      else next.push(stroke)
      return
    }

    if (mode === 'precision') {
      if (!pointNearStroke(pt, stroke, r)) {
        next.push(stroke)
        return
      }
      const parts = trimStrokeAtPoint(stroke, pt, r)
      if (parts.length) next.push(...parts)
      else removed.push(stroke.id)
      return
    }

    next.push(stroke)
  })

  return { strokes: next, removed }
}

export function eraseInRect(strokes, rect, { layerId = null } = {}) {
  const { x1, y1, x2, y2 } = rect
  const minX = Math.min(x1, x2)
  const maxX = Math.max(x1, x2)
  const minY = Math.min(y1, y2)
  const maxY = Math.max(y1, y2)

  const next = strokes.filter((stroke) => {
    if (layerId && stroke.layerId !== layerId) return true
    const pts = stroke.pts || []
    return !pts.some((p) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY)
  })

  return { strokes: next, removed: strokes.length - next.length }
}
