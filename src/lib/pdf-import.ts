import * as pdfjs from 'pdfjs-dist'
import { PAGE_HEIGHT_PORTRAIT, PAGE_WIDTH_PORTRAIT } from './page-dimensions'
import type { PaperTemplate, PdfLink } from '../types'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export interface ImportedPdfPage {
  order: number
  template: PaperTemplate
  /** Raster optionnel ; import lazy omet ce champ */
  pdfDataUrl?: string
  pdfPageIndex: number
  pdfText: string
  pdfLinks: PdfLink[]
}

export interface PdfImportResult {
  pages: ImportedPdfPage[]
  pdfSourceDataUrl: string
}

function bufferToDataUrl(buffer: ArrayBuffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}

async function resolveDestPageIndex(
  pdf: pdfjs.PDFDocumentProxy,
  dest: string | unknown[] | null | undefined,
): Promise<number | null> {
  if (!dest) return null
  try {
    let destArray: unknown
    if (typeof dest === 'string') {
      destArray = await pdf.getDestination(dest)
    } else {
      destArray = dest
    }
    if (!destArray || !Array.isArray(destArray)) return null
    const pageRef = destArray[0]
    if (pageRef && typeof pageRef === 'object') {
      return await pdf.getPageIndex(pageRef as { num: number; gen: number })
    }
  } catch {
    return null
  }
  return null
}

async function extractLinks(
  pdf: pdfjs.PDFDocumentProxy,
  page: pdfjs.PDFPageProxy,
  viewport: pdfjs.PageViewport,
): Promise<PdfLink[]> {
  const links: PdfLink[] = []
  const sx = PAGE_WIDTH_PORTRAIT / viewport.width
  const sy = PAGE_HEIGHT_PORTRAIT / viewport.height
  const annotations = await page.getAnnotations()
  for (const ann of annotations) {
    if (ann.subtype !== 'Link') continue
    const rect = viewport.convertToViewportRectangle(ann.rect)
    const x1 = Math.min(rect[0], rect[2]) * sx
    const y1 = Math.min(rect[1], rect[3]) * sy
    const x2 = Math.max(rect[0], rect[2]) * sx
    const y2 = Math.max(rect[1], rect[3]) * sy
    const w = Math.max(8, x2 - x1)
    const h = Math.max(8, y2 - y1)
    const box = { x: x1, y: y1, width: w, height: h }
    if (ann.url) {
      links.push({ ...box, url: ann.url })
    } else if (ann.dest) {
      const targetPageIndex = await resolveDestPageIndex(pdf, ann.dest)
      if (targetPageIndex != null) {
        links.push({ ...box, targetPageIndex })
      }
    }
  }
  return links
}

export interface PdfImportOptions {
  /** true = pas de raster à l’import (rendu à la demande) */
  lazy?: boolean
}

export async function importPdfFile(
  file: File,
  options: PdfImportOptions = { lazy: true },
): Promise<PdfImportResult> {
  const buffer = await file.arrayBuffer()
  const pdfSourceDataUrl = await bufferToDataUrl(buffer)
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const pages: ImportedPdfPage[] = []
  const lazy = options.lazy !== false

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1 })
    const content = await page.getTextContent()
    const pdfText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
    const pdfLinks = await extractLinks(pdf, page, viewport)

    let pdfDataUrl: string | undefined
    if (!lazy) {
      const scale = 2
      const vp = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width
      canvas.height = vp.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise
        pdfDataUrl = canvas.toDataURL('image/png')
      }
    }

    pages.push({
      order: i - 1,
      template: 'blank',
      pdfDataUrl,
      pdfPageIndex: i - 1,
      pdfText,
      pdfLinks,
    })
  }

  return { pages, pdfSourceDataUrl }
}
