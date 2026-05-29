import JSZip from 'jszip'
import { hydratePageForRender } from './assets'
import { resolveExportDataUrl, resolveExportImageHref } from './export-resolve'
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
  TextElement,
} from '../types'
import { simplifyStrokePointsForSvg } from './path-simplify'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function strokePath(stroke: Stroke): string {
  const pts = simplifyStrokePointsForSvg(stroke.points, stroke.tool)
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`
  }
  return d
}

function shapeSvg(s: ShapeElement): string {
  const sw = s.width
  const col = esc(s.color)
  switch (s.type) {
    case 'line':
      return `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`
    case 'rectangle': {
      const x = Math.min(s.x1, s.x2)
      const y = Math.min(s.y1, s.y2)
      const w = Math.abs(s.x2 - s.x1)
      const h = Math.abs(s.y2 - s.y1)
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${col}" stroke-width="${sw}"/>`
    }
    case 'ellipse': {
      const cx = (s.x1 + s.x2) / 2
      const cy = (s.y1 + s.y2) / 2
      const rx = Math.abs(s.x2 - s.x1) / 2
      const ry = Math.abs(s.y2 - s.y1) / 2
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${col}" stroke-width="${sw}"/>`
    }
    case 'arrow': {
      const head = 12 + sw
      const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1)
      const x3 = s.x2 - head * Math.cos(angle - Math.PI / 6)
      const y3 = s.y2 - head * Math.sin(angle - Math.PI / 6)
      const x4 = s.x2 - head * Math.cos(angle + Math.PI / 6)
      const y4 = s.y2 - head * Math.sin(angle + Math.PI / 6)
      return `<path d="M ${s.x1} ${s.y1} L ${s.x2} ${s.y2} M ${s.x2} ${s.y2} L ${x3} ${y3} M ${s.x2} ${s.y2} L ${x4} ${y4}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round"/>`
    }
    default:
      return ''
  }
}

function textSvg(t: TextElement): string {
  const lines = t.content.split('\n')
  const lineHeight = t.fontSize * 1.25
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="${t.x}" dy="${i === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`,
    )
    .join('')
  return `<text x="${t.x}" y="${t.y + t.fontSize}" font-size="${t.fontSize}" fill="${esc(t.color)}" font-family="Segoe UI, sans-serif">${tspans}</text>`
}

function tapeSvg(t: TapeElement): string {
  if (t.revealed) return ''
  return `<rect x="${t.x}" y="${t.y}" width="${t.width}" height="${t.height}" fill="${esc(t.color)}" opacity="0.92"/>`
}

async function stickerDataUrl(st: StickerElement): Promise<string | null> {
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

export async function pageToVectorSvg(
  page: Page,
  orientation: Orientation = 'portrait',
  notebook?: Notebook | null,
  pdfSourceDataUrl?: string,
): Promise<string> {
  const hydrated = await hydratePageForRender(page, notebook ?? null)
  const p = hydrated.page
  const src = hydrated.pdfSourceDataUrl ?? pdfSourceDataUrl
  const { width, height } = basePageDimensions(orientation)
  const paper =
    getComputedStyle(document.documentElement).getPropertyValue('--color-forma-paper').trim() ||
    '#fffef9'

  const parts: string[] = [
    `<rect width="${width}" height="${height}" fill="${esc(paper)}"/>`,
  ]
  const exportNotes: string[] = []

  let bgDataUrl = p.pdfDataUrl
  if (!bgDataUrl && src != null && p.pdfPageIndex != null) {
    bgDataUrl = await renderPdfPageDataUrl(src, p.pdfPageIndex, 2, notebook?.id ?? 'svg-export')
  }
  if (bgDataUrl) {
    const bgInline = await resolveExportDataUrl(bgDataUrl)
    if (bgInline) {
      parts.push(
        `<image href="${esc(bgInline)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/>`,
      )
    }
  }

  for (const img of p.images) {
    if (!img.dataUrl) continue
    const resolved = await resolveExportImageHref(img.dataUrl, img.assetId)
    if (resolved.note) exportNotes.push(resolved.note)
    if (!resolved.href) continue
    parts.push(
      `<image href="${esc(resolved.href)}" x="${img.x}" y="${img.y}" width="${img.width}" height="${img.height}"/>`,
    )
  }

  for (const st of p.stickers) {
    const url = await stickerDataUrl(st)
    if (!url) continue
    const pad = 4
    parts.push(
      `<image href="${esc(url)}" x="${st.x - pad}" y="${st.y - pad}" width="${st.size + pad * 2}" height="${st.size + pad * 2}"/>`,
    )
  }

  for (const t of p.tapes) parts.push(tapeSvg(t))

  const highlighters = p.strokes.filter((s) => s.tool === 'highlighter')
  const inkStrokes = p.strokes.filter((s) => s.tool !== 'highlighter')
  const strokeSvg = (stroke: Stroke) => {
    const d = strokePath(stroke)
    if (!d) return
    const blend = stroke.tool === 'highlighter' ? ' mix-blend-mode="multiply"' : ''
    const op =
      stroke.tool === 'highlighter' ? stroke.opacity
      : stroke.tool === 'pencil' ? 0.85
      : stroke.opacity
    parts.push(
      `<path d="${d}" fill="none" stroke="${esc(stroke.color)}" stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"${blend}/>`,
    )
  }
  for (const stroke of highlighters) strokeSvg(stroke)
  for (const stroke of inkStrokes) strokeSvg(stroke)

  for (const s of p.shapes) parts.push(shapeSvg(s))
  for (const t of p.texts) if (t.content.trim()) parts.push(textSvg(t))

  const noteMarkup = exportNotes.map((n) => `<!-- ${esc(n)} -->`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${noteMarkup}${parts.join('')}</svg>`
}

export function downloadVectorSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportPageToVectorSvg(
  page: Page,
  filename: string,
  orientation?: Orientation,
  notebook?: Notebook | null,
): Promise<void> {
  const svg = await pageToVectorSvg(page, orientation, notebook)
  downloadVectorSvg(svg, filename)
}

export async function exportNotebookVectorSvgZip(
  pages: Page[],
  baseName: string,
  orientation: Orientation = 'portrait',
  onProgress?: (index: number, total: number) => void,
  notebook?: Notebook | null,
): Promise<void> {
  const zip = new JSZip()
  const sorted = [...pages].sort((a, b) => a.order - b.order)
  const total = sorted.length
  for (let i = 0; i < sorted.length; i++) {
    onProgress?.(i + 1, total)
    const svg = await pageToVectorSvg(sorted[i], orientation, notebook)
    zip.file(`page-${String(i + 1).padStart(3, '0')}.svg`, svg)
  }
  const blob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName}-vector.zip`
  a.click()
  URL.revokeObjectURL(url)
}
