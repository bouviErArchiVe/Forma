import { db } from '../db'
import { ocrPage } from './ocr'
import type { Page } from '../types'
import { normalizePage } from '../types'

const MIN_STROKES = 8

/** OCR de la page pour indexer l’écriture manuscrite (recherche bibliothèque). */
export async function indexPageInk(page: Page): Promise<string> {
  const p = normalizePage(page)
  if (p.inkText?.trim()) return p.inkText
  if (p.strokes.length < MIN_STROKES) return ''
  const text = await ocrPage(p)
  if (text.trim()) {
    await db.pages.update(p.id, { inkText: text })
  }
  return text
}

export async function savePageInkText(pageId: string, text: string): Promise<void> {
  const trimmed = text.trim()
  if (trimmed) await db.pages.update(pageId, { inkText: trimmed })
}

export async function indexNotebookInk(
  notebookId: string,
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const pages = await db.pages.where('notebookId').equals(notebookId).toArray()
  const targets = pages.filter((p) => p.strokes.length >= MIN_STROKES && !p.inkText?.trim())
  let indexed = 0
  for (let i = 0; i < targets.length; i++) {
    const text = await indexPageInk(normalizePage(targets[i]))
    if (text.trim()) indexed++
    onProgress?.(i + 1, targets.length)
  }
  return indexed
}

export async function indexAllInk(
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const pages = await db.pages.toArray()
  const targets = pages.filter((p) => p.strokes.length >= MIN_STROKES && !p.inkText?.trim())
  let indexed = 0
  for (let i = 0; i < targets.length; i++) {
    const text = await indexPageInk(normalizePage(targets[i]))
    if (text.trim()) indexed++
    onProgress?.(i + 1, targets.length)
  }
  return indexed
}
