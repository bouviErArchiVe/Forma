import { db } from '../db'

const MEM: Map<string, string> = new Map()

export async function getCachedThumb(
  pageId: string,
  pageUpdatedAt?: number,
): Promise<string | null> {
  if (MEM.has(pageId)) return MEM.get(pageId)!
  const entry = await db.thumbnails.get(pageId)
  if (!entry) return null
  if (pageUpdatedAt != null && entry.updatedAt < pageUpdatedAt) return null
  MEM.set(pageId, entry.dataUrl)
  return entry.dataUrl
}

export async function setCachedThumb(
  pageId: string,
  notebookId: string,
  dataUrl: string,
): Promise<void> {
  MEM.set(pageId, dataUrl)
  await db.thumbnails.put({ pageId, notebookId, dataUrl, updatedAt: Date.now() })
}

export async function invalidateThumb(pageId: string): Promise<void> {
  MEM.delete(pageId)
  await db.thumbnails.delete(pageId)
}

export async function deleteNotebookThumbs(notebookId: string): Promise<void> {
  await db.thumbnails.where('notebookId').equals(notebookId).delete()
}
