import type { Point, Stroke } from '../types'

export function getStrokeBounds(stroke: Stroke): {
  minX: number
  minY: number
  maxX: number
  maxY: number
} {
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
  if (!stroke.points.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 }
  const pad = stroke.width * 2
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad }
}

export function strokeIntersectsRect(
  stroke: Stroke,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const b = getStrokeBounds(stroke)
  return b.maxX >= x && b.minX <= x + w && b.maxY >= y && b.minY <= y + h
}

export function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke): void {
  if (stroke.points.length < 2) return
  ctx.save()

  if (stroke.tool === 'highlighter') {
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = stroke.opacity
    ctx.strokeStyle = stroke.color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = stroke.width
    drawSmoothPath(ctx, stroke.points)
    ctx.stroke()
  } else if (stroke.tool === 'pencil') {
    ctx.globalAlpha = 0.85
    for (let i = 1; i < stroke.points.length; i++) {
      const a = stroke.points[i - 1]
      const b = stroke.points[i]
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width * (0.4 + a.pressure * 0.8)
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
  } else {
    ctx.globalAlpha = stroke.opacity
    ctx.strokeStyle = stroke.color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = stroke.width
    drawSmoothPath(ctx, stroke.points)
    ctx.stroke()
  }
  ctx.restore()
}

function drawSmoothPath(ctx: CanvasRenderingContext2D, pts: Point[]): void {
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2
    const midY = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY)
  }
  const last = pts[pts.length - 1]
  if (pts.length > 1) {
    const prev = pts[pts.length - 2]
    ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y)
  }
}

export function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]): void {
  let i = 0
  while (i < strokes.length) {
    const s = strokes[i]
    if (s.tool === 'pen' && s.points.length >= 2) {
      let j = i + 1
      while (
        j < strokes.length &&
        strokes[j].tool === 'pen' &&
        strokes[j].color === s.color &&
        strokes[j].width === s.width &&
        strokes[j].opacity === s.opacity &&
        strokes[j].points.length >= 2
      ) {
        j++
      }
      if (j - i >= 4) {
        ctx.save()
        ctx.globalAlpha = s.opacity
        ctx.strokeStyle = s.color
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = s.width
        for (let k = i; k < j; k++) {
          drawSmoothPath(ctx, strokes[k].points)
          ctx.stroke()
        }
        ctx.restore()
        i = j
        continue
      }
    }
    drawStroke(ctx, s)
    i++
  }
}

export function pointNearStroke(
  stroke: Stroke,
  x: number,
  y: number,
  threshold: number,
): boolean {
  for (const p of stroke.points) {
    if (Math.hypot(p.x - x, p.y - y) <= threshold + stroke.width / 2) return true
  }
  return false
}

export function createPoint(
  x: number,
  y: number,
  pressure = 0.5,
  tiltX = 0,
  tiltY = 0,
): Point {
  return { x, y, pressure, timestamp: Date.now(), tiltX, tiltY }
}
