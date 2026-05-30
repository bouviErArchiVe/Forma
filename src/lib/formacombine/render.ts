import type { FormaCombinePage } from '../../types'
import { A4_PX } from './constants'

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): void {
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

export async function pageToDataUrl(
  page: FormaCombinePage,
  { format = 'png', quality = 0.92, pageNumber = null }: { format?: 'png' | 'jpeg'; quality?: number; pageNumber?: number | null } = {},
): Promise<string> {
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
  if (!ctx) throw new Error('Canvas indisponible')

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
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            ctx.drawImage(img, 0, 0, w, h)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = page.dataUrl!
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
      ctx.fillStyle = '#666666'
      ctx.font = '16px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(page.text || page.name || '—', w / 2, h / 2 - 12)
      break
    }
    case 'title': {
      ctx.fillStyle = '#111111'
      ctx.font = 'bold 36px Inter, system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      wrapText(ctx, page.text || page.name || 'Titre', w / 2, h / 2, w - 80, 44)
      break
    }
    case 'text': {
      ctx.fillStyle = '#222222'
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
    ctx.fillStyle = '#666666'
    ctx.font = '12px Inter, system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(String(pageNumber), cw - 16, ch - 12)
  }

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  return canvas.toDataURL(mime, quality)
}

export function pxToPt(px: number): number {
  return (px / 96) * 72
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function safeFilename(name: string | undefined, ext: string): string {
  const base = (name || 'formacombine').replace(/[^\w\- ]+/g, '_').trim() || 'formacombine'
  return `${base}.${ext}`
}

async function dataUrlToBytes(dataUrl: string): Promise<Uint8Array> {
  const res = await fetch(dataUrl)
  return new Uint8Array(await res.arrayBuffer())
}

export async function renderAllPages(
  project: { pages: FormaCombinePage[]; settings?: { pageNumbers?: boolean } },
): Promise<{ page: FormaCombinePage; png: string; jpg: string; index: number }[]> {
  const out = []
  for (let i = 0; i < project.pages.length; i += 1) {
    const page = project.pages[i]!
    const num = project.settings?.pageNumbers ? i + 1 : null
    const png = await pageToDataUrl(page, { format: 'png', pageNumber: num })
    const jpg = await pageToDataUrl(page, { format: 'jpeg', quality: 0.92, pageNumber: num })
    out.push({ page, png, jpg, index: i })
  }
  return out
}

export async function exportCombinedPdfBlob(
  project: { name?: string; pages: FormaCombinePage[]; settings?: { pageNumbers?: boolean } },
): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib')
  if (!project.pages.length) throw new Error('Aucune page à exporter')

  const pdf = await PDFDocument.create()
  if (project.name) pdf.setTitle(project.name)

  for (let i = 0; i < project.pages.length; i += 1) {
    const page = project.pages[i]!
    const num = project.settings?.pageNumbers ? i + 1 : null
    let png: string
    try {
      png = await pageToDataUrl(page, { format: 'png', pageNumber: num })
    } catch (err) {
      throw new Error(
        `Page ${i + 1} (« ${page.name || 'sans titre'} ») : ${err instanceof Error ? err.message : 'format non supporté'}`,
      )
    }
    const wPt = pxToPt(page.width)
    const hPt = pxToPt(page.height)
    const pdfPage = pdf.addPage([wPt, hPt])
    const bytes = await dataUrlToBytes(png)
    const image = await pdf.embedPng(bytes)
    pdfPage.drawImage(image, { x: 0, y: 0, width: wPt, height: hPt })
  }

  const bytes = await pdf.save()
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}
