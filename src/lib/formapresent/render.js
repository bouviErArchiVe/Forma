/** FormaPresent — rendu slide → canvas / dataUrl */

import { SLIDE_SIZE } from './constants'

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawText(ctx, el) {
  const lines = String(el.content || '').split('\n')
  const fontSize = el.fontSize || 32
  const fontWeight = el.bold ? 'bold' : 'normal'
  ctx.font = `${fontWeight} ${fontSize}px ${el.fontFamily || 'Inter, sans-serif'}`
  ctx.fillStyle = el.color || '#1a1a1a'
  ctx.textAlign = el.align === 'center' ? 'center' : el.align === 'right' ? 'right' : 'left'
  ctx.textBaseline = 'top'
  const lineH = fontSize * 1.35
  lines.forEach((line, i) => {
    let tx = el.x
    if (el.align === 'center') tx = el.x + el.w / 2
    else if (el.align === 'right') tx = el.x + el.w
    ctx.fillText(line, tx, el.y + i * lineH)
  })
}

async function drawElement(ctx, el) {
  ctx.save()
  ctx.globalAlpha = el.opacity ?? 1
  const cx = el.x + el.w / 2
  const cy = el.y + el.h / 2
  if (el.rotation) {
    ctx.translate(cx, cy)
    ctx.rotate((el.rotation * Math.PI) / 180)
    ctx.translate(-cx, -cy)
  }

  if (el.type === 'text') {
    drawText(ctx, el)
  } else if (el.type === 'image' || el.type === 'embed') {
    const src = el.dataUrl || el.src
    if (src) {
      try {
        const img = await loadImage(src)
        ctx.drawImage(img, el.x, el.y, el.w, el.h)
      } catch {
        ctx.fillStyle = '#eee'
        ctx.fillRect(el.x, el.y, el.w, el.h)
        ctx.strokeStyle = '#ccc'
        ctx.strokeRect(el.x, el.y, el.w, el.h)
      }
    } else {
      ctx.fillStyle = '#eee'
      ctx.fillRect(el.x, el.y, el.w, el.h)
      ctx.strokeStyle = '#ccc'
      ctx.strokeRect(el.x, el.y, el.w, el.h)
    }
  } else if (el.type === 'video') {
    ctx.fillStyle = '#111'
    ctx.fillRect(el.x, el.y, el.w, el.h)
    ctx.fillStyle = '#fff'
    ctx.font = '48px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('▶', el.x + el.w / 2, el.y + el.h / 2 - 24)
  }
  ctx.restore()
}

export async function renderSlideToCanvas(slide, scale = 1) {
  const { width, height } = SLIDE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const ctx = canvas.getContext('2d')
  ctx.scale(scale, scale)

  ctx.fillStyle = slide.bgColor || '#ffffff'
  ctx.fillRect(0, 0, width, height)

  if (slide.bgImage) {
    try {
      const bg = await loadImage(slide.bgImage)
      ctx.drawImage(bg, 0, 0, width, height)
    } catch { /* ignore */ }
  }

  const sorted = [...(slide.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
  for (const el of sorted) {
    await drawElement(ctx, el)
  }
  return canvas
}

export async function slideToDataUrl(slide, { format = 'png', quality = 0.92, scale = 1 } = {}) {
  const canvas = await renderSlideToCanvas(slide, scale)
  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  return canvas.toDataURL(mime, quality)
}

export function pxToMm(px) {
  return (px * 25.4) / 96
}

export function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function safeFilename(name, ext) {
  const base = String(name || 'presentation').replace(/[^\w\- ]+/g, '_').trim() || 'presentation'
  return `${base}.${ext}`
}
