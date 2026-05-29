/**
 * Migration Dexie v6 : externalise les dataURL inline volumineux vers la table assets.
 * - `runDexieDataUrlMigrationTx` : dans la transaction `.upgrade()` (accès via tx)
 * - `runDexieDataUrlMigration` : idle / rattrapage via migrateInlinePagesBatch (assets)
 */

import type { Transaction } from 'dexie'
import type { Notebook, Page } from '../types'
import { normalizePage } from '../types'

/** Taille de lot par passe (upgrade bloquant — plus grand que l’idle UI). */
export const DATAURL_MIGRATION_BATCH_SIZE = 32

const MIN_INLINE_BYTES = 4096

export interface DataUrlMigrationResult {
  pagesMigrated: number
}

export interface PdfSourceMigrationResult {
  notebooksMigrated: number
}

function dataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return 0
  const data = dataUrl.slice(comma + 1)
  const padding = data.match(/=+$/)?.[0]?.length ?? 0
  return Math.floor((data.length * 3) / 4) - padding
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',')
  const header = dataUrl.slice(0, comma)
  const data = dataUrl.slice(comma + 1)
  const mime = header.match(/^data:([^;,]+)/)?.[1] ?? 'application/octet-stream'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function shouldExternalize(dataUrl: string | undefined): boolean {
  if (!dataUrl?.startsWith('data:')) return false
  return dataUrlByteSize(dataUrl) >= MIN_INLINE_BYTES
}

/** Migration batch dans la transaction Dexie v6 (pages + assets via tx). */
export async function runDexieDataUrlMigrationTx(tx: Transaction): Promise<DataUrlMigrationResult> {
  let pagesMigrated = 0
  const pages = (await tx.table('pages').toArray()) as Page[]
  for (const raw of pages) {
    let page = normalizePage(raw)
    let changed = false

    const images = []
    for (const img of page.images) {
      if (img.assetId && !img.dataUrl) {
        images.push(img)
        continue
      }
      if (img.dataUrl?.startsWith('data:') && shouldExternalize(img.dataUrl)) {
        const blob = dataUrlToBlob(img.dataUrl)
        await tx.table('assets').put({
          id: img.id,
          notebookId: page.notebookId,
          blob,
          mimeType: blob.type || 'application/octet-stream',
          createdAt: Date.now(),
        })
        images.push({ ...img, assetId: img.id, dataUrl: undefined })
        changed = true
      } else {
        images.push(img)
      }
    }
    if (changed) page = { ...page, images }

    if (
      page.pdfDataUrl?.startsWith('data:') &&
      !page.pdfAssetId &&
      shouldExternalize(page.pdfDataUrl)
    ) {
      const pdfId = `${page.id}-pdf-raster`
      const blob = dataUrlToBlob(page.pdfDataUrl)
      await tx.table('assets').put({
        id: pdfId,
        notebookId: page.notebookId,
        blob,
        mimeType: blob.type || 'application/pdf',
        createdAt: Date.now(),
      })
      page = { ...page, pdfAssetId: pdfId, pdfDataUrl: undefined }
      changed = true
    }

    if (changed) {
      await tx.table('pages').put(page)
      pagesMigrated++
    }
  }
  return { pagesMigrated }
}

/** Dexie v7 : externalise `notebook.pdfSourceDataUrl` inline vers assets. */
export async function runDexiePdfSourceMigrationTx(
  tx: Transaction,
): Promise<PdfSourceMigrationResult> {
  let notebooksMigrated = 0
  const notebooks = (await tx.table('notebooks').toArray()) as Notebook[]
  for (const nb of notebooks) {
    if (nb.deletedAt) continue
    if (!nb.pdfSourceDataUrl?.startsWith('data:') || nb.pdfSourceAssetId) continue
    const blob = dataUrlToBlob(nb.pdfSourceDataUrl)
    const assetId = `${nb.id}-pdf-source`
    await tx.table('assets').put({
      id: assetId,
      notebookId: nb.id,
      blob,
      mimeType: blob.type || 'application/pdf',
      createdAt: Date.now(),
    })
    await tx.table('notebooks').put({
      ...nb,
      pdfSourceAssetId: assetId,
      pdfSourceDataUrl: undefined,
    })
    notebooksMigrated++
  }
  return { notebooksMigrated }
}

/**
 * Boucle `migrateInlinePagesBatch` jusqu’à épuisement (idle / rattrapage hors upgrade).
 * Import dynamique de assets pour éviter une dépendance circulaire db ↔ assets au chargement.
 */
export async function runDexieDataUrlMigration(): Promise<DataUrlMigrationResult> {
  const { migrateInlinePagesBatch } = await import('./assets')
  let pagesMigrated = 0
  for (;;) {
    const n = await migrateInlinePagesBatch(DATAURL_MIGRATION_BATCH_SIZE)
    pagesMigrated += n
    if (n === 0) break
  }
  return { pagesMigrated }
}
