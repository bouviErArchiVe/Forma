import { db } from '../db'

/**
 * Supprime les instantanés de page (`pageSnapshots`) les plus anciens, en ne
 * conservant que les `maxPerPage` plus récents par `pageId` (par `createdAt`).
 *
 * Retourne le nombre d'instantanés supprimés.
 */
export async function pruneOldSnapshots(maxPerPage = 20): Promise<number> {
  const all = await db.pageSnapshots.toArray()
  const byPage = new Map<string, typeof all>()
  for (const snap of all) {
    const list = byPage.get(snap.pageId)
    if (list) list.push(snap)
    else byPage.set(snap.pageId, [snap])
  }

  const idsToDelete: string[] = []
  for (const list of byPage.values()) {
    if (list.length <= maxPerPage) continue
    list.sort((a, b) => b.createdAt - a.createdAt)
    for (const snap of list.slice(maxPerPage)) {
      idsToDelete.push(snap.id)
    }
  }

  if (idsToDelete.length > 0) {
    await db.pageSnapshots.bulkDelete(idsToDelete)
  }
  return idsToDelete.length
}

/**
 * Supprime les miniatures (`thumbnails`) dont la page ou le carnet n'existe
 * plus (ex : carnet supprimé définitivement).
 *
 * Retourne le nombre de miniatures supprimées.
 */
export async function pruneOrphanThumbnails(): Promise<number> {
  const [thumbs, pages, notebooks] = await Promise.all([
    db.thumbnails.toArray(),
    db.pages.toArray(),
    db.notebooks.toArray(),
  ])

  const pageIds = new Set(pages.map((p) => p.id))
  const notebookIds = new Set(notebooks.filter((n) => !n.deletedAt).map((n) => n.id))

  const idsToDelete: string[] = []
  for (const thumb of thumbs) {
    if (!pageIds.has(thumb.pageId) || !notebookIds.has(thumb.notebookId)) {
      idsToDelete.push(thumb.pageId)
    }
  }

  if (idsToDelete.length > 0) {
    await db.thumbnails.bulkDelete(idsToDelete)
  }
  return idsToDelete.length
}

export interface AutoCleanupResult {
  orphanAssets: number
  prunedSnapshots: number
  orphanThumbnails: number
}

/**
 * Lance un nettoyage automatique complet : assets orphelins, instantanés
 * excédentaires et miniatures orphelines.
 */
export async function runAutoCleanup(maxSnapshotsPerPage = 20): Promise<AutoCleanupResult> {
  const { garbageCollectOrphanAssets } = await import('./assets')
  const [orphanAssets, prunedSnapshots, orphanThumbnails] = [
    await garbageCollectOrphanAssets(),
    await pruneOldSnapshots(maxSnapshotsPerPage),
    await pruneOrphanThumbnails(),
  ]
  return { orphanAssets, prunedSnapshots, orphanThumbnails }
}
