/**
 * Export PDF avec traits vectoriels (addendum §8.3).
 * Fond PDF / images en raster si nécessaire ; encre en paths.
 *
 * Fond PDF (raster, pas vectoriel) :
 * - Priorité à `page.pdfDataUrl` (bitmap déjà associé à la page).
 * - Sinon `renderPdfPageDataUrl` sur la source carnet (`pdfSourceDataUrl` ou asset
 *   hydraté) à DPR 2 : pdf.js rasterise la page source → canvas PNG → `embedPng`
 *   dans la page pdf-lib. Le contenu natif du PDF n’est pas re-vectorisé.
 * - Les annotations Forma (strokes, shapes, texte) restent vectorielles par-dessus.
 */
import { PDFDocument, rgb } from 'pdf-lib'
import { hydratePageForRender } from './assets'
import { renderPdfPageDataUrl } from './pdf-page-render'
import { basePageDimensions } from './page-dimensions'
import { getSticker } from './stickers'
import type {
  Notebook,
  Orientation,
  Page,
  ShapeElement,
  StickerElement,
  Stroke,
  TapeElement,
} from '../types'

async function embedRasterImage(
  pdfDoc: PDFDocument,
  src: string,
): Promise<Awaited<ReturnType<PDFDocument['embedPng']>> | null> {
  if (!src) return null
  try {
    const bytes = await fetch(src).then((r) => r.arrayBuffer())
    if (src.includes('png') || src.startsWith('blob:')) {
      try {
        return await pdfDoc.embedPng(bytes)
      } catch {
        return await pdfDoc.embedJpg(bytes)
      }
    }
    return await pdfDoc.embedJpg(bytes)
  } catch {
    return null
  }
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return {
    r: ((n >> 16) & 255) / 255,
    g: ((n >> 8) & 255) / 255,
    b: (n & 255) / 255,
  }
}

function drawStroke(
  page: ReturnType<PDFDocument['addPage']>,
  stroke: Stroke,
  pageH: number,
): void {
  const pts = stroke.points
  if (pts.length < 2) return
  const col = parseHexColor(stroke.color)
  const opacity = stroke.tool === 'highlighter' ? stroke.opacity * 0.85 : stroke.opacity

  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    page.drawLine({
      start: { x: a.x, y: pageH - a.y },
      end: { x: b.x, y: pageH - b.y },
      thickness: stroke.width,
      color: rgb(col.r, col.g, col.b),
      opacity,
    })
  }
}

function drawShape(
  page: ReturnType<PDFDocument['addPage']>,
  s: ShapeElement,
  pageH: number,
): void {
  const col = parseHexColor(s.color)
  const c = rgb(col.r, col.g, col.b)
  const y1 = pageH - s.y1
  const y2 = pageH - s.y2
  switch (s.type) {
    case 'line':
      page.drawLine({
        start: { x: s.x1, y: y1 },
        end: { x: s.x2, y: y2 },
        thickness: s.width,
        color: c,
      })
      break
    case 'rectangle':
      page.drawRectangle({
        x: Math.min(s.x1, s.x2),
        y: Math.min(y1, y2),
        width: Math.abs(s.x2 - s.x1),
        height: Math.abs(y2 - y1),
        borderColor: c,
        borderWidth: s.width,
      })
      break
    case 'ellipse': {
      const cx = (s.x1 + s.x2) / 2
      const cy = (y1 + y2) / 2
      const rx = Math.abs(s.x2 - s.x1) / 2
      const ry = Math.abs(y2 - y1) / 2
      page.drawEllipse({
        x: cx - rx,
        y: cy - ry,
        xScale: rx,
        yScale: ry,
        borderColor: c,
        borderWidth: s.width,
      })
      break
    }
    case 'arrow': {
      const head = 12 + s.width
      const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1)
      page.drawLine({
        start: { x: s.x1, y: y1 },
        end: { x: s.x2, y: y2 },
        thickness: s.width,
        color: c,
      })
      const hx1 = s.x2 - head * Math.cos(angle - Math.PI / 6)
      const hy1 = s.y2 - head * Math.sin(angle - Math.PI / 6)
      const hx2 = s.x2 - head * Math.cos(angle + Math.PI / 6)
      const hy2 = s.y2 - head * Math.sin(angle + Math.PI / 6)
      page.drawLine({
        start: { x: s.x2, y: y2 },
        end: { x: hx1, y: pageH - hy1 },
        thickness: s.width,
        color: c,
      })
      page.drawLine({
        start: { x: s.x2, y: y2 },
        end: { x: hx2, y: pageH - hy2 },
        thickness: s.width,
        color: c,
      })
      break
    }
    default:
      break
  }
}

function drawTapePdf(
  page: ReturnType<PDFDocument['addPage']>,
  t: TapeElement,
  pageH: number,
): void {
  if (t.revealed) return
  const col = parseHexColor(t.color)
  page.drawRectangle({
    x: t.x,
    y: pageH - t.y - t.height,
    width: t.width,
    height: t.height,
    color: rgb(col.r, col.g, col.b),
    opacity: 0.92,
  })
}

async function stickerToDataUrl(st: StickerElement): Promise<string | null> {
  const def = getSticker(st.stickerId)
  if (!def) return null
  const canvas = document.createElement('canvas')
  const pad = 4
  canvas.width = st.size + pad * 2
  canvas.height = st.size + pad * 2
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.font = `${st.size}px Segoe UI Emoji, Apple Color Emoji, sans-serif`
  ctx.textBaseline = 'top'
  ctx.fillText(def.emoji, pad, pad)
  return canvas.toDataURL('image/png')
}

export async function exportNotebookToVectorPdf(
  pages: Page[],
  filename: string,
  orientation: Orientation = 'portrait',
  pdfSourceDataUrl?: string,
  onProgress?: (index: number, total: number) => void,
  notebook?: Notebook | null,
): Promise<void> {
  const pdfDoc = await PDFDocument.create()
  const sorted = [...pages].sort((a, b) => a.order - b.order)
  const { width, height } = basePageDimensions(orientation)
  const total = sorted.length

  for (let i = 0; i < sorted.length; i++) {
    onProgress?.(i + 1, total)
    const hydrated = await hydratePageForRender(sorted[i], notebook ?? null)
    const p = hydrated.page
    const src = hydrated.pdfSourceDataUrl ?? pdfSourceDataUrl
    const pdfPage = pdfDoc.addPage([width, height])

    let bgDataUrl = p.pdfDataUrl
    if (!bgDataUrl && src != null && p.pdfPageIndex != null) {
      bgDataUrl = await renderPdfPageDataUrl(src, p.pdfPageIndex, 2, notebook?.id ?? 'pdf-export')
    }
    if (bgDataUrl) {
      const img = await embedRasterImage(pdfDoc, bgDataUrl)
      if (img) pdfPage.drawImage(img, { x: 0, y: 0, width, height })
    } else {
      pdfPage.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(1, 0.996, 0.976),
      })
    }

    for (const img of p.images) {
      const src = img.dataUrl
      if (!src) continue
      const embedded = await embedRasterImage(pdfDoc, src)
      if (!embedded) continue
      pdfPage.drawImage(embedded, {
        x: img.x,
        y: height - img.y - img.height,
        width: img.width,
        height: img.height,
      })
    }

    for (const st of p.stickers) {
      const dataUrl = await stickerToDataUrl(st)
      if (!dataUrl) continue
      const embedded = await embedRasterImage(pdfDoc, dataUrl)
      if (!embedded) continue
      const pad = 4
      pdfPage.drawImage(embedded, {
        x: st.x - pad,
        y: height - st.y - st.size - pad,
        width: st.size + pad * 2,
        height: st.size + pad * 2,
      })
    }

    for (const t of p.tapes) drawTapePdf(pdfPage, t, height)

    const highlighters = p.strokes.filter((s) => s.tool === 'highlighter')
    const inkStrokes = p.strokes.filter((s) => s.tool !== 'highlighter')
    for (const stroke of highlighters) drawStroke(pdfPage, stroke, height)
    for (const stroke of inkStrokes) drawStroke(pdfPage, stroke, height)
    for (const shape of p.shapes) drawShape(pdfPage, shape, height)

    for (const t of p.texts) {
      if (!t.content.trim()) continue
      const col = parseHexColor(t.color)
      pdfPage.drawText(t.content.slice(0, 2000), {
        x: t.x,
        y: height - t.y - t.fontSize,
        size: t.fontSize,
        color: rgb(col.r, col.g, col.b),
        maxWidth: t.width,
      })
    }
  }

  const bytes = await pdfDoc.save()
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
