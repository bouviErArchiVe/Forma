import Dexie, { type Table } from 'dexie'
import type { StoredAsset } from '../lib/assets'
import { runDexieDataUrlMigrationTx, runDexiePdfSourceMigrationTx } from '../lib/dataurl-migration'
import type {
  AudioRecording,
  Folder,
  Notebook,
  Page,
  PageSnapshot,
  ShareLink,
  StudyCard,
} from '../types'
import { emptyPageFields, normalizePage } from '../types'

export interface ThumbnailEntry {
  pageId: string
  notebookId: string
  dataUrl: string
  updatedAt: number
}

/**
 * Schéma Dexie (forma) — historique :
 * v1 : folders, notebooks, pages
 * v2 : audio, studyCards, shareLinks, settings + normalizePage sur pages
 * v3 : stickers[] par défaut sur pages
 * v4 : pageSnapshots
 * v5 : table assets (blobs) — pas de migration inline→blob au schéma
 * v6 : upgrade dataURL→blob + index pdfAssetId sur pages
 * v7 : migration pdfSourceDataUrl carnet → assets + index pdfSourceAssetId
 * v8 : table thumbnails (cache miniatures IndexedDB)
 *
 * Champs temporels (gaps connus, non bloquants pour l’index Dexie) :
 * - Page : id ✓ — pas de createdAt/updatedAt (ordre via `order`, pas d’historique row)
 * - StoredAsset : id, createdAt ✓ — pas d’updatedAt (blob immuable)
 * - AudioRecording, StudyCard, ShareLink, PageSnapshot : id + createdAt ✓
 * - Folder, Notebook : id + createdAt + updatedAt ✓
 */
export class FormaDatabase extends Dexie {
  folders!: Table<Folder>
  notebooks!: Table<Notebook>
  pages!: Table<Page>
  audio!: Table<AudioRecording>
  studyCards!: Table<StudyCard>
  shareLinks!: Table<ShareLink>
  pageSnapshots!: Table<PageSnapshot>
  assets!: Table<StoredAsset>
  settings!: Table<{ key: string; value: string }>
  thumbnails!: Table<ThumbnailEntry, string>

  constructor() {
    super('forma')
    this.version(1).stores({
      folders: 'id, parentId, name, updatedAt',
      notebooks: 'id, folderId, name, updatedAt, favorite',
      pages: 'id, notebookId, order',
    })
    this.version(2)
      .stores({
        folders: 'id, parentId, name, updatedAt',
        notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
        pages: 'id, notebookId, order',
        audio: 'id, notebookId, createdAt',
        studyCards: 'id, notebookId, nextReview',
        shareLinks: 'id, notebookId, token',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await tx
          .table('pages')
          .toCollection()
          .modify((page: Page) => {
            const n = normalizePage(page)
            page.strokes = n.strokes
            page.shapes = n.shapes
            page.texts = n.texts
            page.images = n.images
            page.tapes = n.tapes
          })
      })
    this.version(3).upgrade(async (tx) => {
      await tx
        .table('pages')
        .toCollection()
        .modify((page: Page) => {
          page.stickers = page.stickers ?? []
        })
    })
    this.version(4).stores({
      folders: 'id, parentId, name, updatedAt',
      notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
      pages: 'id, notebookId, order',
      audio: 'id, notebookId, createdAt',
      studyCards: 'id, notebookId, nextReview',
      shareLinks: 'id, notebookId, token',
      pageSnapshots: 'id, pageId, createdAt',
      settings: 'key',
    })
    this.version(5).stores({
      folders: 'id, parentId, name, updatedAt',
      notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
      pages: 'id, notebookId, order',
      audio: 'id, notebookId, createdAt',
      studyCards: 'id, notebookId, nextReview',
      shareLinks: 'id, notebookId, token',
      pageSnapshots: 'id, pageId, createdAt',
      assets: 'id, notebookId, createdAt',
      settings: 'key',
    })
    this.version(6)
      .stores({
        folders: 'id, parentId, name, updatedAt',
        notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
        pages: 'id, notebookId, order, pdfAssetId',
        audio: 'id, notebookId, createdAt',
        studyCards: 'id, notebookId, nextReview',
        shareLinks: 'id, notebookId, token',
        pageSnapshots: 'id, pageId, createdAt',
        assets: 'id, notebookId, createdAt',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await runDexieDataUrlMigrationTx(tx)
      })
    this.version(7)
      .stores({
        folders: 'id, parentId, name, updatedAt',
        notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt, pdfSourceAssetId',
        pages: 'id, notebookId, order, pdfAssetId',
        audio: 'id, notebookId, createdAt',
        studyCards: 'id, notebookId, nextReview',
        shareLinks: 'id, notebookId, token',
        pageSnapshots: 'id, pageId, createdAt',
        assets: 'id, notebookId, createdAt',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await runDexiePdfSourceMigrationTx(tx)
      })
    this.version(8).stores({
      folders: 'id, parentId, name, updatedAt',
      notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt, pdfSourceAssetId',
      pages: 'id, notebookId, order, pdfAssetId',
      audio: 'id, notebookId, createdAt',
      studyCards: 'id, notebookId, nextReview',
      shareLinks: 'id, notebookId, token',
      pageSnapshots: 'id, pageId, createdAt',
      assets: 'id, notebookId, createdAt',
      settings: 'key',
      thumbnails: 'pageId, notebookId, updatedAt',
    })
    // v9 : FormaDoc inline base64 images → assets table (lazy migration at load time)
    // No schema change needed — migration happens on-the-fly in FormaDocPage via
    // extractInlineImagesToAssets + resolveAssetImages. No batch upgrade here.
    this.version(9).upgrade(async (_tx) => {
      // Intentionally empty — lazy migration strategy
    })
    // v10 : Add updatedAt index on pages for recency queries
    this.version(10).stores({
      folders: 'id, parentId, name, updatedAt',
      notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt, pdfSourceAssetId',
      pages: 'id, notebookId, order, pdfAssetId, updatedAt',
      audio: 'id, notebookId, createdAt',
      studyCards: 'id, notebookId, nextReview',
      shareLinks: 'id, notebookId, token',
      pageSnapshots: 'id, pageId, createdAt',
      assets: 'id, notebookId, createdAt',
      settings: 'key',
      thumbnails: 'pageId, notebookId, updatedAt',
    })
  }
}

/** Version Dexie courante (tests / diagnostics). */
export const FORMA_DB_VERSION = 10

export const db = new FormaDatabase()

export function createEmptyPage(
  partial: Omit<Page, keyof ReturnType<typeof emptyPageFields>> &
    Partial<Pick<Page, 'strokes' | 'shapes' | 'texts' | 'images' | 'stickers' | 'tapes'>>,
): Page {
  return normalizePage({ ...emptyPageFields(), ...partial })
}
