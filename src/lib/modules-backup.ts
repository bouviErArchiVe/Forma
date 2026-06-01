/**
 * Sauvegarde des modules Forma (.formamods.zip) — complète le backup .forma
 * (qui ne couvre que carnets/pages/assets) en exportant les tables modules :
 * FormaDoc, FormaTab, FormaPresent, FormatCal, FormaReview, FormaCombine,
 * Moodboard, FormaLibrary et Formules (favoris, récents, historique), plus les
 * réglages et préférences locales.
 *
 * 100 % local : aucune donnée ne quitte l'appareil.
 */
import JSZip from 'jszip'
import { db } from '../db'
import { putAsset, readBlobBytes } from './assets'
import { APP_VERSION } from './version'
import type {
  FormaCalEvent,
  FormaCombineProject,
  FormaDeck,
  FormaDocument,
  FormaReviewSession,
  FormaSheet,
  MoodboardBoard,
  MoodboardImage,
} from '../types'
import type { LibraryFolder, LibraryItem } from './formalibrary/model'

export const MODULES_BACKUP_VERSION = 1

/** Clés localStorage des préférences modules à sauvegarder. */
export const MODULE_PREF_KEYS = [
  'forma-focus-prefs',
  'forma_alarm',
  'forma-dico-prefs',
  'forma-dico-cache-v1',
  'forma-formula-prefs',
  'forma-formula-history',
] as const

export type ModulesBackupMode = 'replace' | 'merge'

/** Item bibliothèque sérialisé (blob exporté à part dans le ZIP). */
type SerializedLibraryItem = Omit<LibraryItem, 'blob'> & { blobRef?: string }

interface ModulesManifest {
  version: number
  appVersion: string
  exportedAt: number
  formaDocuments: FormaDocument[]
  formaSheets: FormaSheet[]
  formaDecks: FormaDeck[]
  formaCalEvents: FormaCalEvent[]
  formaReviewSessions: FormaReviewSession[]
  formaCombineProjects: FormaCombineProject[]
  moodboardBoards: MoodboardBoard[]
  moodboardImages: MoodboardImage[]
  libraryFolders: LibraryFolder[]
  libraryItems: SerializedLibraryItem[]
  settings: { key: string; value: string }[]
  prefs: Record<string, string>
}

export interface ModulesBackupCounts {
  formaDocuments: number
  formaSheets: number
  formaDecks: number
  formaCalEvents: number
  formaReviewSessions: number
  formaCombineProjects: number
  moodboardBoards: number
  moodboardImages: number
  libraryFolders: number
  libraryItems: number
}

function extFromMime(mime: string): string {
  if (mime.includes('png')) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  if (mime.includes('svg')) return 'svg'
  if (mime.includes('pdf')) return 'pdf'
  return 'bin'
}

function mimeFromExt(ext: string): string {
  switch (ext) {
    case 'png':
      return 'image/png'
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

function readPrefs(): Record<string, string> {
  const out: Record<string, string> = {}
  try {
    for (const key of MODULE_PREF_KEYS) {
      const v = localStorage.getItem(key)
      if (v != null) out[key] = v
    }
  } catch {
    /* localStorage indisponible */
  }
  return out
}

export async function collectModulesData(): Promise<{
  manifest: ModulesManifest
  libBlobs: Map<string, Blob>
  assetBlobs: Map<string, { blob: Blob; notebookId: string; mimeType: string }>
}> {
  const [
    formaDocuments,
    formaSheets,
    formaDecks,
    formaCalEvents,
    formaReviewSessions,
    formaCombineProjects,
    moodboardBoards,
    moodboardImages,
    libraryFolders,
    libraryItemsRaw,
    settings,
  ] = await Promise.all([
    db.formaDocuments.toArray(),
    db.formaSheets.toArray(),
    db.formaDecks.toArray(),
    db.formaCalEvents.toArray(),
    db.formaReviewSessions.toArray(),
    db.formaCombineProjects.toArray(),
    db.moodboardBoards.toArray(),
    db.moodboardImages.toArray(),
    db.libraryFolders.toArray(),
    db.libraryItems.toArray(),
    db.settings.toArray(),
  ])

  const libBlobs = new Map<string, Blob>()
  const libraryItems: SerializedLibraryItem[] = libraryItemsRaw.map((item) => {
    const { blob, ...rest } = item
    if (blob) {
      const ext = extFromMime(item.mimeType || blob.type || '')
      const ref = `lib-blobs/${item.id}.${ext}`
      libBlobs.set(ref, blob)
      return { ...rest, blobRef: ref }
    }
    return { ...rest }
  })

  // Blobs assets référencés par les images Moodboard.
  const assetBlobs = new Map<string, { blob: Blob; notebookId: string; mimeType: string }>()
  for (const img of moodboardImages) {
    if (!img.assetId || assetBlobs.has(img.assetId)) continue
    const row = await db.assets.get(img.assetId)
    if (row) {
      assetBlobs.set(img.assetId, {
        blob: row.blob,
        notebookId: row.notebookId,
        mimeType: row.mimeType || row.blob.type || '',
      })
    }
  }

  const manifest: ModulesManifest = {
    version: MODULES_BACKUP_VERSION,
    appVersion: APP_VERSION,
    exportedAt: Date.now(),
    formaDocuments,
    formaSheets,
    formaDecks,
    formaCalEvents,
    formaReviewSessions,
    formaCombineProjects,
    moodboardBoards,
    moodboardImages,
    libraryFolders,
    libraryItems,
    settings,
    prefs: readPrefs(),
  }

  return { manifest, libBlobs, assetBlobs }
}

export async function exportModulesBundle(): Promise<Blob> {
  const { manifest, libBlobs, assetBlobs } = await collectModulesData()
  const zip = new JSZip()
  zip.file('modules.json', JSON.stringify(manifest))
  for (const [ref, blob] of libBlobs) {
    zip.file(ref, await readBlobBytes(blob))
  }
  for (const [id, { blob, mimeType }] of assetBlobs) {
    const ext = extFromMime(mimeType || blob.type || '')
    zip.file(`assets/${id}.${ext}`, await readBlobBytes(blob))
  }
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })
}

export function modulesBackupCounts(manifest: Pick<ModulesManifest, keyof ModulesBackupCounts>): ModulesBackupCounts {
  return {
    formaDocuments: manifest.formaDocuments.length,
    formaSheets: manifest.formaSheets.length,
    formaDecks: manifest.formaDecks.length,
    formaCalEvents: manifest.formaCalEvents.length,
    formaReviewSessions: manifest.formaReviewSessions.length,
    formaCombineProjects: manifest.formaCombineProjects.length,
    moodboardBoards: manifest.moodboardBoards.length,
    moodboardImages: manifest.moodboardImages.length,
    libraryFolders: manifest.libraryFolders.length,
    libraryItems: manifest.libraryItems.length,
  }
}

function restorePrefs(prefs: Record<string, string>): void {
  try {
    for (const [key, value] of Object.entries(prefs || {})) {
      if ((MODULE_PREF_KEYS as readonly string[]).includes(key)) {
        localStorage.setItem(key, value)
      }
    }
  } catch {
    /* quota / indisponible */
  }
}

export async function importModulesBundle(
  file: File | Blob,
  mode: ModulesBackupMode = 'merge',
): Promise<ModulesBackupCounts> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer())
  const manifestFile = zip.file('modules.json')
  if (!manifestFile) throw new Error('Archive modules invalide (modules.json manquant)')
  const manifest = JSON.parse(await manifestFile.async('string')) as ModulesManifest

  // Reconstitue les blobs des items bibliothèque.
  const items: LibraryItem[] = await Promise.all(
    (manifest.libraryItems || []).map(async (raw) => {
      const { blobRef, ...rest } = raw
      const out = { ...rest } as LibraryItem
      if (blobRef) {
        const f = zip.file(blobRef)
        if (f) {
          const ext = blobRef.split('.').pop() || 'bin'
          const buf = await f.async('arraybuffer')
          out.blob = new Blob([buf], { type: out.mimeType || mimeFromExt(ext) })
        }
      }
      return out
    }),
  )

  // Restaure les blobs assets (Moodboard) dans la table assets.
  for (const path of Object.keys(zip.files)) {
    if (!path.startsWith('assets/') || path.endsWith('/')) continue
    const f = zip.file(path)
    if (!f) continue
    const fileName = path.split('/').pop() as string
    const id = fileName.replace(/\.[^.]+$/, '')
    const ext = fileName.split('.').pop() || 'bin'
    const mime = mimeFromExt(ext)
    const img = manifest.moodboardImages.find((m) => m.assetId === id)
    const notebookId = img ? `moodboard:${img.boardId}` : 'moodboard'
    if (mode === 'merge' && (await db.assets.get(id))) continue
    const buf = await f.async('arraybuffer')
    await putAsset(id, notebookId, new Blob([buf], { type: mime }), mime)
  }

  const tables = [
    db.formaDocuments,
    db.formaSheets,
    db.formaDecks,
    db.formaCalEvents,
    db.formaReviewSessions,
    db.formaCombineProjects,
    db.moodboardBoards,
    db.moodboardImages,
    db.libraryFolders,
    db.libraryItems,
    db.settings,
  ]

  await db.transaction('rw', tables, async () => {
    if (mode === 'replace') {
      await Promise.all(tables.map((t) => t.clear()))
      await db.formaDocuments.bulkPut(manifest.formaDocuments)
      await db.formaSheets.bulkPut(manifest.formaSheets)
      await db.formaDecks.bulkPut(manifest.formaDecks)
      await db.formaCalEvents.bulkPut(manifest.formaCalEvents)
      await db.formaReviewSessions.bulkPut(manifest.formaReviewSessions)
      await db.formaCombineProjects.bulkPut(manifest.formaCombineProjects)
      await db.moodboardBoards.bulkPut(manifest.moodboardBoards)
      await db.moodboardImages.bulkPut(manifest.moodboardImages)
      await db.libraryFolders.bulkPut(manifest.libraryFolders)
      await db.libraryItems.bulkPut(items)
      await db.settings.bulkPut(manifest.settings || [])
    } else {
      await mergePut(db.formaDocuments, manifest.formaDocuments)
      await mergePut(db.formaSheets, manifest.formaSheets)
      await mergePut(db.formaDecks, manifest.formaDecks)
      await mergePut(db.formaCalEvents, manifest.formaCalEvents)
      await mergePut(db.formaReviewSessions, manifest.formaReviewSessions)
      await mergePut(db.formaCombineProjects, manifest.formaCombineProjects)
      await mergePut(db.moodboardBoards, manifest.moodboardBoards)
      await mergePut(db.moodboardImages, manifest.moodboardImages)
      await mergePut(db.libraryFolders, manifest.libraryFolders)
      await mergePut(db.libraryItems, items)
      await mergePut(db.settings, manifest.settings || [], 'key')
    }
  })

  if (mode === 'replace') restorePrefs(manifest.prefs)

  return modulesBackupCounts(manifest)
}

async function mergePut<T>(
  table: { get: (k: string) => Promise<T | undefined>; add: (v: T) => Promise<unknown> },
  rows: T[],
  keyField: 'id' | 'key' = 'id',
): Promise<void> {
  for (const row of rows) {
    const key = (row as Record<string, string>)[keyField]
    if (key == null) continue
    if (await table.get(key)) continue
    await table.add(row)
  }
}
