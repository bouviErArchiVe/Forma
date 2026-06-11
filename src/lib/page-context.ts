import type { Page } from '../types'
import { normalizePage } from '../types'

/** Texte exploitable par IA / Study (blocs, PDF indexé, OCR récent). */
export function buildPageContextText(page: Page, ocrAppend = ''): string {
  const p = normalizePage(page)
  const parts: string[] = []
  for (const t of p.texts) {
    if (t.content.trim()) parts.push(t.content.trim())
  }
  if (p.pdfText?.trim()) parts.push(p.pdfText.trim())
  if (p.inkText?.trim()) parts.push(p.inkText.trim())
  if (ocrAppend.trim()) parts.push(ocrAppend.trim())
  return parts.join('\n\n')
}
