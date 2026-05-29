import { beforeEach, describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'

vi.mock('./pdf-backfill', () => ({
  backfillMissingPdfText: vi.fn(async () => 0),
}))

vi.mock('../stores/confirmStore', () => ({
  confirm: vi.fn(async () => true),
}))

import { db, createEmptyPage } from '../db'
import { putAsset } from './assets'
import {
  exportFullBackup,
  importBackupFile,
  importNotebookZip,
} from './backup'
import { importAssetsFromZip } from './forma-package'
import { FORMA_FORMAT_VERSION } from './forma-types'
import { makeTestNotebook, makeTestPage } from './forma-test-fixtures'
import { clearSaveJournal } from './save-journal'

const PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
])

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

/**
 * Round-trip Dexie + import merge (mode `merge` conserve la bibliothèque locale).
 */
describe('backup Dexie round-trip', () => {
  beforeEach(async () => {
    clearSaveJournal()
    localStorage.clear()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    })
    await resetDb()
  })

  it('exportFullBackup → importBackupFile restores notebooks and strokes', async () => {
    const nb = makeTestNotebook({ id: 'nb-round-1' })
    const page = makeTestPage(nb.id, { id: 'page-round-1', order: 0 })
    await db.notebooks.add(nb)
    await db.pages.add(page)

    const blob = await exportFullBackup()
    await db.notebooks.add(makeTestNotebook({ id: 'noise-nb', name: 'Noise' }))

    const result = await importBackupFile(
      new File([blob], 'library.forma.zip', { type: 'application/zip' }),
      { confirmed: true },
    )

    expect(result.notebooks).toBe(1)
    expect(result.pages).toBe(1)

    const notebooks = await db.notebooks.toArray()
    expect(notebooks).toHaveLength(1)
    expect(notebooks[0].id).toBe('nb-round-1')

    const pages = await db.pages.toArray()
    expect(pages).toHaveLength(1)
    expect(pages[0].strokes).toHaveLength(1)
    expect(pages[0].strokes[0].points).toHaveLength(2)
  })

  it('importBackupFile restores page asset refs and blob rows', async () => {
    const nb = makeTestNotebook({ id: 'nb-assets' })
    const pageId = 'page-img-1'
    const assetId = 'asset-png-1'
    const imageId = 'img-1'
    const page = createEmptyPage({
      ...makeTestPage(nb.id, { id: pageId, strokes: [] }),
      images: [
        {
          id: imageId,
          pageId,
          x: 10,
          y: 20,
          width: 100,
          height: 80,
          assetId,
        },
      ],
    })

    const zip = new JSZip()
    const exportedAt = Date.now()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: FORMA_FORMAT_VERSION,
        appVersion: 'test',
        exportedAt,
        packageType: 'library',
        integrity: { algorithm: 'none' },
      }),
    )
    zip.file('metadata.json', JSON.stringify({ notebookCount: 1, pageCount: 1, folderCount: 0 }))
    zip.file('indexes/folders.json', '[]')
    zip.file('indexes/notebooks.json', JSON.stringify([nb]))
    zip.file('indexes/audio.json', '[]')
    zip.file('indexes/study.json', '[]')
    zip.file('indexes/share-links.json', '[]')
    zip.file('indexes/snapshots.json', '[]')
    zip.file(`notebooks/${nb.id}.json`, JSON.stringify(nb))
    zip.file(`pages/${page.id}.json`, JSON.stringify(page))
    zip.file(`assets/blobs/${assetId}.png`, PNG_BYTES)
    zip.file(
      'backup.json',
      JSON.stringify({
        version: 4,
        exportedAt,
        folders: [],
        notebooks: [nb],
        pages: [page],
        audio: [],
        studyCards: [],
        shareLinks: [],
      }),
    )

    const pack = await zip.generateAsync({ type: 'blob' })
    await importBackupFile(
      new File([pack], 'assets.forma.zip', { type: 'application/zip' }),
      { confirmed: true },
    )

    const asset = await db.assets.get(assetId)
    expect(asset).toBeDefined()
    expect(asset!.mimeType).toBe('image/png')
    expect(asset!.notebookId).toBe(nb.id)

    const importedPage = await db.pages.get(pageId)
    expect(importedPage?.images[0]?.assetId).toBe(assetId)
    expect(importedPage?.images[0]?.dataUrl).toBeUndefined()
  })

  it('importNotebookZip clones into a new notebook id', async () => {
    const nb = makeTestNotebook({ id: 'nb-src' })
    const page = makeTestPage(nb.id, { id: 'page-src', order: 0 })
    await db.notebooks.add(nb)
    await db.pages.add(page)

    const blob = await exportFullBackup()
    const newNbId = await importNotebookZip(
      new File([blob], 'single.forma.zip', { type: 'application/zip' }),
      null,
    )

    expect(newNbId).not.toBe('nb-src')
    const allNb = await db.notebooks.toArray()
    expect(allNb).toHaveLength(2)
    const clonedPages = await db.pages.where('notebookId').equals(newNbId).toArray()
    expect(clonedPages).toHaveLength(1)
    expect(clonedPages[0].strokes).toHaveLength(1)
    expect(clonedPages[0].id).not.toBe('page-src')
  })

  it('exportFullBackup round-trips Dexie blob assets', async () => {
    const nb = makeTestNotebook({ id: 'nb-export-blob' })
    const pageId = 'page-export-blob'
    const assetId = 'asset-export-1'
    await putAsset(assetId, nb.id, new Blob([PNG_BYTES], { type: 'image/png' }), 'image/png')
    const page = createEmptyPage({
      ...makeTestPage(nb.id, { id: pageId, strokes: [] }),
      images: [
        {
          id: 'img-export',
          pageId,
          x: 0,
          y: 0,
          width: 80,
          height: 60,
          assetId,
        },
      ],
    })
    await db.notebooks.add(nb)
    await db.pages.add(page)

    const blob = await exportFullBackup()
    await resetDb()

    await importBackupFile(
      new File([blob], 'dexie-export.forma.zip', { type: 'application/zip' }),
      { confirmed: true },
    )

    const asset = await db.assets.get(assetId)
    expect(asset?.notebookId).toBe(nb.id)
    const imported = await db.pages.get(pageId)
    expect(imported?.images[0]?.assetId).toBe(assetId)
  })

  it('importBackupFile merge keeps local notebooks and adds imported ones', async () => {
    const local = makeTestNotebook({ id: 'nb-local', name: 'Local' })
    const localPage = makeTestPage(local.id, { id: 'page-local', order: 0 })
    await db.notebooks.add(local)
    await db.pages.add(localPage)

    const imported = makeTestNotebook({ id: 'nb-imported', name: 'Importé' })
    const importedPage = makeTestPage(imported.id, { id: 'page-imported', order: 0 })
    const zip = new JSZip()
    const exportedAt = Date.now()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: FORMA_FORMAT_VERSION,
        appVersion: 'test',
        exportedAt,
        packageType: 'library',
        integrity: { algorithm: 'none' },
      }),
    )
    zip.file('metadata.json', JSON.stringify({ notebookCount: 1, pageCount: 1, folderCount: 0 }))
    zip.file('indexes/folders.json', '[]')
    zip.file('indexes/notebooks.json', JSON.stringify([imported]))
    zip.file('indexes/audio.json', '[]')
    zip.file('indexes/study.json', '[]')
    zip.file('indexes/share-links.json', '[]')
    zip.file('indexes/snapshots.json', '[]')
    zip.file(`notebooks/${imported.id}.json`, JSON.stringify(imported))
    zip.file(`pages/${importedPage.id}.json`, JSON.stringify(importedPage))
    zip.file(`strokes/${importedPage.id}.json`, JSON.stringify(importedPage.strokes))
    zip.file(
      'backup.json',
      JSON.stringify({
        version: 4,
        exportedAt,
        folders: [],
        notebooks: [imported],
        pages: [importedPage],
        audio: [],
        studyCards: [],
        shareLinks: [],
      }),
    )

    const pack = await zip.generateAsync({ type: 'blob' })
    const result = await importBackupFile(
      new File([pack], 'merge.forma.zip', { type: 'application/zip' }),
      { confirmed: true, mode: 'merge' },
    )

    expect(result.notebooks).toBe(1)
    expect(result.pages).toBe(1)
    expect(result.remappedNotebooks).toBe(0)

    const allNb = await db.notebooks.toArray()
    expect(allNb).toHaveLength(2)
    expect(allNb.some((n) => n.id === 'nb-local')).toBe(true)
    expect(allNb.some((n) => n.id === 'nb-imported')).toBe(true)
  })

  it('importBackupFile merge remaps notebook when id already exists', async () => {
    const nb = makeTestNotebook({ id: 'nb-dup', name: 'Original' })
    await db.notebooks.add(nb)
    await db.pages.add(makeTestPage(nb.id, { id: 'page-dup', order: 0 }))

    const blob = await exportFullBackup()
    const result = await importBackupFile(
      new File([blob], 'merge-dup.forma.zip', { type: 'application/zip' }),
      { confirmed: true, mode: 'merge' },
    )

    expect(result.remappedNotebooks).toBe(1)
    const allNb = await db.notebooks.toArray()
    expect(allNb).toHaveLength(2)
    expect(allNb.some((n) => n.id === 'nb-dup' && n.name === 'Original')).toBe(true)
    expect(allNb.some((n) => n.id !== 'nb-dup')).toBe(true)
  })

  it('importAssetsFromZip stores asset row with sniffed mime', async () => {
    const assetId = 'png-magic-test'
    const zip = new JSZip()
    zip.file(`assets/blobs/${assetId}.bin`, PNG_BYTES)
    await importAssetsFromZip(zip, new Set(['nb-sniff']))
    const asset = await db.assets.get(assetId)
    expect(asset?.mimeType).toBe('image/png')
    expect(asset?.notebookId).toBe('nb-sniff')
  })

  it('replace import downloads pre-replace backup with timestamp filename', async () => {
    const nb = makeTestNotebook({ id: 'nb-pre-replace' })
    await db.notebooks.add(nb)
    await db.pages.add(makeTestPage(nb.id, { id: 'page-pre', order: 0 }))

    const blob = await exportFullBackup()
    await resetDb()
    await db.notebooks.add(makeTestNotebook({ id: 'noise', name: 'Noise' }))

    const result = await importBackupFile(
      new File([blob], 'restore.forma.zip', { type: 'application/zip' }),
      { confirmed: true, mode: 'replace' },
    )

    expect(result.preReplaceBackupFilename).toMatch(
      /^forma-pre-replace-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.forma\.zip$/,
    )
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled()
    expect(await db.notebooks.toArray()).toHaveLength(1)
    expect((await db.notebooks.toArray())[0].id).toBe('nb-pre-replace')
  })

  it('importBackupFile merge remaps page id when page id already exists locally', async () => {
    const localNb = makeTestNotebook({ id: 'nb-local-pages', name: 'Local' })
    const sharedPageId = 'page-shared-id'
    await db.notebooks.add(localNb)
    await db.pages.add(makeTestPage(localNb.id, { id: sharedPageId, order: 0 }))

    const importedNb = makeTestNotebook({ id: 'nb-import-pages', name: 'Importé' })
    const importedPage = makeTestPage(importedNb.id, { id: sharedPageId, order: 0 })
    const zip = new JSZip()
    const exportedAt = Date.now()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: FORMA_FORMAT_VERSION,
        appVersion: 'test',
        exportedAt,
        packageType: 'library',
        integrity: { algorithm: 'none' },
      }),
    )
    zip.file('metadata.json', JSON.stringify({ notebookCount: 1, pageCount: 1, folderCount: 0 }))
    zip.file('indexes/folders.json', '[]')
    zip.file('indexes/notebooks.json', JSON.stringify([importedNb]))
    zip.file('indexes/audio.json', '[]')
    zip.file('indexes/study.json', '[]')
    zip.file('indexes/share-links.json', '[]')
    zip.file('indexes/snapshots.json', '[]')
    zip.file(`notebooks/${importedNb.id}.json`, JSON.stringify(importedNb))
    zip.file(`pages/${importedPage.id}.json`, JSON.stringify(importedPage))
    zip.file(`strokes/${importedPage.id}.json`, JSON.stringify(importedPage.strokes))
    zip.file(
      'backup.json',
      JSON.stringify({
        version: 4,
        exportedAt,
        folders: [],
        notebooks: [importedNb],
        pages: [importedPage],
        audio: [],
        studyCards: [],
        shareLinks: [],
      }),
    )

    const pack = await zip.generateAsync({ type: 'blob' })
    const result = await importBackupFile(
      new File([pack], 'merge-page.forma.zip', { type: 'application/zip' }),
      { confirmed: true, mode: 'merge' },
    )

    expect(result.remappedPages).toBe(1)
    const pages = await db.pages.toArray()
    expect(pages).toHaveLength(2)
    expect(pages.filter((p) => p.id === sharedPageId)).toHaveLength(1)
    expect(pages.some((p) => p.id !== sharedPageId && p.notebookId === importedNb.id)).toBe(true)
  })

  it('importBackupFile merge remaps asset id when blob id already exists locally', async () => {
    const localNb = makeTestNotebook({ id: 'nb-local-asset' })
    const importedNb = makeTestNotebook({ id: 'nb-import-asset' })
    const assetId = 'asset-collision'
    const pageId = 'page-import-asset'
    const imageId = 'img-import'

    await putAsset(assetId, localNb.id, new Blob([PNG_BYTES], { type: 'image/png' }), 'image/png')
    await db.notebooks.add(localNb)

    const importedPage = createEmptyPage({
      ...makeTestPage(importedNb.id, { id: pageId, strokes: [] }),
      images: [{ id: imageId, pageId, x: 0, y: 0, width: 40, height: 30, assetId }],
    })

    const zip = new JSZip()
    const exportedAt = Date.now()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: FORMA_FORMAT_VERSION,
        appVersion: 'test',
        exportedAt,
        packageType: 'library',
        integrity: { algorithm: 'none' },
      }),
    )
    zip.file('metadata.json', JSON.stringify({ notebookCount: 1, pageCount: 1, folderCount: 0 }))
    zip.file('indexes/folders.json', '[]')
    zip.file('indexes/notebooks.json', JSON.stringify([importedNb]))
    zip.file('indexes/audio.json', '[]')
    zip.file('indexes/study.json', '[]')
    zip.file('indexes/share-links.json', '[]')
    zip.file('indexes/snapshots.json', '[]')
    zip.file(`notebooks/${importedNb.id}.json`, JSON.stringify(importedNb))
    zip.file(`pages/${pageId}.json`, JSON.stringify(importedPage))
    zip.file(`assets/blobs/${assetId}.png`, PNG_BYTES)
    zip.file(
      'backup.json',
      JSON.stringify({
        version: 4,
        exportedAt,
        folders: [],
        notebooks: [importedNb],
        pages: [importedPage],
        audio: [],
        studyCards: [],
        shareLinks: [],
      }),
    )

    const pack = await zip.generateAsync({ type: 'blob' })
    const result = await importBackupFile(
      new File([pack], 'merge-asset.forma.zip', { type: 'application/zip' }),
      { confirmed: true, mode: 'merge' },
    )

    expect(result.remappedAssets).toBe(1)
    const imported = await db.pages.where('notebookId').equals(importedNb.id).first()
    expect(imported?.images[0]?.assetId).toBeDefined()
    expect(imported?.images[0]?.assetId).not.toBe(assetId)
    const localAsset = await db.assets.get(assetId)
    expect(localAsset?.notebookId).toBe(localNb.id)
    const remappedAsset = await db.assets.get(imported!.images[0]!.assetId!)
    expect(remappedAsset?.notebookId).toBe(importedNb.id)
  })
})
