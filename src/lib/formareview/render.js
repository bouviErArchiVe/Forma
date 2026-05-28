/** FormaReview — rendu canvas des annotations */

import { DEFAULT_MARKUP } from './constants'

export function drawMarkup(ctx, markup, scale = 1) {
  const { type, data } = markup
  ctx.save()
  switch (type) {
    case 'highlight': {
      const { x, y, w, h, color } = data
      ctx.fillStyle = color || DEFAULT_MARKUP.highlight.color
      ctx.fillRect(x * scale, y * scale, w * scale, h * scale)
      break
    }
    case 'text': {
      const { x, y, text, color, fontSize } = data
      ctx.font = `${(fontSize || DEFAULT_MARKUP.text.fontSize) * scale}px sans-serif`
      ctx.fillStyle = color || DEFAULT_MARKUP.text.color
      ctx.textBaseline = 'top'
      const lines = String(text || '').split('\n')
      lines.forEach((line, i) => {
        ctx.fillText(line, x * scale, (y + i * (fontSize || 16) * 1.3) * scale)
      })
      break
    }
    case 'arrow': {
      const { x1, y1, x2, y2, color, width } = data
      const lw = (width || DEFAULT_MARKUP.arrow.width) * scale
      ctx.strokeStyle = color || DEFAULT_MARKUP.arrow.color
      ctx.lineWidth = lw
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(x1 * scale, y1 * scale)
      ctx.lineTo(x2 * scale, y2 * scale)
      ctx.stroke()
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const headLen = 12 * scale
      ctx.beginPath()
      ctx.moveTo(x2 * scale, y2 * scale)
      ctx.lineTo(
        x2 * scale - headLen * Math.cos(angle - Math.PI / 6),
        y2 * scale - headLen * Math.sin(angle - Math.PI / 6)
      )
      ctx.moveTo(x2 * scale, y2 * scale)
      ctx.lineTo(
        x2 * scale - headLen * Math.cos(angle + Math.PI / 6),
        y2 * scale - headLen * Math.sin(angle + Math.PI / 6)
      )
      ctx.stroke()
      break
    }
    case 'draw': {
      const { points, color, width } = data
      if (!points?.length) break
      ctx.strokeStyle = color || DEFAULT_MARKUP.draw.color
      ctx.lineWidth = (width || DEFAULT_MARKUP.draw.width) * scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(points[0].x * scale, points[0].y * scale)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * scale, points[i].y * scale)
      }
      ctx.stroke()
      break
    }
    case 'rect': {
      const { x, y, w, h, color, width } = data
      ctx.strokeStyle = color || DEFAULT_MARKUP.arrow.color
      ctx.lineWidth = (width || DEFAULT_MARKUP.arrow.width) * scale
      ctx.strokeRect(x * scale, y * scale, w * scale, h * scale)
      break
    }
    case 'circle': {
      const { x, y, w, h, color, width } = data
      ctx.strokeStyle = color || DEFAULT_MARKUP.arrow.color
      ctx.lineWidth = (width || DEFAULT_MARKUP.arrow.width) * scale
      ctx.beginPath()
      ctx.ellipse((x + w / 2) * scale, (y + h / 2) * scale, Math.abs(w / 2) * scale, Math.abs(h / 2) * scale, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    }
    default:
      break
  }
  ctx.restore()
}

export function drawPinMarker(ctx, pin, index, scale = 1, selected = false) {
  const r = 14 * scale
  const x = pin.x * scale
  const y = pin.y * scale
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = selected ? '#ffd4a8' : '#e85d5d'
  ctx.fill()
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2 * scale
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${11 * scale}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(index + 1), x, y)
  ctx.restore()
}

export function renderPageToCanvas(canvas, page, markups, pins, { scale = 1, selectedPinId } = {}) {
  if (!canvas || !page) return
  const ctx = canvas.getContext('2d')
  const w = page.width * scale
  const h = page.height * scale
  canvas.width = w
  canvas.height = h
  ctx.clearRect(0, 0, w, h)
  if (page.dataUrl) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h)
        for (const m of markups || []) drawMarkup(ctx, m, scale)
        ;(pins || []).forEach((pin, i) => {
          drawPinMarker(ctx, pin, i, scale, pin.id === selectedPinId)
        })
        resolve()
      }
      img.onerror = () => {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
        resolve()
      }
      img.src = page.dataUrl
    })
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  for (const m of markups || []) drawMarkup(ctx, m, scale)
  ;(pins || []).forEach((pin, i) => {
    drawPinMarker(ctx, pin, i, scale, pin.id === selectedPinId)
  })
  return Promise.resolve()
}
