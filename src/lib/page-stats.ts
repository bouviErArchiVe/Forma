import type { Page } from '../types'
import { normalizePage } from '../types'

export interface PageStats {
  strokes: number
  shapes: number
  texts: number
  images: number
  stickers: number
  tapes: number
  words: number
  chars: number
}

export function computeNotebookWordCount(pages: Page[]): number {
  return pages.reduce((sum, p) => sum + computePageStats(p).words, 0)
}

export function computePageStats(page: Page): PageStats {
  const p = normalizePage(page)
  const allText = [
    ...p.texts.map((t) => t.content),
    p.pdfText ?? '',
    p.inkText ?? '',
  ].join(' ')
  const words = allText.trim() ? allText.trim().split(/\s+/).filter(Boolean).length : 0
  return {
    strokes: p.strokes.length,
    shapes: p.shapes.length,
    texts: p.texts.length,
    images: p.images.length,
    stickers: p.stickers.length,
    tapes: p.tapes.length,
    words,
    chars: allText.length,
  }
}
