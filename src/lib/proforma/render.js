/** PROFORMA — rendu traits et formes sur canvas */

import { drawShapeStroke } from '@/lib/shapeStroke'

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function smoothPoints(pts, amount = 0.35) {
  if (!pts?.length || amount <= 0) return pts
  const out = [pts[0]]
  for (let i = 1; i < pts.length; i += 1) {
    const prev = out[out.length - 1]
    const cur = pts[i]
    out.push({
      x: prev.x + (cur.x - prev.x) * (1 - amount),
      y: prev.y + (cur.y - prev.y) * (1 - amount),
      p: cur.p,
    })
  }
  return out
}

function stampBrush(ctx, x, y, size, color, opacity, hardness) {
  const r = size / 2
  if (hardness >= 0.95) {
    ctx.globalAlpha = opacity
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  const inner = color
  g.addColorStop(0, inner)
  g.addColorStop(hardness, inner)
  g.addColorStop(1, 'transparent')
  ctx.globalAlpha = opacity
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

export function drawFreeStroke(ctx, stroke) {
  const pts = stroke.pts || []
  if (pts.length < 1) return

  const {
    color = '#000',
    size = 2,
    opacity = 1,
    hardness = 0.8,
    tool = 'pen',
  } = stroke

  const isHighlight = tool === 'highlighter'
  ctx.save()
  ctx.globalCompositeOperation = isHighlight ? 'multiply' : 'source-over'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (pts.length === 1) {
    stampBrush(ctx, pts[0].x, pts[0].y, size, color, opacity, hardness)
    ctx.restore()
    return
  }

  const smoothed = smoothPoints(pts, stroke.smoothing ?? 0.3)
  const spacing = Math.max(0.5, (stroke.spacing ?? 0.15) * size)

  if (hardness < 0.9 || tool.includes('brush') || tool === 'airbrush') {
    let last = smoothed[0]
    stampBrush(ctx, last.x, last.y, size, color, opacity * (stroke.flow ?? 1), hardness)
    for (let i = 1; i < smoothed.length; i += 1) {
      const p = smoothed[i]
      const d = dist(last, p)
      const steps = Math.max(1, Math.ceil(d / spacing))
      for (let s = 1; s <= steps; s += 1) {
        const t = s / steps
        const x = last.x + (p.x - last.x) * t
        const y = last.y + (p.y - last.y) * t
        const pr = stroke.pressure !== false && p.p != null ? 0.35 + p.p * 0.65 : 1
        stampBrush(ctx, x, y, size * pr, color, opacity * (stroke.flow ?? 1), hardness)
      }
      last = p
    }
    ctx.restore()
    return
  }

  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.strokeStyle = 'rgba(0,0,0,1)'
  } else {
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = color
  }
  ctx.globalAlpha = 1
  ctx.lineWidth = size
  ctx.beginPath()
  ctx.moveTo(smoothed[0].x, smoothed[0].y)
  for (let i = 1; i < smoothed.length; i += 1) {
    ctx.lineTo(smoothed[i].x, smoothed[i].y)
  }
  ctx.stroke()
  ctx.globalCompositeOperation = 'source-over'
  ctx.restore()
}

export function drawStroke(ctx, stroke) {
  if (!stroke?.pts?.length && !stroke?.shapeType) return
  const st = stroke.shapeType || stroke.tool
  if (['line', 'rect', 'circle', 'arrow', 'arc', 'polyline', 'polygon', 'dimension'].includes(st)) {
    drawShapeStroke(ctx, { ...stroke, shapeType: st, tool: st })
    return
  }
  if (st === 'text' && stroke.text) {
    const fs = Math.max((stroke.size || 4) * 3, 14)
    ctx.save()
    ctx.globalAlpha = stroke.opacity ?? 1
    ctx.fillStyle = stroke.color || '#000'
    ctx.font = `${stroke.bold ? '700' : '400'} ${stroke.italic ? 'italic' : 'normal'} ${fs}px ${stroke.font || 'Inter, sans-serif'}`
    ctx.fillText(stroke.text, stroke.pts[0].x, stroke.pts[0].y)
    ctx.restore()
    return
  }
  drawFreeStroke(ctx, stroke)
}

export function renderLayer(ctx, strokes, layer, layerIndex) {
  if (!layer?.v) return
  ctx.save()
  ctx.globalAlpha = layer.opacity ?? 1
  strokes
    .filter((s) => s.layerId === layer.id)
    .forEach((s) => drawStroke(ctx, s))
  ctx.restore()
}

export function renderDocument(ctx, doc) {
  const { width: w, height: h, bgColor, transparent, layers, strokes } = doc
  ctx.clearRect(0, 0, w, h)
  if (!transparent) {
    ctx.fillStyle = bgColor || '#fff'
    ctx.fillRect(0, 0, w, h)
  }
  ;(layers || []).forEach((layer, i) => renderLayer(ctx, strokes || [], layer, i))
}

export function drawGrid(ctx, doc) {
  if (!doc.showGrid) return
  const { width: w, height: h, grid } = doc
  const step = grid === 'grid10' ? 37.8 : grid === 'grid5' ? 18.9 : grid === 'arch' ? 50 : 15
  ctx.save()
  ctx.strokeStyle = grid === 'arch' ? '#3d6b8c33' : '#00000014'
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += step) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += step) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  if (grid === 'arch') {
    ctx.strokeStyle = '#3d6b8c55'
    ctx.lineWidth = 1.5
    for (let x = 0; x <= w; x += step * 5) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += step * 5) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
  }
  ctx.restore()
}

export function compositeToCanvas(canvas, doc) {
  const ctx = canvas.getContext('2d')
  canvas.width = doc.width
  canvas.height = doc.height
  renderDocument(ctx, doc)
}

export function docToDataUrl(doc, type = 'image/png') {
  const c = document.createElement('canvas')
  compositeToCanvas(c, doc)
  return c.toDataURL(type)
}
