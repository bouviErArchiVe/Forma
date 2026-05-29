import { db } from '../db'

export interface LibraryStats {
  notebooks: number
  pages: number
  folders: number
  studyCards: number
  audioRecordings: number
  snapshots: number
  assets: number
  assetBytes: number
  inkIndexedPages: number
  /** Estimation JSON sérialisé (octets) */
  estimatedBytes: number
}

export async function getLibraryStats(): Promise<LibraryStats> {
  const [notebooks, pages, folders, studyCards, audio, snapshots, assetRows] = await Promise.all([
    db.notebooks.filter((n) => !n.deletedAt).count(),
    db.pages.count(),
    db.folders.count(),
    db.studyCards.count(),
    db.audio.count(),
    db.pageSnapshots.count(),
    db.assets.toArray(),
  ])
  const assetBytes = assetRows.reduce((sum, a) => sum + a.blob.size, 0)

  const allPages = await db.pages.toArray()
  const inkIndexedPages = allPages.filter((p) => p.inkText?.trim()).length

  const sample = {
    notebooks: await db.notebooks.toArray(),
    pages: allPages,
    folders: await db.folders.toArray(),
    studyCards: await db.studyCards.toArray(),
    audio: await db.audio.toArray(),
    pageSnapshots: await db.pageSnapshots.toArray(),
  }
  const estimatedBytes = new Blob([JSON.stringify(sample)]).size

  return {
    notebooks,
    pages,
    folders,
    studyCards,
    audioRecordings: audio,
    snapshots,
    assets: assetRows.length,
    assetBytes,
    inkIndexedPages,
    estimatedBytes,
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} Go`
}
