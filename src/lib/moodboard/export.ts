import type { ResolvedMoodboardImage } from '../../services/moodboard'

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function downloadBlob(blob: Blob, filename: string): void {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

async function drawImagesOnCanvas(
  images: ResolvedMoodboardImage[],
  mode: 'grid' | 'canvas',
  gridWidth = 1200,
): Promise<HTMLCanvasElement> {
  if (!images.length) throw new Error('Aucune image à exporter')
  const padding = 24

  if (mode === 'canvas') {
    const maxX = Math.max(...images.map((i) => i.x + i.w))
    const maxY = Math.max(...images.map((i) => i.y + i.h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.min(maxX + padding * 2, 4000)
    canvas.height = Math.min(maxY + padding * 2, 4000)
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f4f4f4'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (const item of images) {
      if (!item.url) continue
      try {
        const img = await loadImage(item.url)
        ctx.save()
        const cx = item.x + item.w / 2 + padding
        const cy = item.y + item.h / 2 + padding
        ctx.translate(cx, cy)
        ctx.rotate((item.rotation * Math.PI) / 180)
        ctx.drawImage(img, -item.w / 2, -item.h / 2, item.w, item.h)
        ctx.restore()
      } catch {
        /* skip broken */
      }
    }
    return canvas
  }

  const colCount = gridWidth >= 1100 ? 4 : gridWidth >= 760 ? 3 : 2
  const colW = Math.floor((gridWidth - padding * (colCount + 1)) / colCount)
  const colHeights = Array(colCount).fill(padding)
  const placements: { item: ResolvedMoodboardImage; x: number; y: number; w: number; h: number }[] =
    []

  for (const item of images) {
    const ratio =
      item.naturalHeight && item.naturalWidth
        ? item.naturalHeight / item.naturalWidth
        : item.h / item.w
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
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (const { item, x, y, w, h } of placements) {
    if (!item.url) continue
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
        ctx.fillText(item.name.slice(0, 40), x + 6, y + h - 7)
      }
    } catch {
      /* skip */
    }
  }
  return canvas
}

export async function downloadMoodboardPng(
  images: ResolvedMoodboardImage[],
  opts: { boardName?: string; mode?: 'grid' | 'canvas'; gridWidth?: number } = {},
): Promise<void> {
  const canvas = await drawImagesOnCanvas(images, opts.mode ?? 'grid', opts.gridWidth)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/png', 0.92),
  )
  if (!blob) throw new Error('Export PNG impossible')
  const safe = (opts.boardName ?? 'moodboard').replace(/[^\w-]+/g, '_').slice(0, 48)
  downloadBlob(blob, `${safe}.png`)
}
