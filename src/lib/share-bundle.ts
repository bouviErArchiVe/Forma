import JSZip from 'jszip'
import { createEmptyPage, db } from '../db'
import { createId } from './id'
import type { PageSnapshot, ShareLink } from '../types'
import { normalizePage } from '../types'
import type { Notebook, Page } from '../types'

export interface ShareBundleManifest {
  version: 1
  share: ShareLink
  notebook: Notebook
  pages: Page[]
  studyCards: import('../types').StudyCard[]
  audio: import('../types').AudioRecording[]
  pageSnapshots?: PageSnapshot[]
  exportedAt: number
}

/** Pack portable : carnet + lien de partage (importable sur un autre navigateur). */
export async function exportShareBundle(notebookId: string, link: ShareLink): Promise<Blob> {
  const nb = await db.notebooks.get(notebookId)
  if (!nb) throw new Error('Carnet introuvable')
  const pages = (await db.pages.where('notebookId').equals(notebookId).toArray()).map(normalizePage)
  const studyCards = await db.studyCards.where('notebookId').equals(notebookId).toArray()
  const audio = await db.audio.where('notebookId').equals(notebookId).toArray()
  const pageIds = new Set(pages.map((p) => p.id))
  const pageSnapshots = (await db.pageSnapshots.toArray()).filter((s) => pageIds.has(s.pageId))
  const manifest: ShareBundleManifest = {
    version: 1,
    share: link,
    notebook: nb,
    pages,
    studyCards,
    audio,
    pageSnapshots,
    exportedAt: Date.now(),
  }
  const zip = new JSZip()
  zip.file('share-bundle.json', JSON.stringify(manifest))
  return zip.generateAsync({ type: 'blob' })
}

export function downloadShareBundle(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}.forma-share.zip`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importShareBundle(file: File): Promise<{ notebookId: string; token: string }> {
  const zip = await JSZip.loadAsync(file)
  const entry = zip.file('share-bundle.json')
  if (!entry) throw new Error('share-bundle.json manquant')
  const manifest = JSON.parse(await entry.async('string')) as ShareBundleManifest
  if (!manifest.share?.token || !manifest.notebook) {
    throw new Error('Pack de partage invalide')
  }

  const existing = await db.shareLinks.where('token').equals(manifest.share.token).first()
  if (existing) {
    return { notebookId: existing.notebookId, token: manifest.share.token }
  }

  const nb = {
    ...manifest.notebook,
    id: createId(),
    updatedAt: Date.now(),
    createdAt: Date.now(),
  }
  await db.notebooks.add(nb)
  const pageIdMap = new Map<string, string>()

  for (const p of manifest.pages.map(normalizePage)) {
    const newId = createId()
    pageIdMap.set(p.id, newId)
    await db.pages.add(
      createEmptyPage({
        ...p,
        id: newId,
        notebookId: nb.id,
        strokes: p.strokes.map((s) => ({ ...s, id: createId(), pageId: newId })),
        shapes: p.shapes.map((s) => ({ ...s, id: createId(), pageId: newId })),
        texts: p.texts.map((t) => ({ ...t, id: createId(), pageId: newId })),
        images: p.images.map((i) => ({ ...i, id: createId(), pageId: newId })),
        stickers: p.stickers.map((s) => ({ ...s, id: createId(), pageId: newId })),
        tapes: p.tapes.map((t) => ({ ...t, id: createId(), pageId: newId })),
      }),
    )
  }

  for (const c of manifest.studyCards ?? []) {
    await db.studyCards.add({ ...c, id: createId(), notebookId: nb.id })
  }
  for (const a of manifest.audio ?? []) {
    await db.audio.add({ ...a, id: createId(), notebookId: nb.id })
  }
  for (const snap of manifest.pageSnapshots ?? []) {
    const newPageId = pageIdMap.get(snap.pageId)
    if (!newPageId) continue
    await db.pageSnapshots.add({
      ...snap,
      id: createId(),
      pageId: newPageId,
      data: { ...normalizePage(snap.data), id: newPageId, notebookId: nb.id },
    })
  }

  await db.shareLinks.add({
    ...manifest.share,
    id: createId(),
    notebookId: nb.id,
    createdAt: Date.now(),
  })

  return { notebookId: nb.id, token: manifest.share.token }
}
