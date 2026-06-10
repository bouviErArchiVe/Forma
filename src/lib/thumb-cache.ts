import { db } from '../db'

/** Max miniatures conservées en mémoire (LRU insertion-order Map). Borne pour carnets de centaines/milliers de pages. */
const MEM_THUMB_CACHE_MAX = 200

const MEM: Map<string, string> = new Map()

function touchMem(pageId: string, dataUrl: string): string {
  MEM.delete(pageId)
  MEM.set(pageId, dataUrl)
  while (MEM.size > MEM_THUMB_CACHE_MAX) {
    const first = MEM.keys().next().value
    if (first === undefined) break
    MEM.delete(first)
  }
  return dataUrl
}

export async function getCachedThumb(
  pageId: string,
  pageUpdatedAt?: number,
): Promise<string | null> {
  const hit = MEM.get(pageId)
  if (hit !== undefined) return touchMem(pageId, hit)
  const entry = await db.thumbnails.get(pageId)
  if (!entry) return null
  if (pageUpdatedAt != null && entry.updatedAt < pageUpdatedAt) return null
  return touchMem(pageId, entry.dataUrl)
}

export async function setCachedThumb(
  pageId: string,
  notebookId: string,
  dataUrl: string,
): Promise<void> {
  touchMem(pageId, dataUrl)
  await db.thumbnails.put({ pageId, notebookId, dataUrl, updatedAt: Date.now() })
}

export async function invalidateThumb(pageId: string): Promise<void> {
  MEM.delete(pageId)
  await db.thumbnails.delete(pageId)
}

/** Test-only: taille du cache mémoire LRU. */
export function getMemThumbCacheSize(): number {
  return MEM.size
}

/** Test-only: vide le cache mémoire LRU. */
export function clearMemThumbCache(): void {
  MEM.clear()
}

export async function deleteNotebookThumbs(notebookId: string): Promise<void> {
  await db.thumbnails.where('notebookId').equals(notebookId).delete()
}
