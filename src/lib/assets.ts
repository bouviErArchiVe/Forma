import { db } from '../db'
import { createId } from './id'
import type { AudioRecording, ImageElement, Notebook, Page } from '../types'
import { normalizePage } from '../types'

export interface StoredAsset {
  id: string
  notebookId: string
  mimeType: string
  blob: Blob
  createdAt: number
}

const urlCache = new Map<string, string>()
const MIN_INLINE_BYTES = 4096

export function revokeAllAssetUrls(): void {
  for (const url of urlCache.values()) URL.revokeObjectURL(url)
  urlCache.clear()
}

export async function resolveAssetUrl(assetId: string): Promise<string> {
  const hit = urlCache.get(assetId)
  if (hit) return hit
  const row = await db.assets.get(assetId)
  if (!row) return ''
  const url = URL.createObjectURL(row.blob)
  urlCache.set(assetId, url)
  return url
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

export async function putAsset(
  id: string,
  notebookId: string,
  blob: Blob,
  mimeType?: string,
): Promise<void> {
  await db.assets.put({
    id,
    notebookId,
    blob,
    mimeType: mimeType || blob.type || 'application/octet-stream',
    createdAt: Date.now(),
  })
}

/** Lit les octets d’un blob stocké (compat fake-indexeddb / Dexie). */
export async function readBlobBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    try {
      const buf = await blob.arrayBuffer()
      if (buf.byteLength > 0) return buf
    } catch {
      /* fallback */
    }
  }
  const text = await new Response(blob).text()
  if (text.startsWith('[') && text.endsWith(']')) {
    try {
      const arr = JSON.parse(text) as number[]
      if (Array.isArray(arr) && arr.length) {
        return new Uint8Array(arr).buffer
      }
    } catch {
      /* not JSON array */
    }
  }
  return new Response(blob).arrayBuffer()
}

async function shouldExternalize(dataUrl: string | undefined): Promise<boolean> {
  if (!dataUrl?.startsWith('data:')) return false
  const blob = await dataUrlToBlob(dataUrl)
  return blob.size >= MIN_INLINE_BYTES
}

export async function externalizeDataUrl(
  dataUrl: string,
  notebookId: string,
  assetId?: string,
): Promise<{ assetId?: string; dataUrl?: string }> {
  if (!(await shouldExternalize(dataUrl))) {
    return { dataUrl }
  }
  const id = assetId ?? createId()
  const blob = await dataUrlToBlob(dataUrl)
  await putAsset(id, notebookId, blob, blob.type)
  const old = urlCache.get(id)
  if (old) URL.revokeObjectURL(old)
  urlCache.delete(id)
  return { assetId: id, dataUrl: undefined }
}

async function ensureAssetNotebook(assetId: string, notebookId: string): Promise<void> {
  const row = await db.assets.get(assetId)
  if (row && row.notebookId !== notebookId) {
    await db.assets.update(assetId, { notebookId })
  }
}

export async function persistPageAssets(page: Page): Promise<Page> {
  let p = normalizePage(page)
  const images: ImageElement[] = []
  for (const img of p.images) {
    if (img.assetId && !img.dataUrl) {
      if (img.assetId) await ensureAssetNotebook(img.assetId, p.notebookId)
      images.push(img)
      continue
    }
    if (img.dataUrl?.startsWith('data:')) {
      const ext = await externalizeDataUrl(img.dataUrl, p.notebookId, img.id)
      images.push({ ...img, ...ext })
    } else {
      images.push(img)
    }
  }
  p = { ...p, images }

  if (p.pdfAssetId) await ensureAssetNotebook(p.pdfAssetId, p.notebookId)
  if (p.pdfDataUrl?.startsWith('data:') && !p.pdfAssetId) {
    const ext = await externalizeDataUrl(p.pdfDataUrl, p.notebookId, `${p.id}-pdf-raster`)
    if ('assetId' in ext && ext.assetId) {
      p = { ...p, pdfAssetId: ext.assetId, pdfDataUrl: undefined }
    }
  }
  return p
}

/** Migre les PDF sources inline restants (tous carnets type pdf). */
export async function migrateAllPdfNotebookSources(): Promise<number> {
  const notebooks = await db.notebooks.toArray()
  let n = 0
  for (const nb of notebooks) {
    if (nb.deletedAt) continue
    if (nb.type !== 'pdf') continue
    if (!nb.pdfSourceDataUrl?.startsWith('data:') || nb.pdfSourceAssetId) continue
    await migrateNotebookPdfSource(nb.id)
    n++
  }
  return n
}

export async function cloneAsset(
  sourceId: string,
  newId: string,
  notebookId: string,
): Promise<boolean> {
  const row = await db.assets.get(sourceId)
  if (!row) return false
  await putAsset(newId, notebookId, row.blob, row.mimeType)
  return true
}

export async function deleteAssetsForNotebook(notebookId: string): Promise<void> {
  const rows = await db.assets.where('notebookId').equals(notebookId).toArray()
  for (const row of rows) {
    const url = urlCache.get(row.id)
    if (url) URL.revokeObjectURL(url)
    urlCache.delete(row.id)
  }
  await db.assets.where('notebookId').equals(notebookId).delete()
}

export async function migrateNotebookPdfSource(notebookId: string): Promise<void> {
  const nb = await db.notebooks.get(notebookId)
  if (!nb?.pdfSourceDataUrl?.startsWith('data:')) return
  if (nb.pdfSourceAssetId) return
  const ext = await externalizeDataUrl(
    nb.pdfSourceDataUrl,
    notebookId,
    `${notebookId}-pdf-source`,
  )
  if (ext.assetId) {
    await db.notebooks.update(notebookId, {
      pdfSourceAssetId: ext.assetId,
      pdfSourceDataUrl: undefined,
    })
  }
}

export async function persistAudioAsset(rec: AudioRecording): Promise<AudioRecording> {
  if (rec.assetId && !rec.dataUrl) return rec
  if (!rec.dataUrl?.startsWith('data:')) return rec
  const ext = await externalizeDataUrl(rec.dataUrl, rec.notebookId, rec.id)
  return { ...rec, ...ext } as AudioRecording
}

/** Résout assetId → URL objet pour le rendu (ne modifie pas la DB). */
export async function hydratePageForRender(
  page: Page,
  notebook?: Notebook | null,
): Promise<{ page: Page; pdfSourceDataUrl?: string }> {
  const p = normalizePage(page)
  const images = await Promise.all(
    p.images.map(async (img) => {
      if (img.dataUrl && (img.dataUrl.startsWith('blob:') || img.dataUrl.startsWith('data:'))) {
        return img
      }
      if (img.assetId) {
        const url = await resolveAssetUrl(img.assetId)
        return { ...img, dataUrl: url || img.dataUrl || '' }
      }
      return img
    }),
  )
  let pdfDataUrl = p.pdfDataUrl
  if (!pdfDataUrl && p.pdfAssetId) {
    pdfDataUrl = await resolveAssetUrl(p.pdfAssetId)
  }
  let pdfSourceDataUrl = notebook?.pdfSourceDataUrl
  if (!pdfSourceDataUrl && notebook?.pdfSourceAssetId) {
    pdfSourceDataUrl = await resolveAssetUrl(notebook.pdfSourceAssetId)
  }
  return {
    page: { ...p, images, pdfDataUrl },
    pdfSourceDataUrl,
  }
}

export async function hydratePageImages(page: Page): Promise<Page> {
  return (await hydratePageForRender(page)).page
}

/** IDs d’assets encore référencés dans la bibliothèque. */
export async function collectReferencedAssetIds(): Promise<Set<string>> {
  const refs = new Set<string>()
  const notebooks = await db.notebooks.toArray()
  for (const nb of notebooks) {
    if (nb.pdfSourceAssetId) refs.add(nb.pdfSourceAssetId)
  }
  const pages = await db.pages.toArray()
  for (const p of pages) {
    const page = normalizePage(p)
    if (page.pdfAssetId) refs.add(page.pdfAssetId)
    for (const img of page.images) {
      if (img.assetId) refs.add(img.assetId)
    }
    // Moodboard items may reference assets
    if (page.moodboardData) {
      try {
        const { deserializeBoard } = await import('./fmoodboard')
        const board = deserializeBoard(page.moodboardData)
        for (const item of board.items) {
          if (item.assetId) refs.add(item.assetId)
        }
      } catch {
        // ignore parse errors
      }
    }
  }
  const audio = await db.audio.toArray()
  for (const a of audio) {
    if (a.assetId) refs.add(a.assetId)
  }
  return refs
}

/** Supprime les blobs IndexedDB sans référence (après suppressions partielles). */
export async function garbageCollectOrphanAssets(): Promise<number> {
  const refs = await collectReferencedAssetIds()
  const rows = await db.assets.toArray()
  let n = 0
  for (const row of rows) {
    if (refs.has(row.id)) continue
    const url = urlCache.get(row.id)
    if (url) URL.revokeObjectURL(url)
    urlCache.delete(row.id)
    await db.assets.delete(row.id)
    n++
  }
  return n
}

/** Externalise progressivement les dataURL inline volumineux (idle). */
export async function migrateInlinePagesBatch(limit = 8): Promise<number> {
  const pages = await db.pages.toArray()
  let n = 0
  for (const raw of pages) {
    if (n >= limit) break
    const page = normalizePage(raw)
    const needs =
      page.images.some((i) => i.dataUrl?.startsWith('data:')) ||
      page.pdfDataUrl?.startsWith('data:')
    if (!needs) continue
    const stored = await persistPageAssets(page)
    const changed =
      stored.images !== page.images ||
      stored.pdfDataUrl !== page.pdfDataUrl ||
      stored.pdfAssetId !== page.pdfAssetId
    if (changed) {
      await db.pages.put(stored)
      n++
    }
  }
  return n
}

export async function resolveNotebookPdfSource(notebook: Notebook): Promise<string | undefined> {
  if (notebook.pdfSourceDataUrl) return notebook.pdfSourceDataUrl
  if (notebook.pdfSourceAssetId) return resolveAssetUrl(notebook.pdfSourceAssetId)
  return undefined
}
