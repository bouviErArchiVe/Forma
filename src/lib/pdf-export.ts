import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import { basePageDimensions } from './page-dimensions'
import { EXPORT_PIXEL_RATIO, type PageRenderOptions, renderFullPage } from './page-render'
import type { Orientation, Page } from '../types'

function exportOpts(
  pdfSourceDataUrl?: string,
  notebook?: import('../types').Notebook | null,
): PageRenderOptions {
  return { exportScale: EXPORT_PIXEL_RATIO, pdfSourceDataUrl, notebook }
}

export const PAGE_WIDTH = 794
export const PAGE_HEIGHT = 1123

/** Release a canvas after use (helps GC reclaim memory sooner). */
function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 0
  canvas.height = 0
}

/**
 * Convert canvas → JPEG ArrayBuffer.
 * Uses JPEG for PDF raster pages to significantly reduce file size vs PNG
 * while preserving acceptable quality for document content.
 * Falls back to PNG blob for pages that have transparency.
 */
function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.88): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob failed'))
      },
      'image/jpeg',
      quality,
    )
  })
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export async function exportNotebookToPdf(
  pages: Page[],
  filename: string,
  orientation: Orientation = 'portrait',
  onProgress?: (index: number, total: number) => void,
  pdfSourceDataUrl?: string,
  notebook?: import('../types').Notebook | null,
): Promise<void> {
  const pdfDoc = await PDFDocument.create()
  const sorted = [...pages].sort((a, b) => a.order - b.order)
  const total = sorted.length

  for (let i = 0; i < sorted.length; i++) {
    const page = sorted[i]
    onProgress?.(i + 1, total)
    const { width, height } = basePageDimensions(orientation)
    const canvas = await renderFullPage(page, width, height, exportOpts(pdfSourceDataUrl, notebook))

    // Use JPEG for smaller file size; wrap in try/catch for transparency fallback
    let embedded: Awaited<ReturnType<PDFDocument['embedJpg']>> | Awaited<ReturnType<PDFDocument['embedPng']>>
    try {
      const jpegBlob = await canvasToJpegBlob(canvas)
      const jpegBytes = await jpegBlob.arrayBuffer()
      embedded = await pdfDoc.embedJpg(jpegBytes)
    } catch {
      // Fallback: use PNG if JPEG encoding fails
      const pngBlob = await canvasToPngBlob(canvas)
      if (!pngBlob) { releaseCanvas(canvas); continue }
      const pngBytes = await pngBlob.arrayBuffer()
      embedded = await pdfDoc.embedPng(pngBytes)
    }

    const pdfPage = pdfDoc.addPage([canvas.width, canvas.height])
    pdfPage.drawImage(embedded, { x: 0, y: 0, width: canvas.width, height: canvas.height })

    // Release canvas memory
    releaseCanvas(canvas)
  }

  const bytes = await pdfDoc.save()
  downloadBlob(new Blob([bytes as BlobPart], { type: 'application/pdf' }), filename)
}

export async function exportPageToSvg(
  page: Page,
  filename: string,
  pdfSourceDataUrl?: string,
  notebook?: import('../types').Notebook | null,
): Promise<void> {
  const canvas = await renderFullPage(page, undefined, undefined, exportOpts(pdfSourceDataUrl, notebook))
  const png = canvas.toDataURL('image/png')
  const w = canvas.width
  const h = canvas.height
  releaseCanvas(canvas)
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><image xlink:href="${png}" width="${w}" height="${h}"/></svg>`
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), filename.endsWith('.svg') ? filename : `${filename}.svg`)
}

export async function exportPageToPng(
  page: Page,
  filename: string,
  pdfSourceDataUrl?: string,
  notebook?: import('../types').Notebook | null,
): Promise<void> {
  const canvas = await renderFullPage(page, undefined, undefined, exportOpts(pdfSourceDataUrl, notebook))
  const blob = await canvasToPngBlob(canvas)
  releaseCanvas(canvas)
  if (blob) downloadBlob(blob, filename.endsWith('.png') ? filename : `${filename}.png`)
}

export async function exportNotebookPngZip(
  pages: Page[],
  baseName: string,
  orientation: Orientation = 'portrait',
  onProgress?: (index: number, total: number) => void,
  pdfSourceDataUrl?: string,
  notebook?: import('../types').Notebook | null,
): Promise<void> {
  const zip = new JSZip()
  const sorted = [...pages].sort((a, b) => a.order - b.order)
  const { width, height } = basePageDimensions(orientation)
  const total = sorted.length

  for (let i = 0; i < sorted.length; i++) {
    onProgress?.(i + 1, total)
    const canvas = await renderFullPage(sorted[i], width, height, exportOpts(pdfSourceDataUrl, notebook))
    const blob = await canvasToPngBlob(canvas)
    releaseCanvas(canvas)
    if (!blob) continue
    const arrayBuf = await blob.arrayBuffer()
    zip.file(`page-${String(i + 1).padStart(3, '0')}.png`, arrayBuf)
  }

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  downloadBlob(blob, `${baseName}-pages.zip`)
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Delay revoke to allow browser to start download
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
