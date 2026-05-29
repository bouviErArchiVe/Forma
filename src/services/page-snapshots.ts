import { db } from '../db'
import { createId } from '../lib/id'
import { clonePageState } from '../lib/page-history'
import type { Page, PageSnapshot } from '../types'
import { normalizePage } from '../types'

const MAX_SNAPSHOTS_PER_PAGE = 15

function snapshotPayload(page: Page): Page {
  return clonePageState(normalizePage(page))
}

export async function listPageSnapshots(pageId: string): Promise<PageSnapshot[]> {
  const rows = await db.pageSnapshots.where('pageId').equals(pageId).toArray()
  return rows.sort((a, b) => b.createdAt - a.createdAt)
}

export async function createPageSnapshot(page: Page, label?: string): Promise<PageSnapshot> {
  const now = Date.now()
  const snap: PageSnapshot = {
    id: createId(),
    pageId: page.id,
    label:
      label?.trim() ||
      new Date(now).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    createdAt: now,
    data: snapshotPayload(page),
  }
  await db.pageSnapshots.add(snap)

  const all = await listPageSnapshots(page.id)
  if (all.length > MAX_SNAPSHOTS_PER_PAGE) {
    const toDrop = all.slice(MAX_SNAPSHOTS_PER_PAGE)
    await db.pageSnapshots.bulkDelete(toDrop.map((s) => s.id))
  }
  return snap
}

export async function restorePageSnapshot(snapshotId: string): Promise<Page | null> {
  const snap = await db.pageSnapshots.get(snapshotId)
  if (!snap) return null
  const current = await db.pages.get(snap.pageId)
  if (!current) return null

  const restored = normalizePage({
    ...snap.data,
    id: current.id,
    notebookId: current.notebookId,
    order: current.order,
    template: current.template,
    rotation: current.rotation,
    pdfText: current.pdfText,
    pdfLinks: current.pdfLinks,
    pdfPageIndex: current.pdfPageIndex,
    pdfDataUrl: current.pdfDataUrl,
    favorite: current.favorite,
  })
  await db.pages.put(restored)
  await db.notebooks.update(restored.notebookId, { updatedAt: Date.now() })
  return restored
}

export async function deletePageSnapshot(snapshotId: string): Promise<void> {
  await db.pageSnapshots.delete(snapshotId)
}
