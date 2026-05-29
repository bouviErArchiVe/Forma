import { db, createEmptyPage } from '../db'
import { persistPageAssets } from '../lib/assets'
import { createId } from '../lib/id'
import type { Page, PaperTemplate } from '../types'
import { normalizePage } from '../types'

export async function setAllTapesRevealed(
  notebookId: string,
  revealed: boolean,
): Promise<void> {
  const pages = await getPages(notebookId)
  for (const p of pages) {
    if (!p.tapes.length) continue
    await db.pages.update(p.id, {
      tapes: p.tapes.map((t) => ({ ...t, revealed })),
    })
  }
  await db.notebooks.update(notebookId, { updatedAt: Date.now() })
}

export async function getPages(notebookId: string): Promise<Page[]> {
  const pages = await db.pages.where('notebookId').equals(notebookId).toArray()
  return pages.map(normalizePage).sort((a, b) => a.order - b.order)
}

export async function getPage(id: string): Promise<Page | undefined> {
  const p = await db.pages.get(id)
  return p ? normalizePage(p) : undefined
}

export async function savePage(page: Page): Promise<void> {
  const stored = await persistPageAssets(page)
  await db.pages.put(normalizePage(stored))
  await db.notebooks.update(page.notebookId, { updatedAt: Date.now() })
  const { enqueueSyncOp } = await import('./sync-queue')
  enqueueSyncOp({
    id: page.id,
    type: 'page_update',
    entityId: page.id,
    payload: { notebookId: page.notebookId },
    createdAt: Date.now(),
  })
}

export async function addPage(
  notebookId: string,
  template: PaperTemplate,
  afterOrder?: number,
): Promise<Page> {
  const pages = await getPages(notebookId)
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

  const page = createEmptyPage({
    id: createId(),
    notebookId,
    order,
    template,
    rotation: 0,
  })
  await db.pages.add(page)
  await db.notebooks.update(notebookId, { updatedAt: Date.now() })
  return page
}

export async function deletePage(pageId: string): Promise<void> {
  const page = await db.pages.get(pageId)
  if (!page) return
  const pages = await getPages(page.notebookId)
  if (pages.length <= 1) return
  await db.pages.delete(pageId)
  const { enqueueSyncOp } = await import('./sync-queue')
  enqueueSyncOp({
    id: pageId,
    type: 'page_delete',
    entityId: pageId,
    payload: { notebookId: page.notebookId },
    createdAt: Date.now(),
  })
  const remaining = pages.filter((p) => p.id !== pageId)
  for (let i = 0; i < remaining.length; i++) {
    await db.pages.update(remaining[i].id, { order: i })
  }
}

function clonePageContent(page: Page, newPageId: string): Page {
  return createEmptyPage({
    ...page,
    id: newPageId,
    strokes: page.strokes.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
    shapes: page.shapes.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
    texts: page.texts.map((t) => ({ ...t, id: createId(), pageId: newPageId })),
    images: page.images.map((i) => ({ ...i, id: createId(), pageId: newPageId })),
    stickers: page.stickers.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
    tapes: page.tapes.map((t) => ({ ...t, id: createId(), pageId: newPageId })),
  })
}

export async function duplicatePage(pageId: string): Promise<Page | null> {
  const page = await getPage(pageId)
  if (!page) return null
  const pages = await getPages(page.notebookId)
  const newOrder = page.order + 1
  for (const p of pages) {
    if (p.order >= newOrder) await db.pages.update(p.id, { order: p.order + 1 })
  }
  const dup = clonePageContent(page, createId())
  dup.order = newOrder
  await savePage(dup)
  return dup
}

export async function reorderPages(
  notebookId: string,
  orderedIds: string[],
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    await db.pages.update(orderedIds[i], { order: i })
  }
  await db.notebooks.update(notebookId, { updatedAt: Date.now() })
}

export async function updatePage(page: Page): Promise<void> {
  await savePage(page)
}

export async function changePageTemplate(
  pageId: string,
  template: PaperTemplate,
): Promise<void> {
  await db.pages.update(pageId, { template })
}

export async function togglePageFavorite(pageId: string): Promise<void> {
  const p = await db.pages.get(pageId)
  if (p) await db.pages.update(pageId, { favorite: !p.favorite })
}

export async function rotatePage(pageId: string): Promise<void> {
  const p = await getPage(pageId)
  if (!p) return
  const next = ((p.rotation + 90) % 360) as 0 | 90 | 180 | 270
  await db.pages.update(pageId, { rotation: next })
}

/** Déplace une page vers un autre carnet (le carnet source doit garder au moins une page). */
export async function movePageToNotebook(
  pageId: string,
  targetNotebookId: string,
): Promise<Page | null> {
  const page = await getPage(pageId)
  if (!page || page.notebookId === targetNotebookId) return null
  const sourcePages = await getPages(page.notebookId)
  if (sourcePages.length <= 1) return null

  const targetPages = await getPages(targetNotebookId)
  const newOrder =
    targetPages.length > 0 ? Math.max(...targetPages.map((p) => p.order)) + 1 : 0

  await db.pages.update(pageId, { notebookId: targetNotebookId, order: newOrder })

  const remaining = sourcePages.filter((p) => p.id !== pageId)
  for (let i = 0; i < remaining.length; i++) {
    await db.pages.update(remaining[i].id, { order: i })
  }
  const now = Date.now()
  await db.notebooks.update(page.notebookId, { updatedAt: now })
  await db.notebooks.update(targetNotebookId, { updatedAt: now })
  const moved = await getPage(pageId)
  if (moved) await savePage(moved)
  return moved ?? null
}
