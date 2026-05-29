import { db } from '../db'
import { createEmptyPage } from '../db'
import { createId } from '../lib/id'
import { estimateNotebookBytes } from '../lib/library-views'
import { pruneRecentPagesForNotebook } from '../lib/recent-pages'
import { subjectLabel, type Subject } from '../lib/subjects'
import type {
  Folder,
  Notebook,
  Orientation,
  PaperTemplate,
  SortBy,
  SortOrder,
} from '../types'
import { normalizePage } from '../types'
import { addPage, getPages } from './pages'
export async function getFolders(parentId: string | null = null): Promise<Folder[]> {
  if (parentId === null) {
    return db.folders.filter((f) => f.parentId === null).toArray()
  }
  return db.folders.where('parentId').equals(parentId).toArray()
}

export async function getNotebooks(folderId: string | null = null): Promise<Notebook[]> {
  const all = await db.notebooks.filter((n) => !n.deletedAt).toArray()
  return all.filter((n) => n.folderId === folderId)
}

export async function getAllNotebooks(includeDeleted = false): Promise<Notebook[]> {
  const all = await db.notebooks.toArray()
  return includeDeleted ? all : all.filter((n) => !n.deletedAt)
}

export async function getTrashNotebooks(): Promise<Notebook[]> {
  return db.notebooks.filter((n) => !!n.deletedAt).toArray()
}

export async function getFavorites(): Promise<Notebook[]> {
  return db.notebooks.filter((n) => !!n.favorite && !n.deletedAt).toArray()
}

export async function createFolder(
  name: string,
  parentId: string | null = null,
  opts?: { emoji?: string; color?: string },
): Promise<Folder> {
  const now = Date.now()
  const folder: Folder = {
    id: createId(),
    parentId,
    name,
    emoji: opts?.emoji,
    color: opts?.color,
    createdAt: now,
    updatedAt: now,
  }
  await db.folders.add(folder)
  return folder
}

export async function updateFolder(
  id: string,
  patch: Partial<Pick<Folder, 'name' | 'emoji' | 'color'>>,
): Promise<void> {
  await db.folders.update(id, { ...patch, updatedAt: Date.now() })
}

export async function createNotebook(opts: {
  name: string
  folderId?: string | null
  coverColor: string
  paperTemplate: PaperTemplate
  orientation: Orientation
}): Promise<Notebook> {
  const now = Date.now()
  const notebook: Notebook = {
    id: createId(),
    folderId: opts.folderId ?? null,
    name: opts.name,
    coverColor: opts.coverColor,
    paperTemplate: opts.paperTemplate,
    orientation: opts.orientation,
    type: 'notebook',
    createdAt: now,
    updatedAt: now,
  }
  await db.notebooks.add(notebook)
  await db.pages.add(
    createEmptyPage({
      id: createId(),
      notebookId: notebook.id,
      order: 0,
      template: opts.paperTemplate,
      rotation: 0,
    }),
  )
  return notebook
}

export async function createWhiteboard(
  name: string,
  folderId: string | null = null,
): Promise<Notebook> {
  return createNotebook({
    name,
    folderId,
    coverColor: '#8b5cf6',
    paperTemplate: 'grid',
    orientation: 'landscape',
  }).then(async (nb) => {
    await db.notebooks.update(nb.id, { type: 'whiteboard' })
    return { ...nb, type: 'whiteboard' as const }
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

export async function createNotebookFromImage(
  name: string,
  folderId: string | null,
  file: File,
): Promise<Notebook> {
  const dataUrl = await fileToDataUrl(file)
  const notebook = await createNotebook({
    name: name.replace(/\.[^.]+$/, '') || 'Image',
    folderId,
    coverColor: '#10b981',
    paperTemplate: 'blank',
    orientation: 'portrait',
  })
  const page = await db.pages.where('notebookId').equals(notebook.id).first()
  if (!page) return notebook
  const w = 320
  const h = 240
  await db.pages.update(page.id, {
    images: [
      {
        id: createId(),
        x: 237,
        y: 441,
        width: w,
        height: h,
        dataUrl,
        pageId: page.id,
      },
    ],
  })
  return notebook
}

export async function createNotebookFromPdf(
  name: string,
  folderId: string | null,
  importedPages: {
    order: number
    template: PaperTemplate
    pdfDataUrl?: string
    pdfPageIndex: number
    pdfText: string
    pdfLinks?: import('../types').PdfLink[]
  }[],
  pdfSourceDataUrl?: string,
): Promise<Notebook> {
  const now = Date.now()
  const notebook: Notebook = {
    id: createId(),
    folderId,
    name,
    coverColor: '#3b82f6',
    paperTemplate: 'blank',
    orientation: 'portrait',
    type: 'pdf',
    createdAt: now,
    updatedAt: now,
    pdfSourceDataUrl,
  }
  await db.notebooks.add(notebook)
  for (const p of importedPages) {
    await db.pages.add(
      createEmptyPage({
        id: createId(),
        notebookId: notebook.id,
        order: p.order,
        template: p.template,
        pdfDataUrl: p.pdfDataUrl,
        pdfPageIndex: p.pdfPageIndex,
        pdfText: p.pdfText,
        pdfLinks: p.pdfLinks ?? [],
        rotation: 0,
      }),
    )
  }
  const { migrateNotebookPdfSource } = await import('../lib/assets')
  await migrateNotebookPdfSource(notebook.id)
  return (await db.notebooks.get(notebook.id)) ?? notebook
}

export async function duplicateNotebook(
  id: string,
  targetFolderId?: string | null,
): Promise<Notebook | null> {
  const nb = await db.notebooks.get(id)
  if (!nb) return null
  const now = Date.now()
  const copyId = createId()
  const copy: Notebook = {
    ...nb,
    id: copyId,
    folderId: targetFolderId !== undefined ? targetFolderId : nb.folderId,
    name: `${nb.name} (copie)`,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    deletedAt: undefined,
    pdfSourceDataUrl: nb.pdfSourceDataUrl,
    pdfSourceAssetId: nb.pdfSourceAssetId,
  }
  const { cloneAsset } = await import('../lib/assets')
  const assetClone = new Map<string, string>()
  if (nb.pdfSourceAssetId) {
    const newSrcId = `${copyId}-pdf-source`
    await cloneAsset(nb.pdfSourceAssetId, newSrcId, copyId)
    copy.pdfSourceAssetId = newSrcId
    copy.pdfSourceDataUrl = undefined
  }
  await db.notebooks.add(copy)
  const pages = await db.pages.where('notebookId').equals(id).toArray()
  for (const p of pages) {
    const newPageId = createId()
    const src = normalizePage(p)
    const cloneImgAsset = async (oldAssetId: string | undefined, newImageId: string) => {
      if (!oldAssetId) return undefined
      const hit = assetClone.get(oldAssetId)
      if (hit) return hit
      await cloneAsset(oldAssetId, newImageId, copyId)
      assetClone.set(oldAssetId, newImageId)
      return newImageId
    }
    let pdfAssetId = src.pdfAssetId
    if (pdfAssetId) {
      const rasterId = `${newPageId}-pdf-raster`
      await cloneAsset(pdfAssetId, rasterId, copyId)
      pdfAssetId = rasterId
    }
    await db.pages.add(
      createEmptyPage({
        ...src,
        id: newPageId,
        notebookId: copyId,
        pdfDataUrl: undefined,
        pdfAssetId,
        strokes: src.strokes.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
        shapes: src.shapes.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
        texts: src.texts.map((t) => ({ ...t, id: createId(), pageId: newPageId })),
        images: await Promise.all(
          src.images.map(async (i) => {
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
        stickers: src.stickers.map((s) => ({ ...s, id: createId(), pageId: newPageId })),
        tapes: src.tapes.map((t) => ({ ...t, id: createId(), pageId: newPageId })),
      }),
    )
  }
  const study = await db.studyCards.where('notebookId').equals(id).toArray()
  for (const c of study) {
    await db.studyCards.add({ ...c, id: createId(), notebookId: copyId })
  }
  const audio = await db.audio.where('notebookId').equals(id).toArray()
  for (const a of audio) {
    const newAudioId = createId()
    let assetId = a.assetId
    if (assetId) {
      const newAssetId = newAudioId
      if (!assetClone.has(assetId)) {
        await cloneAsset(assetId, newAssetId, copyId)
        assetClone.set(assetId, newAssetId)
      }
      assetId = assetClone.get(assetId) ?? newAssetId
    }
    await db.audio.add({
      ...a,
      id: newAudioId,
      notebookId: copyId,
      assetId,
      dataUrl: assetId ? undefined : a.dataUrl,
    })
  }
  return copy
}

export async function emptyTrash(): Promise<number> {
  const items = await getTrashNotebooks()
  for (const nb of items) await permanentDeleteNotebook(nb.id)
  return items.length
}

export async function softDeleteNotebook(id: string): Promise<void> {
  await db.notebooks.update(id, { deletedAt: Date.now() })
  pruneRecentPagesForNotebook(id)
}

export async function restoreNotebook(id: string): Promise<void> {
  await db.notebooks.update(id, { deletedAt: undefined })
}

export async function permanentDeleteNotebook(id: string): Promise<void> {
  const pageIds = (await db.pages.where('notebookId').equals(id).toArray()).map((p) => p.id)
  for (const pid of pageIds) {
    await db.pageSnapshots.where('pageId').equals(pid).delete()
  }
  await db.pages.where('notebookId').equals(id).delete()
  await db.audio.where('notebookId').equals(id).delete()
  await db.studyCards.where('notebookId').equals(id).delete()
  await db.shareLinks.where('notebookId').equals(id).delete()
  const { deleteAssetsForNotebook } = await import('../lib/assets')
  await deleteAssetsForNotebook(id)
  await db.notebooks.delete(id)
}

export async function getPageCounts(notebookIds: string[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  await Promise.all(
    notebookIds.map(async (id) => {
      counts[id] = await db.pages.where('notebookId').equals(id).count()
    }),
  )
  return counts
}

/** Supprime définitivement les éléments en corbeille depuis plus de `days` jours. */
export async function purgeTrashOlderThan(days: number): Promise<number> {
  const cutoff = Date.now() - days * 86400000
  const items = await getTrashNotebooks()
  let n = 0
  for (const nb of items) {
    if (nb.deletedAt && nb.deletedAt < cutoff) {
      await permanentDeleteNotebook(nb.id)
      n++
    }
  }
  return n
}

export async function deleteNotebook(id: string): Promise<void> {
  await softDeleteNotebook(id)
}

export async function deleteFolder(id: string): Promise<void> {
  const subfolders = await db.folders.where('parentId').equals(id).toArray()
  for (const sf of subfolders) await deleteFolder(sf.id)
  const notebooks = await db.notebooks.where('folderId').equals(id).toArray()
  for (const nb of notebooks) await softDeleteNotebook(nb.id)
  await db.folders.delete(id)
}

export async function moveNotebook(
  notebookId: string,
  folderId: string | null,
): Promise<void> {
  await db.notebooks.update(notebookId, { folderId, updatedAt: Date.now() })
}

export async function renameNotebook(id: string, name: string): Promise<void> {
  await db.notebooks.update(id, { name, updatedAt: Date.now() })
  const { enqueueSyncOp } = await import('./sync-queue')
  enqueueSyncOp({
    id,
    type: 'notebook_update',
    entityId: id,
    payload: { name },
    createdAt: Date.now(),
  })
}

export async function updateNotebookMetadata(
  id: string,
  patch: Partial<
    Pick<Notebook, 'coverColor' | 'paperTemplate' | 'orientation' | 'subjectId'>
  >,
): Promise<void> {
  await db.notebooks.update(id, { ...patch, updatedAt: Date.now() })
  const { enqueueSyncOp } = await import('./sync-queue')
  enqueueSyncOp({
    id,
    type: 'notebook_update',
    entityId: id,
    payload: patch,
    createdAt: Date.now(),
  })
}

export async function createNotebookFromImages(
  name: string,
  folderId: string | null,
  files: File[],
): Promise<Notebook> {
  const notebook = await createNotebook({
    name: name || 'Images',
    folderId,
    coverColor: '#10b981',
    paperTemplate: 'blank',
    orientation: 'portrait',
  })
  if (files.length === 0) return notebook

  const first = files[0]
  const firstUrl = await fileToDataUrl(first)
  const page0 = await db.pages.where('notebookId').equals(notebook.id).first()
  if (page0) {
    await db.pages.update(page0.id, {
      images: [
        {
          id: createId(),
          x: 120,
          y: 200,
          width: 400,
          height: 300,
          dataUrl: firstUrl,
          pageId: page0.id,
        },
      ],
    })
  }

  for (let i = 1; i < files.length; i++) {
    const dataUrl = await fileToDataUrl(files[i])
    const p = await addPage(notebook.id, 'blank')
    await db.pages.update(p.id, {
      images: [
        {
          id: createId(),
          x: 120,
          y: 200,
          width: 400,
          height: 300,
          dataUrl,
          pageId: p.id,
        },
      ],
    })
  }
  return notebook
}

export async function appendPdfToNotebook(notebookId: string, file: File): Promise<number> {
  const { importPdfFile } = await import('../lib/pdf-import')
  const { pages: imported, pdfSourceDataUrl } = await importPdfFile(file)
  const existing = await db.pages.where('notebookId').equals(notebookId).sortBy('order')
  const baseOrder =
    existing.length > 0 ? Math.max(...existing.map((p) => p.order)) + 1 : 0

  const nb = await db.notebooks.get(notebookId)
  if (nb && !nb.pdfSourceDataUrl) {
    await db.notebooks.update(notebookId, {
      pdfSourceDataUrl,
      type: nb.type === 'whiteboard' ? 'whiteboard' : 'pdf',
      updatedAt: Date.now(),
    })
  }

  for (let i = 0; i < imported.length; i++) {
    const p = imported[i]
    await db.pages.add(
      createEmptyPage({
        id: createId(),
        notebookId,
        order: baseOrder + i,
        template: p.template,
        pdfDataUrl: p.pdfDataUrl,
        pdfPageIndex: p.pdfPageIndex,
        pdfText: p.pdfText,
        pdfLinks: p.pdfLinks ?? [],
        rotation: 0,
      }),
    )
  }
  await db.notebooks.update(notebookId, { updatedAt: Date.now() })
  return imported.length
}

export async function renameFolder(id: string, name: string): Promise<void> {
  await db.folders.update(id, { name, updatedAt: Date.now() })
}

export async function duplicateFolder(folderId: string): Promise<Folder> {
  const src = await db.folders.get(folderId)
  if (!src) throw new Error('Dossier introuvable')
  const copy = await createFolder(`${src.name} (copie)`, src.parentId)
  const notebooks = await getNotebooks(folderId)
  for (const nb of notebooks) {
    await duplicateNotebook(nb.id, copy.id)
  }
  const children = await getFolders(folderId)
  for (const child of children) {
    const childCopy = await createFolder(child.name, copy.id)
    const subNotebooks = await getNotebooks(child.id)
    for (const nb of subNotebooks) {
      await duplicateNotebook(nb.id, childCopy.id)
    }
  }
  return copy
}

export async function toggleFavorite(id: string): Promise<void> {
  const nb = await db.notebooks.get(id)
  if (nb) await db.notebooks.update(id, { favorite: !nb.favorite })
}

export interface SortNotebooksOptions {
  subjects?: Subject[]
  pageCounts?: Record<string, number>
}

export function sortNotebooks(
  notebooks: Notebook[],
  sortBy: SortBy,
  order: SortOrder,
  opts: SortNotebooksOptions = {},
): Notebook[] {
  const { subjects = [], pageCounts = {} } = opts
  return [...notebooks].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name, 'fr')
    else if (sortBy === 'created') cmp = a.createdAt - b.createdAt
    else if (sortBy === 'subject') {
      const la = subjectLabel(subjects, a.subjectId)
      const lb = subjectLabel(subjects, b.subjectId)
      cmp = la.localeCompare(lb, 'fr') || a.name.localeCompare(b.name, 'fr')
    } else if (sortBy === 'size') {
      cmp =
        estimateNotebookBytes(pageCounts[a.id] ?? 1) -
        estimateNotebookBytes(pageCounts[b.id] ?? 1)
    } else cmp = a.updatedAt - b.updatedAt
    return order === 'asc' ? cmp : -cmp
  })
}

export async function getNotebook(id: string): Promise<Notebook | undefined> {
  return db.notebooks.get(id)
}

export async function getFolder(id: string): Promise<Folder | undefined> {
  return db.folders.get(id)
}

export async function searchNotebooks(query: string): Promise<Notebook[]> {
  const q = query.toLowerCase().trim()
  if (!q) return getAllNotebooks()
  return db.notebooks
    .filter((n) => !n.deletedAt && n.name.toLowerCase().includes(q))
    .toArray()
}

export async function getNotebooksByIds(ids: string[]): Promise<Notebook[]> {
  const result: Notebook[] = []
  for (const id of ids) {
    const nb = await db.notebooks.get(id)
    if (nb && !nb.deletedAt) result.push(nb)
  }
  return result
}

/** Fusionne `sourceId` dans `targetId` (pages, cartes Study, audio) puis met la source en corbeille. */
export async function mergeNotebooks(targetId: string, sourceId: string): Promise<boolean> {
  if (targetId === sourceId) return false
  const target = await db.notebooks.get(targetId)
  const source = await db.notebooks.get(sourceId)
  if (!target || !source || target.deletedAt || source.deletedAt) return false

  const targetPages = await getPages(targetId)
  let nextOrder =
    targetPages.length > 0 ? Math.max(...targetPages.map((p) => p.order)) + 1 : 0

  const sourcePages = await getPages(sourceId)
  for (const p of sourcePages) {
    await db.pages.update(p.id, { notebookId: targetId, order: nextOrder++ })
  }

  const study = await db.studyCards.where('notebookId').equals(sourceId).toArray()
  for (const c of study) await db.studyCards.update(c.id, { notebookId: targetId })

  const audio = await db.audio.where('notebookId').equals(sourceId).toArray()
  for (const a of audio) await db.audio.update(a.id, { notebookId: targetId })

  await softDeleteNotebook(sourceId)
  await db.notebooks.update(targetId, { updatedAt: Date.now() })
  return true
}
