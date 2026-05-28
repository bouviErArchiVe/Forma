import { canvasFontCss } from '@/lib/fontUtils'

export const SHAPE_TYPES = new Set(['line', 'rect', 'circle', 'arrow', 'cloud', 'dimline', 'text'])

export function getShapeCenter(s) {
  if (!s?.pts?.length) return { x: 0, y: 0 }
  if (s.shapeType === 'text') {
    const fs = Math.max((s.size || 4) * 3, 14)
    const w = Math.max(((s.text || '').length || 1) * fs * 0.55, fs)
    return { x: s.pts[0].x + w / 2, y: s.pts[0].y - fs / 2 }
  }
  const xs = s.pts.map((p) => p.x)
  const ys = s.pts.map((p) => p.y)
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  }
}

export function normalizeBoxPts(pts) {
  if (!pts?.length) return pts
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return [{ x: Math.min(...xs), y: Math.min(...ys) }, { x: Math.max(...xs), y: Math.max(...ys) }]
}

export function getShapeBounds(s) {
  if (!s?.pts?.length) return null
  const st = s.shapeType || s.tool
  if (st === 'text') {
    const fs = Math.max((s.size || 4) * 3, 14)
    const w = Math.max(((s.text || '').length || 1) * fs * 0.55, fs)
    const x = s.pts[0].x
    const y = s.pts[0].y - fs
    return { x1: x, y1: y, x2: x + w, y2: s.pts[0].y + fs * 0.2, w, h: fs * 1.2, cx: x + w / 2, cy: y + fs * 0.6 }
  }
  const box = normalizeBoxPts(s.pts)
  let x1 = box[0].x
  let y1 = box[0].y
  let x2 = box[1].x
  let y2 = box[1].y
  if (st === 'line' || st === 'arrow' || st === 'dimline') {
    const pad = Math.max(s.size || 4, 10)
    if (Math.abs(x2 - x1) < pad) {
      const cx = (x1 + x2) / 2
      x1 = cx - pad / 2
      x2 = cx + pad / 2
    }
    if (Math.abs(y2 - y1) < pad) {
      const cy = (y1 + y2) / 2
      y1 = cy - pad / 2
      y2 = cy + pad / 2
    }
  }
  const rot = s.rotation || 0
  if (!rot) {
    return { x1, y1, x2, y2, w: x2 - x1, h: y2 - y1, cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 }
  }
  const c = { x: (x1 + x2) / 2, y: (y1 + y2) / 2 }
  const corners = [
    { x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 },
  ].map((p) => rotatePoint(p, c.x, c.y, rot))
  const xs = corners.map((p) => p.x)
  const ys = corners.map((p) => p.y)
  const bx1 = Math.min(...xs)
  const by1 = Math.min(...ys)
  const bx2 = Math.max(...xs)
  const by2 = Math.max(...ys)
  return { x1: bx1, y1: by1, x2: bx2, y2: by2, w: bx2 - bx1, h: by2 - by1, cx: c.x, cy: c.y }
}

export function rotatePoint(p, cx, cy, deg) {
  const rad = (deg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = p.x - cx
  const dy = p.y - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

function withRotation(ctx, s, fn) {
  const rot = s.rotation || 0
  if (!rot) {
    fn()
    return
  }
  const c = getShapeCenter(s)
  ctx.save()
  ctx.translate(c.x, c.y)
  ctx.rotate((rot * Math.PI) / 180)
  ctx.translate(-c.x, -c.y)
  fn()
  ctx.restore()
}

function fillColor(s) {
  if (s.fill === false || s.fill === 'none') return null
  return s.fill || s.color
}

function drawCloudPath(ctx, x, y, w, h, style = 'round') {
  const r = style === 'sharp' ? 4 : style === 'speech' ? 14 : 12
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
  }
  if (style === 'speech' && w > 20 && h > 20) {
    ctx.moveTo(x + w * 0.28, y + h)
    ctx.lineTo(x + w * 0.18, y + h + Math.min(18, h * 0.35))
    ctx.lineTo(x + w * 0.42, y + h)
  }
}

/** Dessine un stroke forme / bulle / texte sur le canvas 2D */
export function drawShapeStroke(ctx, s, layerOp, unitSys, formatDimension) {
  if (!s?.pts?.length) return
  const baseOp = (s.opacity ?? 1) * layerOp
  const st = s.shapeType || s.tool
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.globalCompositeOperation = 'source-over'

  if (st === 'line' || st === 'dimline') {
    withRotation(ctx, s, () => {
      ctx.beginPath()
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      ctx.globalAlpha = baseOp
      ctx.moveTo(s.pts[0].x, s.pts[0].y)
      ctx.lineTo(s.pts[1].x, s.pts[1].y)
      ctx.stroke()
      if (st === 'dimline') {
        const ang = Math.atan2(s.pts[1].y - s.pts[0].y, s.pts[1].x - s.pts[0].x)
        const perp = ang + Math.PI / 2
        const tick = 8
        ;[s.pts[0], s.pts[1]].forEach((pt) => {
          ctx.beginPath()
          ctx.moveTo(pt.x - (tick * Math.cos(perp)) / 2, pt.y - (tick * Math.sin(perp)) / 2)
          ctx.lineTo(pt.x + (tick * Math.cos(perp)) / 2, pt.y + (tick * Math.sin(perp)) / 2)
          ctx.stroke()
        })
        const distMm = Math.hypot(s.pts[1].x - s.pts[0].x, s.pts[1].y - s.pts[0].y) / 3.78
        const mx = (s.pts[0].x + s.pts[1].x) / 2
        const my = (s.pts[0].y + s.pts[1].y) / 2
        ctx.font = `${Math.max(s.size * 3, 10)}px monospace`
        ctx.fillStyle = s.color
        ctx.globalAlpha = 1
        ctx.fillText(formatDimension(distMm, unitSys), mx + 4, my - 4)
      }
    })
    ctx.globalAlpha = 1
    return
  }

  if (st === 'rect') {
    const box = normalizeBoxPts(s.pts)
    const x = box[0].x
    const y = box[0].y
    const w = box[1].x - box[0].x
    const h = box[1].y - box[0].y
    withRotation(ctx, s, () => {
      const fc = fillColor(s)
      if (fc && w && h) {
        ctx.fillStyle = fc
        ctx.globalAlpha = (s.fillOpacity ?? 0.25) * layerOp
        ctx.fillRect(x, y, w, h)
      }
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      ctx.globalAlpha = baseOp
      ctx.strokeRect(x, y, w, h)
    })
    ctx.globalAlpha = 1
    return
  }

  if (st === 'circle') {
    const box = normalizeBoxPts(s.pts)
    const rx = Math.abs(box[1].x - box[0].x) / 2
    const ry = Math.abs(box[1].y - box[0].y) / 2
    const cx = (box[0].x + box[1].x) / 2
    const cy = (box[0].y + box[1].y) / 2
    if (rx <= 0 || ry <= 0) return
    withRotation(ctx, s, () => {
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      const fc = fillColor(s)
      if (fc) {
        ctx.fillStyle = fc
        ctx.globalAlpha = (s.fillOpacity ?? 0.25) * layerOp
        ctx.fill()
      }
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      ctx.globalAlpha = baseOp
      ctx.stroke()
    })
    ctx.globalAlpha = 1
    return
  }

  if (st === 'arrow') {
    withRotation(ctx, s, () => {
      const [a, b] = [s.pts[0], s.pts[1]]
      const ang = Math.atan2(b.y - a.y, b.x - a.x)
      const hs = Math.min(20, s.size * 5 + 10)
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      ctx.globalAlpha = baseOp
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(b.x, b.y)
      ctx.lineTo(b.x - hs * Math.cos(ang - Math.PI / 6), b.y - hs * Math.sin(ang - Math.PI / 6))
      ctx.lineTo(b.x - hs * Math.cos(ang + Math.PI / 6), b.y - hs * Math.sin(ang + Math.PI / 6))
      ctx.closePath()
      ctx.fillStyle = s.color
      ctx.fill()
    })
    ctx.globalAlpha = 1
    return
  }

  if (st === 'text') {
    const fs = Math.max((s.size || 4) * 3, 14)
    ctx.font = `${fs}px ${canvasFontCss(s.fontFamily)}`
    ctx.fillStyle = s.color
    ctx.globalAlpha = baseOp
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(s.text || '', s.pts[0].x, s.pts[0].y)
    ctx.globalAlpha = 1
    return
  }

  if (st === 'cloud') {
    const box = normalizeBoxPts(s.pts)
    const x = box[0].x
    const y = box[0].y
    const w = box[1].x - box[0].x
    const h = box[1].y - box[0].y
    const style = s.bubbleStyle || 'round'
    withRotation(ctx, s, () => {
      drawCloudPath(ctx, x, y, w, h, style)
      const fc = fillColor(s)
      if (fc) {
        ctx.fillStyle = fc
        ctx.globalAlpha = (s.fillOpacity ?? 0.25) * layerOp
        ctx.fill()
      }
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      ctx.globalAlpha = baseOp
      ctx.stroke()
    })
    ctx.globalAlpha = 1
    return
  }

  ctx.beginPath()
  ctx.strokeStyle = s.color
  ctx.lineWidth = s.size
  ctx.globalAlpha = s.tool === 'highlight' ? Math.min(baseOp, 0.4) : baseOp
  ctx.moveTo(s.pts[0].x, s.pts[0].y)
  s.pts.forEach((p) => ctx.lineTo(p.x, p.y))
  ctx.stroke()
  ctx.globalAlpha = 1
}

export function shapeStylePayload(shapeStyle, color) {
  const useFill = shapeStyle?.useFill !== false
  return {
    fill: useFill ? (shapeStyle?.fill || color) : false,
    fillOpacity: shapeStyle?.fillOpacity ?? 0.22,
    opacity: shapeStyle?.opacity ?? 1,
    rotation: shapeStyle?.rotation || 0,
    bubbleStyle: shapeStyle?.bubbleStyle || 'round',
  }
}

export function isTransformableShape(s) {
  const st = s?.shapeType || s?.tool
  return ['line', 'arrow', 'dimline', 'rect', 'circle', 'cloud', 'text'].includes(st)
}

export function resizeShapeBox(s, x1, y1, x2, y2) {
  const st = s?.shapeType || s?.tool
  if (st === 'text') {
    const fs = Math.max((s.size || 4) * 3, 14)
    const h = Math.max(y2 - y1, fs)
    const scale = h / fs
    return { ...s, size: Math.max(0.15, (s.size || 0.5) * scale), pts: [{ x: x1, y: y2 }] }
  }
  if (st === 'line' || st === 'arrow' || st === 'dimline') {
    return { ...s, pts: [{ x: x1, y: y1 }, { x: x2, y: y2 }] }
  }
  return { ...s, pts: [{ x: x1, y: y1 }, { x: x2, y: y2 }] }
}
