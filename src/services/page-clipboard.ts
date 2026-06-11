import { createEmptyPage } from '../db'
import { createId } from '../lib/id'
import { db } from '../db'
import type { Page } from '../types'
import { normalizePage } from '../types'

let pageClipboard: Page | null = null

export function copyPageToClipboard(page: Page): void {
  pageClipboard = normalizePage(JSON.parse(JSON.stringify(page)) as Page)
}

export async function pastePageToNotebook(
  notebookId: string,
  afterOrder?: number,
): Promise<Page | null> {
  if (!pageClipboard) return null
  const pages = await db.pages.where('notebookId').equals(notebookId).toArray()
  const order =
    afterOrder !== undefined
      ? afterOrder + 1
      : pages.length > 0
        ? Math.max(...pages.map((p) => p.order)) + 1
        : 0

  if (afterOrder !== undefined) {
    for (const p of pages) {
      if (p.order >= order) await db.pages.update(p.id, { order: p.order + 1 })
    }
  }

  const newId = createId()
  const src = pageClipboard
  const dup = createEmptyPage({
    ...src,
    id: newId,
    notebookId,
    order,
    strokes: src.strokes.map((s) => ({ ...s, id: createId(), pageId: newId })),
    shapes: src.shapes.map((s) => ({ ...s, id: createId(), pageId: newId })),
    texts: src.texts.map((t) => ({ ...t, id: createId(), pageId: newId })),
    images: src.images.map((i) => ({ ...i, id: createId(), pageId: newId })),
    stickers: src.stickers.map((s) => ({ ...s, id: createId(), pageId: newId })),
    tapes: src.tapes.map((t) => ({ ...t, id: createId(), pageId: newId })),
  })
  await db.pages.add(dup)
  await db.notebooks.update(notebookId, { updatedAt: Date.now() })
  return dup
}

export function hasPageClipboard(): boolean {
  return pageClipboard !== null
}
