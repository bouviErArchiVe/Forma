import { db, createEmptyPage } from '../db'
import { createId } from './id'
import JSZip from 'jszip'
import { exportLibraryFormaPackage, importAssetsFromZip, importFormaPackage } from './forma-package'
import { seedImportedPageThumbnails } from './forma-thumbnails'
import type { FormaLibraryPayload } from './forma-package'
import type { ImportFormaResult } from './forma-package'
import type {
  AudioRecording,
  Folder,
  Notebook,
  Page,
  PageSnapshot,
  ShareLink,
  StudyCard,
} from '../types'
import { confirm } from '../stores/confirmStore'
import { appendSaveJournalEvent } from './save-journal'
import { formatValidationSummary } from './forma-validate'
import { backfillMissingPdfText } from './pdf-backfill'
import { normalizePage } from '../types'
import { putAsset } from './assets'

/** Export .forma : données IndexedDB + blobs assets. Vignettes UI (thumb-queue) exclues — régénérées localement. */

export const BACKUP_VERSION = 4

export type ImportBackupMode = 'replace' | 'merge'

export interface ImportBackupResult {
  notebooks: number
  pages: number
  skippedPages: number
  validationSummary?: string
  /** Carnets importés sous un nouvel id (conflit d’id local). */
  remappedNotebooks?: number
  /** Pages importées sous un nouvel id (conflit d’id local). */
  remappedPages?: number
  /** Assets importés sous un nouvel id (conflit d’id local). */
  remappedAssets?: number
  /** Nom du fichier .forma téléchargé avant un remplacement (mode replace). */
  preReplaceBackupFilename?: string
  /** Journal court des étapes import (diagnostic UI / tests). */
  importLog?: string[]
}

export interface FormaBackup {
  version: number
  exportedAt: number
  folders: Folder[]
  notebooks: Notebook[]
  pages: Page[]
  audio: AudioRecording[]
  studyCards: StudyCard[]
  shareLinks: ShareLink[]
  pageSnapshots?: PageSnapshot[]
}

async function collectLibraryData(notebookIds?: Set<string>): Promise<{
  folders: Folder[]
  notebooks: Notebook[]
  pages: Page[]
  audio: AudioRecording[]
  studyCards: StudyCard[]
  shareLinks: ShareLink[]
  pageSnapshots: PageSnapshot[]
}> {
  const allNotebooks = await db.notebooks.toArray()
  const notebooks =
    notebookIds ?
      allNotebooks.filter((n) => notebookIds.has(n.id))
    : allNotebooks
  const nbIds = new Set(notebooks.map((n) => n.id))
  const pages = (await db.pages.toArray())
    .filter((p) => nbIds.has(p.notebookId))
    .map(normalizePage)
  const pageIds = new Set(pages.map((p) => p.id))
  return {
    folders: notebookIds ? [] : await db.folders.toArray(),
    notebooks,
    pages,
    audio: (await db.audio.toArray()).filter((a) => nbIds.has(a.notebookId)),
    studyCards: (await db.studyCards.toArray()).filter((c) => nbIds.has(c.notebookId)),
    shareLinks: (await db.shareLinks.toArray()).filter((l) => nbIds.has(l.notebookId)),
    pageSnapshots: (await db.pageSnapshots.toArray()).filter((s) => pageIds.has(s.pageId)),
  }
}

export async function exportFullBackup(): Promise<Blob> {
  return exportLibraryFormaPackage(await collectLibraryData())
}

export async function exportSelectedNotebooks(notebookIds: string[]): Promise<Blob> {
  return exportLibraryFormaPackage(await collectLibraryData(new Set(notebookIds)))
}

export async function downloadSelectedNotebooks(notebookIds: string[]): Promise<void> {
  const blob = await exportSelectedNotebooks(notebookIds)
  triggerDownload(blob, `forma-selection-${notebookIds.length}.forma.zip`)
}

export async function downloadBackup(): Promise<void> {
  const blob = await exportFullBackup()
  const name = `forma-backup-${new Date().toISOString().slice(0, 10)}.forma.zip`
  triggerDownload(blob, name)
}

/** Nom horodaté pour la sauvegarde auto avant remplacement. */
export function formatPreReplaceBackupFilename(at = Date.now()): string {
  const stamp = new Date(at).toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `forma-pre-replace-${stamp}.forma.zip`
}

export async function downloadPreReplaceBackup(): Promise<string> {
  const blob = await exportFullBackup()
  const name = formatPreReplaceBackupFilename()
  triggerDownload(blob, name)
  return name
}

export async function importBackupFile(
  file: File,
  options?: { confirmed?: boolean; mode?: ImportBackupMode },
): Promise<ImportBackupResult> {
  const mode = options?.mode ?? 'replace'

  const importLog: string[] = [`mode=${mode}`, `file=${file.name}`]

  if (!options?.confirmed) {
    if (mode === 'merge') {
      const ok = await confirm(
        'Les carnets du fichier seront ajoutés à votre bibliothèque. Si un identifiant existe déjà localement, ce carnet sera importé sous un nouvel identifiant (contenu conservé).',
        {
          title: 'Fusionner avec la bibliothèque ?',
          confirmLabel: 'Importer et fusionner',
        },
      )
      if (!ok) throw new Error('Import annulé')
    } else {
      const backupName = formatPreReplaceBackupFilename()
      const ok = await confirm(
        `Un fichier « ${backupName} » sera téléchargé automatiquement, puis toutes les données locales seront effacées et remplacées par le fichier choisi.`,
        {
          title: 'Remplacer toute la bibliothèque ?',
          confirmLabel: 'Sauvegarder et remplacer',
          danger: true,
        },
      )
      if (!ok) throw new Error('Import annulé')
    }
  }

  let preReplaceBackupFilename: string | undefined
  if (mode === 'replace') {
    preReplaceBackupFilename = await downloadPreReplaceBackup()
  }

  const buffer = await file.arrayBuffer()
  const isZip = file.name.endsWith('.zip') || file.type.includes('zip')
  const zip = isZip ? await JSZip.loadAsync(buffer) : null
  const { data, result, thumbnails } = await importFormaPackage(
    new File([buffer], file.name, { type: file.type }),
    zip ? { zip } : undefined,
  )
  if (!data.notebooks.length) throw new Error('Sauvegarde vide ou invalide')

  const validationSummary = formatValidationSummary(result.validationIssues)

  importLog.push('forma_parsed', `notebooks=${data.notebooks.length}`, `pages=${data.pages.length}`)

  if (mode === 'merge') {
    const merged = await mergeImportLibrary(data, zip, result.format)
    importLog.push(
      `merged_notebooks=${merged.notebooks}`,
      `merged_pages=${merged.pages}`,
      `remapped_nb=${merged.remapped}`,
    )
    await backfillMissingPdfText()
    if (thumbnails?.size) {
      seedImportedPageThumbnails(thumbnails, await db.pages.toArray())
      importLog.push(`thumbnails_seeded=${thumbnails.size}`)
    }
    appendSaveJournalEvent({
      type: 'import_backup',
      at: Date.now(),
      notebooks: merged.notebooks,
    })
    return {
      notebooks: merged.notebooks,
      pages: merged.pages,
      skippedPages: result.skippedPages,
      remappedNotebooks: merged.remapped,
      remappedPages: merged.remappedPages,
      remappedAssets: merged.remappedAssets,
      validationSummary: validationSummary || undefined,
      importLog,
    }
  }

  await db.transaction(
    'rw',
    [
      db.folders,
      db.notebooks,
      db.pages,
      db.audio,
      db.studyCards,
      db.shareLinks,
      db.pageSnapshots,
      db.assets,
    ],
    async () => {
      await db.folders.clear()
      await db.notebooks.clear()
      await db.pages.clear()
      await db.audio.clear()
      await db.studyCards.clear()
      await db.shareLinks.clear()
      await db.pageSnapshots.clear()
      await db.assets.clear()
      await db.folders.bulkAdd(data.folders)
      await db.notebooks.bulkAdd(data.notebooks)
      await db.pages.bulkAdd(data.pages)
      await db.audio.bulkAdd(data.audio)
      await db.studyCards.bulkAdd(data.studyCards)
      await db.shareLinks.bulkAdd(data.shareLinks)
      await db.pageSnapshots.bulkAdd(data.pageSnapshots)
    },
  )
  if (zip && (result.format === 'forma-v1' || result.format === 'forma-v2')) {
    await importAssetsFromZip(zip, new Set(data.notebooks.map((n) => n.id)), data)
  }
  await backfillMissingPdfText()
  if (thumbnails?.size) {
    seedImportedPageThumbnails(thumbnails, await db.pages.toArray())
    importLog.push(`thumbnails_seeded=${thumbnails.size}`)
  }
  appendSaveJournalEvent({
    type: 'import_backup',
    at: Date.now(),
    notebooks: result.notebooks,
  })
  importLog.push('replace_complete')
  return {
    notebooks: result.notebooks,
    pages: result.pages,
    skippedPages: result.skippedPages,
    preReplaceBackupFilename,
    validationSummary: validationSummary || undefined,
    importLog,
  }
}

async function mergeImportLibrary(
  data: FormaLibraryPayload,
  zip: JSZip | null,
  format: ImportFormaResult['format'],
): Promise<{
  notebooks: number
  pages: number
  remapped: number
  remappedPages: number
  remappedAssets: number
}> {
  const existingFolderIds = new Set((await db.folders.toArray()).map((f) => f.id))
  const existingNotebookIds = new Set((await db.notebooks.toArray()).map((n) => n.id))

  const newFolders = data.folders.filter((f) => !existingFolderIds.has(f.id))
  if (newFolders.length) await db.folders.bulkAdd(newFolders)

  let assetRemap = new Map<string, string>()
  let remappedAssets = 0
  if (zip && (format === 'forma-v1' || format === 'forma-v2')) {
    const mergedAssets = await importMergeAssetsFromZip(
      zip,
      data,
      new Set(data.notebooks.map((n) => n.id)),
    )
    assetRemap = mergedAssets.remap
    remappedAssets = mergedAssets.remapped
  }

  let notebooks = 0
  let pages = 0
  let remapped = 0
  let remappedPages = 0

  for (const nb of data.notebooks) {
    if (existingNotebookIds.has(nb.id)) {
      remapped++
      const nbId = await importNotebookCloneFromData(data, nb, nb.folderId, assetRemap)
      notebooks++
      pages += await db.pages.where('notebookId').equals(nbId).count()
    } else {
      const slice = await addNotebookSliceDirect(data, nb, assetRemap)
      remappedPages += slice.remappedPages
      notebooks++
      pages += data.pages.filter((p) => p.notebookId === nb.id).length
    }
  }

  return { notebooks, pages, remapped, remappedPages, remappedAssets }
}

function mimeFromExt(ext: string): string {
  if (ext === 'png') return 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webm') return 'audio/webm'
  if (ext === 'pdf') return 'application/pdf'
  return 'application/octet-stream'
}

function sniffMime(buf: ArrayBuffer): string | null {
  const b = new Uint8Array(buf.slice(0, 12))
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b[0] === 0xff && b[1] === 0xd8) return 'image/jpeg'
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf'
  return null
}

function buildIncomingAssetNotebookMap(data: FormaLibraryPayload): Map<string, string> {
  const map = new Map<string, string>()
  for (const nb of data.notebooks) {
    if (nb.pdfSourceAssetId) map.set(nb.pdfSourceAssetId, nb.id)
  }
  for (const p of data.pages) {
    const page = normalizePage(p)
    if (page.pdfAssetId) map.set(page.pdfAssetId, page.notebookId)
    for (const img of page.images) {
      if (img.assetId) map.set(img.assetId, page.notebookId)
    }
  }
  for (const a of data.audio) {
    if (a.assetId) map.set(a.assetId, a.notebookId)
  }
  return map
}

async function importMergeAssetsFromZip(
  zip: JSZip,
  data: FormaLibraryPayload,
  notebookIds: Set<string>,
): Promise<{ remap: Map<string, string>; remapped: number }> {
  const existingIds = new Set((await db.assets.toArray()).map((a) => a.id))
  const assetNb = buildIncomingAssetNotebookMap(data)
  const remap = new Map<string, string>()
  let remapped = 0
  const defaultNb = [...notebookIds][0] ?? 'unknown'

  for (const path of Object.keys(zip.files)) {
    if (!path.startsWith('assets/blobs/') || path.endsWith('/')) continue
    const f = zip.file(path)
    if (!f) continue
    const fileName = path.split('/').pop() ?? ''
    const id = fileName.replace(/\.[^.]+$/, '')
    const notebookId = assetNb.get(id) ?? defaultNb
    const buf = await f.async('arraybuffer')
    const ext = fileName.split('.').pop() ?? 'bin'
    const mime = sniffMime(buf) ?? mimeFromExt(ext)

    if (existingIds.has(id)) {
      const newId = createId()
      await putAsset(newId, notebookId, new Blob([buf], { type: mime }), mime)
      remap.set(id, newId)
      remapped++
    } else {
      await putAsset(id, notebookId, new Blob([buf], { type: mime }), mime)
      existingIds.add(id)
    }
  }

  return { remap, remapped }
}

function applyAssetRemapToPage(page: Page, assetRemap: Map<string, string>): Page {
  let pdfAssetId = page.pdfAssetId
  if (pdfAssetId && assetRemap.has(pdfAssetId)) pdfAssetId = assetRemap.get(pdfAssetId)
  const images = page.images.map((img) =>
    img.assetId && assetRemap.has(img.assetId) ?
      { ...img, assetId: assetRemap.get(img.assetId) }
    : img,
  )
  return pdfAssetId === page.pdfAssetId && images === page.images ?
      page
    : { ...page, pdfAssetId, images }
}

function applyAssetRemapToNotebook(nb: Notebook, assetRemap: Map<string, string>): Notebook {
  if (nb.pdfSourceAssetId && assetRemap.has(nb.pdfSourceAssetId)) {
    return { ...nb, pdfSourceAssetId: assetRemap.get(nb.pdfSourceAssetId) }
  }
  return nb
}

async function addNotebookSliceDirect(
  data: FormaLibraryPayload,
  nb: Notebook,
  assetRemap: Map<string, string>,
): Promise<{ remappedPages: number }> {
  const existingPageIds = new Set((await db.pages.toArray()).map((p) => p.id))
  const pageIdMap = new Map<string, string>()
  let remappedPages = 0

  await db.notebooks.add(applyAssetRemapToNotebook(nb, assetRemap))

  const nbPagesRaw = data.pages.filter((p) => p.notebookId === nb.id).map(normalizePage)
  const nbPages: Page[] = []
  for (const raw of nbPagesRaw) {
    const mapped = applyAssetRemapToPage(raw, assetRemap)
    const origPageId = mapped.id
    let pageId = origPageId
    if (existingPageIds.has(pageId)) {
      pageId = createId()
      pageIdMap.set(origPageId, pageId)
      remappedPages++
    }
    nbPages.push({
      ...mapped,
      id: pageId,
      strokes: mapped.strokes.map((s) => ({ ...s, pageId })),
      shapes: mapped.shapes.map((s) => ({ ...s, pageId })),
      texts: mapped.texts.map((t) => ({ ...t, pageId })),
      images: mapped.images.map((i) => ({ ...i, pageId })),
      stickers: mapped.stickers.map((s) => ({ ...s, pageId })),
      tapes: mapped.tapes.map((t) => ({ ...t, pageId })),
    })
    existingPageIds.add(pageId)
  }
  if (nbPages.length) await db.pages.bulkAdd(nbPages)

  const audio = data.audio
    .filter((a) => a.notebookId === nb.id)
    .map((a) => ({
      ...a,
      assetId: a.assetId && assetRemap.has(a.assetId) ? assetRemap.get(a.assetId) : a.assetId,
    }))
  if (audio.length) await db.audio.bulkAdd(audio)

  const cards = data.studyCards.filter((c) => c.notebookId === nb.id)
  if (cards.length) await db.studyCards.bulkAdd(cards)

  const links = data.shareLinks.filter((l) => l.notebookId === nb.id)
  if (links.length) await db.shareLinks.bulkAdd(links)

  const origPageIds = new Set(nbPagesRaw.map((p) => p.id))
  const snaps = data.pageSnapshots
    .filter((s) => origPageIds.has(s.pageId))
    .map((s) => {
      const newPageId = pageIdMap.get(s.pageId) ?? s.pageId
      const snapData = applyAssetRemapToPage(normalizePage(s.data), assetRemap)
      return {
        ...s,
        id: createId(),
        pageId: newPageId,
        data: { ...snapData, id: newPageId, notebookId: nb.id },
      }
    })
  if (snaps.length) await db.pageSnapshots.bulkAdd(snaps)

  return { remappedPages }
}

/** Clone un carnet importé sous un nouvel id (assets déjà présents dans IndexedDB). */
async function importNotebookCloneFromData(
  data: FormaLibraryPayload,
  nb0: Notebook,
  folderId: string | null,
  assetRemap: Map<string, string> = new Map(),
): Promise<string> {
  const { cloneAsset } = await import('./assets')
  const assetClone = new Map<string, string>()
  const nbId = createId()
  const srcAssetId = (id: string) => assetRemap.get(id) ?? id

  const cloneImgAsset = async (oldAssetId: string | undefined, newImageId: string) => {
    if (!oldAssetId) return undefined
    const hit = assetClone.get(oldAssetId)
    if (hit) return hit
    await cloneAsset(srcAssetId(oldAssetId), newImageId, nbId)
    assetClone.set(oldAssetId, newImageId)
    return newImageId
  }

  let pdfSourceAssetId = nb0.pdfSourceAssetId
  if (pdfSourceAssetId) {
    const newSrcId = `${nbId}-pdf-source`
    if (await cloneAsset(srcAssetId(pdfSourceAssetId), newSrcId, nbId)) pdfSourceAssetId = newSrcId
  }

  const nb: Notebook = {
    ...nb0,
    id: nbId,
    folderId,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    pdfSourceAssetId,
    pdfSourceDataUrl: pdfSourceAssetId ? undefined : nb0.pdfSourceDataUrl,
  }
  await db.notebooks.add(nb)
  const pageIdMap = new Map<string, string>()

  for (const c of data.studyCards.filter((c) => c.notebookId === nb0.id)) {
    await db.studyCards.add({ ...c, id: createId(), notebookId: nbId })
  }
  for (const a of data.audio.filter((a) => a.notebookId === nb0.id)) {
    const newAudioId = createId()
    let assetId = a.assetId
    if (assetId) {
      const newAssetId = newAudioId
      if (!assetClone.has(assetId)) {
        await cloneAsset(srcAssetId(assetId), newAssetId, nbId)
        assetClone.set(assetId, newAssetId)
      }
      assetId = assetClone.get(assetId) ?? newAssetId
    }
    await db.audio.add({
      ...a,
      id: newAudioId,
      notebookId: nbId,
      assetId,
      dataUrl: assetId ? undefined : a.dataUrl,
    })
  }
  for (const p of data.pages.filter((p) => p.notebookId === nb0.id).map(normalizePage)) {
    const newPageId = createId()
    pageIdMap.set(p.id, newPageId)
    let pdfAssetId = p.pdfAssetId
    if (pdfAssetId) {
      const rasterId = `${newPageId}-pdf-raster`
      await cloneAsset(srcAssetId(pdfAssetId), rasterId, nbId)
      pdfAssetId = rasterId
    }
    await db.pages.add(
      createEmptyPage({
        ...p,
        id: newPageId,
        notebookId: nbId,
        pdfDataUrl: undefined,
        pdfAssetId,
        strokes: p.strokes.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
        shapes: p.shapes.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
        texts: p.texts.map((t) => ({ ...t, id: createId(), pageId: newPageId })),
        images: await Promise.all(
          p.images.map(async (i) => {
            const newImageId = createId()
            const assetId = await cloneImgAsset(i.assetId, newImageId)
            return {
              ...i,
              id: newImageId,
              pageId: newPageId,
              assetId,
              dataUrl: assetId ? undefined : i.dataUrl,
            }
          }),
        ),
        stickers: p.stickers.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
        tapes: p.tapes.map((t) => ({ ...t, id: createId(), pageId: newPageId })),
      }),
    )
  }
  for (const snap of data.pageSnapshots) {
    const newPageId = pageIdMap.get(snap.pageId)
    if (!newPageId) continue
    const snapData = normalizePage(snap.data)
    let snapPdfAssetId = snapData.pdfAssetId
    if (snapPdfAssetId) {
      const rasterId = `${newPageId}-snap-pdf`
      await cloneAsset(srcAssetId(snapPdfAssetId), rasterId, nbId)
      snapPdfAssetId = rasterId
    }
    await db.pageSnapshots.add({
      ...snap,
      id: createId(),
      pageId: newPageId,
      data: {
        ...snapData,
        id: newPageId,
        notebookId: nbId,
        pdfAssetId: snapPdfAssetId,
        pdfDataUrl: snapPdfAssetId ? undefined : snapData.pdfDataUrl,
        images: await Promise.all(
          snapData.images.map(async (i) => {
            const newImageId = createId()
            const assetId = await cloneImgAsset(i.assetId, newImageId)
            return {
              ...i,
              id: newImageId,
              pageId: newPageId,
              assetId,
              dataUrl: assetId ? undefined : i.dataUrl,
            }
          }),
        ),
      },
    })
  }
  return nbId
}

export async function exportNotebookZip(notebookId: string, notebookName: string): Promise<void> {
  const blob = await exportLibraryFormaPackage(await collectLibraryData(new Set([notebookId])))
  triggerDownload(blob, `${notebookName}.forma.zip`)
}

export async function importNotebookZip(file: File, folderId: string | null): Promise<string> {
  const buffer = await file.arrayBuffer()
  const isZip = file.name.endsWith('.zip') || file.type.includes('zip')
  const zip = isZip ? await JSZip.loadAsync(buffer) : null
  const { data, result, thumbnails } = await importFormaPackage(
    new File([buffer], file.name, { type: file.type }),
    zip ? { zip } : undefined,
  )
  const nb0 = data.notebooks[0]
  if (!nb0) throw new Error('Carnet introuvable dans l’archive')

  if (zip && (result.format === 'forma-v1' || result.format === 'forma-v2')) {
    await importAssetsFromZip(zip, new Set([nb0.id]), data)
  }

  const nbId = await importNotebookCloneFromData(data, nb0, folderId)
  if (thumbnails?.size) {
    seedImportedPageThumbnails(thumbnails, await db.pages.where('notebookId').equals(nbId).toArray())
  }
  return nbId
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
