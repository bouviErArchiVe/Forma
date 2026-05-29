import { db } from '../db'
import { collectReferencedAssetIds, garbageCollectOrphanAssets } from './assets'

/** Liste les ids d’assets sans référence dans pages/notebooks/audio. */
export async function listOrphanAssetIds(limit = 100): Promise<string[]> {
  const refs = await collectReferencedAssetIds()
  const rows = await db.assets.toArray()
  const out: string[] = []
  for (const row of rows) {
    if (refs.has(row.id)) continue
    out.push(row.id)
    if (out.length >= limit) break
  }
  return out
}

export interface StorageCleanupResult {
  orphanIds: string[]
  removed: number
}

/** Diagnostic + nettoyage assets orphelins (non destructif sur données référencées). */
export async function runStorageCleanup(dryRun = false): Promise<StorageCleanupResult> {
  const orphanIds = await listOrphanAssetIds(500)
  if (dryRun) return { orphanIds, removed: 0 }
  const removed = await garbageCollectOrphanAssets()
  return { orphanIds, removed }
}
