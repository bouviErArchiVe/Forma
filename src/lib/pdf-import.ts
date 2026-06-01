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
  /** Nombre total de pages dans le PDF source */
  pageCount: number
}

/** Convert ArrayBuffer → base64 data URL without FileReader (faster, no callback). */
function bufferToDataUrl(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  // Build base64 in 8 KB chunks to avoid call stack overflow on large PDFs
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return 'data:application/pdf;base64,' + btoa(binary)
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
  /** true = pas de raster à l'import (rendu à la demande) */
  lazy?: boolean
  /** Callback progression (1-based page index, total pages) */
  onProgress?: (current: number, total: number) => void
  /** Signal d'annulation ; l'import s'arrête proprement si déclenché */
  signal?: AbortSignal
}

/** Max pages rasté en mode non-lazy (garde un canvas à la fois) */
const MAX_NON_LAZY_PAGES = 50

export async function importPdfFile(
  file: File,
  options: PdfImportOptions = { lazy: true },
): Promise<PdfImportResult> {
  const { onProgress, signal } = options
  const lazy = options.lazy !== false

  // Read file buffer once — reuse for both pdfjs and data URL
  const buffer = await file.arrayBuffer()

  // Convert to data URL synchronously (no FileReader, no extra copy)
  const pdfSourceDataUrl = bufferToDataUrl(buffer)

  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const total = pdf.numPages
  const pages: ImportedPdfPage[] = []

  // Limit non-lazy raster to avoid OOM on large PDFs
  const effectiveLazy = lazy || total > MAX_NON_LAZY_PAGES

  for (let i = 1; i <= total; i++) {
    if (signal?.aborted) {
      // Clean up pdf document
      void pdf.destroy()
      throw new DOMException('Import PDF annulé', 'AbortError')
    }

    onProgress?.(i, total)

    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 1 })

    // Extract text and links in parallel
    const [contentResult, pdfLinks] = await Promise.all([
      page.getTextContent(),
      extractLinks(pdf, page, viewport),
    ])

    const pdfText = contentResult.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')

    let pdfDataUrl: string | undefined
    if (!effectiveLazy) {
      const scale = 2
      const vp = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = vp.width
      canvas.height = vp.height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        await page.render({ canvas, canvasContext: ctx, viewport: vp }).promise
        pdfDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        // Explicit canvas release to help GC
        canvas.width = 0
        canvas.height = 0
      }
    }

    // Cleanup page to release internal resources
    page.cleanup()

    pages.push({
      order: i - 1,
      template: 'blank',
      pdfDataUrl,
      pdfPageIndex: i - 1,
      pdfText,
      pdfLinks,
    })
  }

  // Destroy PDF document to release worker memory
  void pdf.destroy()

  return { pages, pdfSourceDataUrl, pageCount: total }
}
