import { PAGE_HEIGHT, PAGE_WIDTH } from './page-render'

/** Règle en mm (format A4 ~ 210×297 mm). */
const MM_W = 210
const MM_H = 297

export function drawRulerOverlay(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const sx = w / MM_W
  const sy = h / MM_H
  ctx.save()
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)'
  ctx.fillStyle = 'rgba(100, 116, 139, 0.7)'
  ctx.lineWidth = 1
  ctx.font = '9px system-ui, sans-serif'

  for (let mm = 0; mm <= MM_W; mm += 10) {
    const x = mm * sx
    const major = mm % 50 === 0
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, major ? 14 : 8)
    ctx.stroke()
    if (major && mm > 0) ctx.fillText(String(mm), x + 2, 12)
  }

  for (let mm = 0; mm <= MM_H; mm += 10) {
    const y = mm * sy
    const major = mm % 50 === 0
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(major ? 14 : 8, y)
    ctx.stroke()
    if (major && mm > 0) {
      ctx.save()
      ctx.translate(12, y - 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(String(mm), 0, 0)
      ctx.restore()
    }
  }

  ctx.restore()
}

export function pageDimensionsMm(): { widthMm: number; heightMm: number } {
  void PAGE_WIDTH
  void PAGE_HEIGHT
  return { widthMm: MM_W, heightMm: MM_H }
}
