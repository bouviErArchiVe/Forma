/** Traduction — extraction de texte depuis image ou PDF (texte natif + OCR fallback). */

import { ocrImageDataUrl, ocrImageFile } from '../ocr'

export type ScanMethod = 'image-ocr' | 'pdf-native' | 'pdf-ocr'

export interface ScanResult {
  text: string
  method: ScanMethod
  previewUrl?: string
  pageCount?: number
  pagesProcessed?: number
  error?: string
}

/** Nombre maximal de pages PDF rasterisées pour l'OCR de secours. */
const MAX_OCR_PAGES = 12

function isPdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name)
}

async function scanPdf(file: File): Promise<ScanResult> {
  const { importPdfFile } = await import('../pdf-import')
  const { pages } = await importPdfFile(file, { lazy: false })
  const nativeText = pages
    .map((p) => p.pdfText.trim())
    .filter(Boolean)
    .join('\n\n')
    .trim()

  if (nativeText.length >= 12) {
    return {
      text: nativeText,
      method: 'pdf-native',
      previewUrl: pages[0]?.pdfDataUrl,
      pageCount: pages.length,
      pagesProcessed: pages.length,
    }
  }

  // Pas (ou peu) de texte natif → OCR sur les pages rasterisées.
  const targets = pages.filter((p) => p.pdfDataUrl).slice(0, MAX_OCR_PAGES)
  const chunks: string[] = []
  for (const p of targets) {
    if (!p.pdfDataUrl) continue
    const text = await ocrImageDataUrl(p.pdfDataUrl)
    if (text.trim()) chunks.push(text.trim())
  }
  return {
    text: chunks.join('\n\n').trim(),
    method: 'pdf-ocr',
    previewUrl: pages[0]?.pdfDataUrl,
    pageCount: pages.length,
    pagesProcessed: targets.length,
  }
}

export async function recognizeDocument(file: File): Promise<ScanResult> {
  try {
    if (isPdf(file)) return await scanPdf(file)
    if (file.type.startsWith('image/')) {
      const { text, previewUrl } = await ocrImageFile(file)
      return { text, method: 'image-ocr', previewUrl }
    }
    return { text: '', method: 'image-ocr', error: 'Format non supporté (image ou PDF attendu).' }
  } catch (err) {
    return { text: '', method: 'image-ocr', error: err instanceof Error ? err.message : 'Extraction échouée' }
  }
}

export const SCAN_METHOD_LABELS: Record<ScanMethod, string> = {
  'image-ocr': 'OCR image',
  'pdf-native': 'Texte PDF natif',
  'pdf-ocr': 'OCR sur PDF',
}
