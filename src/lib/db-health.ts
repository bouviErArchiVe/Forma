import { db } from '../db'
import { collectReferencedAssetIds } from './assets'
import { getLibraryStats, type LibraryStats } from './storage-stats'
import { getBrowserStorageEstimate, type BrowserStorageEstimate } from './storage-quota'
import { normalizePage } from '../types'

export interface BrokenAssetRef {
  assetId: string
  context: string
}

export interface DbHealthReport {
  stats: LibraryStats
  browserStorage: BrowserStorageEstimate
  brokenAssetRefs: BrokenAssetRef[]
  orphanAssetCount: number
  pagesWithInlineDataUrl: number
  notebooksWithInlinePdf: number
  audioWithInlineDataUrl: number
}

async function collectAssetRefContexts(): Promise<Map<string, string[]>> {
  const contexts = new Map<string, string[]>()
  const add = (assetId: string, context: string) => {
    const list = contexts.get(assetId) ?? []
    list.push(context)
    contexts.set(assetId, list)
  }

  for (const nb of await db.notebooks.toArray()) {
    if (nb.pdfSourceAssetId) add(nb.pdfSourceAssetId, `notebook:${nb.id}`)
  }
  for (const raw of await db.pages.toArray()) {
    const page = normalizePage(raw)
    if (page.pdfAssetId) add(page.pdfAssetId, `page:${page.id}/pdf`)
    for (const img of page.images) {
      if (img.assetId) add(img.assetId, `page:${page.id}/image:${img.id}`)
    }
  }
  for (const rec of await db.audio.toArray()) {
    if (rec.assetId) add(rec.assetId, `audio:${rec.id}`)
  }
  for (const snap of await db.pageSnapshots.toArray()) {
    const page = normalizePage(snap.data)
    if (page.pdfAssetId) add(page.pdfAssetId, `snapshot:${snap.id}/pdf`)
    for (const img of page.images) {
      if (img.assetId) add(img.assetId, `snapshot:${snap.id}/image:${img.id}`)
    }
  }
  return contexts
}

export async function findBrokenAssetRefs(): Promise<BrokenAssetRef[]> {
  const broken: BrokenAssetRef[] = []
  const contexts = await collectAssetRefContexts()
  for (const [assetId, ctxs] of contexts) {
    const row = await db.assets.get(assetId)
    if (!row) {
      for (const context of ctxs) broken.push({ assetId, context })
    }
  }
  return broken
}

export async function countInlineDataUrls(): Promise<{
  pagesWithInlineDataUrl: number
  notebooksWithInlinePdf: number
  audioWithInlineDataUrl: number
}> {
  let pagesWithInlineDataUrl = 0
  let notebooksWithInlinePdf = 0
  let audioWithInlineDataUrl = 0
  for (const raw of await db.pages.toArray()) {
    const has =
      raw.pdfDataUrl?.startsWith('data:') ||
      (raw.images ?? []).some((i) => i.dataUrl?.startsWith('data:'))
    if (has) pagesWithInlineDataUrl++
  }
  for (const nb of await db.notebooks.toArray()) {
    if (nb.pdfSourceDataUrl?.startsWith('data:')) notebooksWithInlinePdf++
  }
  for (const rec of await db.audio.toArray()) {
    if (rec.dataUrl?.startsWith('data:') && !rec.assetId) audioWithInlineDataUrl++
  }
  return { pagesWithInlineDataUrl, notebooksWithInlinePdf, audioWithInlineDataUrl }
}

export async function getDbHealthReport(): Promise<DbHealthReport> {
  const [stats, browserStorage, brokenAssetRefs, inline, assetRows, refs] = await Promise.all([
    getLibraryStats(),
    getBrowserStorageEstimate(),
    findBrokenAssetRefs(),
    countInlineDataUrls(),
    db.assets.toArray(),
    collectReferencedAssetIds(),
  ])
  const orphanAssetCount = assetRows.filter((a) => !refs.has(a.id)).length
  return {
    stats,
    browserStorage,
    brokenAssetRefs,
    orphanAssetCount,
    ...inline,
  }
}
