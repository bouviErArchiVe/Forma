import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

async function drawImagesOnCanvas(images, { mode, padding = 24, gridWidth = 1200 } = {}) {
  if (!images.length) throw new Error('Aucune image à exporter')

  if (mode === 'canvas') {
    const maxX = Math.max(...images.map((i) => (i.x || 0) + (i.w || 200)))
    const maxY = Math.max(...images.map((i) => (i.y || 0) + (i.h || 150)))
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(maxX + padding * 2, 4000)
    canvas.height = Math.min(maxY + padding * 2, 4000)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (const item of images) {
      try {
        const img = await loadImage(item.url)
        ctx.save()
        const cx = (item.x || 0) + (item.w || 200) / 2 + padding
        const cy = (item.y || 0) + (item.h || 150) / 2 + padding
        ctx.translate(cx, cy)
        ctx.rotate(((item.rotation || 0) * Math.PI) / 180)
        ctx.drawImage(img, -(item.w || 200) / 2, -(item.h || 150) / 2, item.w || 200, item.h || 150)
        ctx.restore()
      } catch { /* skip broken image */ }
    }
    return canvas
  }

  const colCount = gridWidth >= 1100 ? 4 : gridWidth >= 760 ? 3 : 2
  const colW = Math.floor((gridWidth - padding * (colCount + 1)) / colCount)
  const colHeights = Array(colCount).fill(padding)
  const placements = []

  for (const item of images) {
    const ratio = item.nh && item.nw ? item.nh / item.nw : (item.h && item.w ? item.h / item.w : 0.65)
    const h = Math.max(80, Math.round(colW * ratio))
    const col = colHeights.indexOf(Math.min(...colHeights))
    const x = padding + col * (colW + padding)
    const y = colHeights[col]
    placements.push({ item, x, y, w: colW, h })
    colHeights[col] += h + padding
  }

  const totalH = Math.max(...colHeights) + padding
  const canvas = document.createElement('canvas')
  canvas.width = gridWidth
  canvas.height = Math.min(totalH, 8000)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (const { item, x, y, w, h } of placements) {
    try {
      const img = await loadImage(item.url)
      ctx.fillStyle = '#eee'
      ctx.fillRect(x, y, w, h)
      const scale = Math.min(w / img.width, h / img.height)
      const dw = img.width * scale
      const dh = img.height * scale
      ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
      if (item.name) {
        ctx.fillStyle = 'rgba(0,0,0,.55)'
        ctx.fillRect(x, y + h - 22, w, 22)
        ctx.fillStyle = '#fff'
        ctx.font = '11px sans-serif'
        ctx.fillText(String(item.name).slice(0, 40), x + 6, y + h - 7)
      }
    } catch { /* skip */ }
  }
  return canvas
}

export async function exportMoodboardPng(images, { boardName = 'moodboard', mode = 'grid', gridWidth } = {}) {
  const canvas = await drawImagesOnCanvas(images, { mode, gridWidth })
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.92)
  })
}

export async function downloadMoodboardPng(images, opts = {}) {
  const blob = await exportMoodboardPng(images, opts)
  if (!blob) throw new Error('Export PNG impossible')
  const safe = (opts.boardName || 'moodboard').replace(/[^\w\-]+/g, '_').slice(0, 48)
  downloadBlob(blob, `${safe}.png`)
}

export async function downloadMoodboardPdf(images, opts = {}) {
  if (!images.length) throw new Error('Aucune image à exporter')
  const canvas = await drawImagesOnCanvas(images, { mode: opts.mode || 'grid', gridWidth: opts.gridWidth })
  const imgData = canvas.toDataURL('image/jpeg', 0.88)
  const pdfW = 210
  const pdfH = (canvas.height / canvas.width) * pdfW
  const pdf = new jsPDF({
    orientation: pdfH > pdfW ? 'portrait' : 'landscape',
    unit: 'mm',
    format: [pdfW, Math.min(Math.max(pdfH, 148), 400)],
  })
  pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, Math.min(pdfH, 400))
  const safe = (opts.boardName || 'moodboard').replace(/[^\w\-]+/g, '_').slice(0, 48)
  pdf.save(`${safe}.pdf`)
}

/** Capture un élément DOM (grille visible) via html2canvas. */
export async function captureElementPng(el, filename = 'moodboard.png') {
  if (!el) throw new Error('Élément introuvable')
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
  })
  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, filename)
  }, 'image/png', 0.92)
}

export function moodboardShareUrl(boardId) {
  if (typeof window === 'undefined' || !boardId) return ''
  return `${window.location.origin}/moodboard?board=${encodeURIComponent(boardId)}`
}

export async function copyMoodboardLink(boardId) {
  const url = moodboardShareUrl(boardId)
  if (!url) return false
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}
