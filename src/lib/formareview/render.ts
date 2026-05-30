import type { FormaReviewMarkup, FormaReviewPin } from '../../types'
import { DEFAULT_MARKUP } from './constants'

export function drawMarkup(ctx: CanvasRenderingContext2D, markup: FormaReviewMarkup, scale = 1): void {
  const { type, data } = markup
  ctx.save()
  switch (type) {
    case 'highlight': {
      const x = Number(data.x)
      const y = Number(data.y)
      const w = Number(data.w)
      const h = Number(data.h)
      ctx.fillStyle = String(data.color || DEFAULT_MARKUP.highlight.color)
      ctx.fillRect(x * scale, y * scale, w * scale, h * scale)
      break
    }
    case 'text': {
      const x = Number(data.x)
      const y = Number(data.y)
      const fontSize = Number(data.fontSize || DEFAULT_MARKUP.text.fontSize)
      ctx.font = `${fontSize * scale}px sans-serif`
      ctx.fillStyle = String(data.color || DEFAULT_MARKUP.text.color)
      ctx.textBaseline = 'top'
      String(data.text || '')
        .split('\n')
        .forEach((line, i) => {
          ctx.fillText(line, x * scale, (y + i * fontSize * 1.3) * scale)
        })
      break
    }
    case 'arrow': {
      const x1 = Number(data.x1)
      const y1 = Number(data.y1)
      const x2 = Number(data.x2)
      const y2 = Number(data.y2)
      const lw = Number(data.width || DEFAULT_MARKUP.arrow.width) * scale
      ctx.strokeStyle = String(data.color || DEFAULT_MARKUP.arrow.color)
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
        y2 * scale - headLen * Math.sin(angle - Math.PI / 6),
      )
      ctx.moveTo(x2 * scale, y2 * scale)
      ctx.lineTo(
        x2 * scale - headLen * Math.cos(angle + Math.PI / 6),
        y2 * scale - headLen * Math.sin(angle + Math.PI / 6),
      )
      ctx.stroke()
      break
    }
    case 'draw': {
      const points = data.points as { x: number; y: number }[] | undefined
      if (!points?.length) break
      ctx.strokeStyle = String(data.color || DEFAULT_MARKUP.draw.color)
      ctx.lineWidth = Number(data.width || DEFAULT_MARKUP.draw.width) * scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(points[0]!.x * scale, points[0]!.y * scale)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i]!.x * scale, points[i]!.y * scale)
      }
      ctx.stroke()
      break
    }
    case 'rect': {
      const x = Number(data.x)
      const y = Number(data.y)
      const w = Number(data.w)
      const h = Number(data.h)
      ctx.strokeStyle = String(data.color || DEFAULT_MARKUP.arrow.color)
      ctx.lineWidth = Number(data.width || DEFAULT_MARKUP.arrow.width) * scale
      ctx.strokeRect(x * scale, y * scale, w * scale, h * scale)
      break
    }
    case 'circle': {
      const x = Number(data.x)
      const y = Number(data.y)
      const w = Number(data.w)
      const h = Number(data.h)
      ctx.strokeStyle = String(data.color || DEFAULT_MARKUP.arrow.color)
      ctx.lineWidth = Number(data.width || DEFAULT_MARKUP.arrow.width) * scale
      ctx.beginPath()
      ctx.ellipse(
        (x + w / 2) * scale,
        (y + h / 2) * scale,
        Math.abs(w / 2) * scale,
        Math.abs(h / 2) * scale,
        0,
        0,
        Math.PI * 2,
      )
      ctx.stroke()
      break
    }
    default:
      break
  }
  ctx.restore()
}

export function drawPinMarker(
  ctx: CanvasRenderingContext2D,
  pin: FormaReviewPin,
  index: number,
  scale = 1,
  selected = false,
): void {
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
