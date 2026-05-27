/** FormaCombine — rendu page → dataUrl */

import { A4_PX } from './constants'

export async function pageToDataUrl(page, { format = 'png', quality = 0.92, pageNumber = null } = {}) {
  const w = page.width || A4_PX.width
  const h = page.height || A4_PX.height
  const rot = page.rotation || 0
  const swap = rot === 90 || rot === 270
  const cw = swap ? h : w
  const ch = swap ? w : h

  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')

  ctx.save()
  if (rot) {
    ctx.translate(cw / 2, ch / 2)
    ctx.rotate((rot * Math.PI) / 180)
    ctx.translate(-w / 2, -h / 2)
  }

  ctx.fillStyle = page.bgColor || '#ffffff'
  ctx.fillRect(0, 0, w, h)

  switch (page.type) {
    case 'raster':
      if (page.dataUrl) {
        await new Promise((resolve) => {
          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0, w, h)
            resolve()
          }
          img.onerror = resolve
          img.src = page.dataUrl
        })
      }
      break
    case 'blank':
      break
    case 'separator': {
      ctx.fillStyle = page.bgColor || '#f0f2f5'
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = '#c5cad3'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(40, h / 2)
      ctx.lineTo(w - 40, h / 2)
      ctx.stroke()
      ctx.fillStyle = '#666'
      ctx.font = '16px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(page.text || page.name || '—', w / 2, h / 2 - 12)
      break
    }
    case 'title': {
      ctx.fillStyle = '#111'
      ctx.font = 'bold 36px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      wrapText(ctx, page.text || page.name || 'Titre', w / 2, h / 2, w - 80, 44)
      break
    }
    case 'text': {
      ctx.fillStyle = '#222'
      ctx.font = '14px Inter, system-ui, sans-serif'
      ctx.textAlign = 'left'
      wrapText(ctx, page.text || '', 48, 64, w - 96, 22)
      break
    }
    default:
      break
  }

  ctx.restore()

  if (pageNumber != null) {
    ctx.fillStyle = '#666'
    ctx.font = '12px Inter, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(pageNumber), cw - 16, ch - 12)
  }

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  return canvas.toDataURL(mime, quality)
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || '').split(/\s+/)
  let line = ''
  let cy = y
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy)
      line = word
      cy += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, cy)
}

export function pxToMm(px) {
  return px / 3.7795275591
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function safeFilename(name, ext) {
  const base = (name || 'formacombine').replace(/[^\w\- ]+/g, '_').trim() || 'formacombine'
  return `${base}.${ext}`
}
