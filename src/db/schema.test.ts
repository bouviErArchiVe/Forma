import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, FORMA_DB_VERSION, FormaDatabase } from './index'
import { makeTestNotebook, makeTestPage } from '../lib/forma-test-fixtures'
import type { Page } from '../types'
import { normalizePage } from '../types'

function makeLargePngDataUrl(): string {
  const raw = new Uint8Array(5000)
  raw.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0)
  let binary = ''
  for (let i = 0; i < raw.length; i++) binary += String.fromCharCode(raw[i]!)
  return `data:image/png;base64,${btoa(binary)}`
}

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

async function seedV5WithInlinePage(): Promise<{ notebookId: string; pageId: string; imageId: string }> {
  db.close()
  await db.delete()

  const v5 = new Dexie('forma')
  v5.version(1).stores({
    folders: 'id, parentId, name, updatedAt',
    notebooks: 'id, folderId, name, updatedAt, favorite',
    pages: 'id, notebookId, order',
  })
  v5.version(2)
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
  v5.version(3).upgrade(async (tx) => {
    await tx
      .table('pages')
      .toCollection()
      .modify((page: Page) => {
        page.stickers = page.stickers ?? []
      })
  })
  v5.version(4).stores({
    folders: 'id, parentId, name, updatedAt',
    notebooks: 'id, folderId, name, updatedAt, favorite, deletedAt',
    pages: 'id, notebookId, order',
    audio: 'id, notebookId, createdAt',
    studyCards: 'id, notebookId, nextReview',
    shareLinks: 'id, notebookId, token',
    pageSnapshots: 'id, pageId, createdAt',
    settings: 'key',
  })
  v5.version(5).stores({
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
  await v5.open()
  expect(v5.verno).toBe(5)

  const nb = makeTestNotebook({ id: 'nb-v5-upgrade' })
  const pageId = 'page-v5-upgrade'
  const imageId = 'img-v5-upgrade'
  await v5.table('notebooks').add(nb)
  await v5.table('pages').add(
    makeTestPage(nb.id, {
      id: pageId,
      images: [
        {
          id: imageId,
          pageId,
          x: 0,
          y: 0,
          width: 80,
          height: 80,
          dataUrl: makeLargePngDataUrl(),
        },
      ],
    }),
  )
  v5.close()
  return { notebookId: nb.id, pageId, imageId }
}

describe('Dexie schema', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('opens at the current version with assets store', async () => {
    expect(db.verno).toBe(FORMA_DB_VERSION)
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      [
        'assets',
        'audio',
        'folders',
        'moodboardBoards',
        'moodboardImages',
        'formaDocuments',
        'formaSheets',
        'formaDecks',
        'formaCalEvents',
        'notebooks',
        'pages',
        'pageSnapshots',
        'settings',
        'shareLinks',
        'studyCards',
      ].sort(),
    )
  })

  it('persists blob rows in assets store (v5)', async () => {
    await db.assets.put({
      id: 'asset-schema-1',
      notebookId: 'nb-1',
      mimeType: 'image/png',
      blob: new Blob([1, 2, 3], { type: 'image/png' }),
      createdAt: Date.now(),
    })
    const row = await db.assets.get('asset-schema-1')
    expect(row?.notebookId).toBe('nb-1')
    expect(row?.mimeType).toBe('image/png')
  })

  it('v6 upgrade externalizes inline page data URLs from v5', async () => {
    const { pageId, imageId, notebookId } = await seedV5WithInlinePage()

    const freshDb = new FormaDatabase()
    await freshDb.open()
    expect(freshDb.verno).toBe(FORMA_DB_VERSION)

    const row = await freshDb.pages.get(pageId)
    expect(row?.images[0]?.assetId).toBe(imageId)
    expect(row?.images[0]?.dataUrl).toBeUndefined()

    const asset = await freshDb.assets.get(imageId)
    expect(asset?.notebookId).toBe(notebookId)
    expect(asset?.mimeType).toContain('image')

    freshDb.close()
    await db.open()
  })

  it('v7 upgrade externalizes inline pdfSourceDataUrl on notebooks', async () => {
    db.close()
    await db.delete()

    const v6 = new Dexie('forma')
    v6.version(6).stores({
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
    await v6.open()

    const nbId = 'nb-v7-pdf'
    const dataUrl = makeLargePngDataUrl().replace('image/png', 'application/pdf')
    await v6.table('notebooks').add({
      id: nbId,
      folderId: null,
      name: 'PDF inline',
      type: 'pdf',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      favorite: false,
      pdfSourceDataUrl: dataUrl,
    })
    v6.close()

    const freshDb = new FormaDatabase()
    await freshDb.open()
    expect(freshDb.verno).toBe(FORMA_DB_VERSION)

    const nb = await freshDb.notebooks.get(nbId)
    expect(nb?.pdfSourceAssetId).toBe(`${nbId}-pdf-source`)
    expect(nb?.pdfSourceDataUrl).toBeUndefined()

    const asset = await freshDb.assets.get(`${nbId}-pdf-source`)
    expect(asset?.notebookId).toBe(nbId)

    freshDb.close()
    await db.open()
  })
})
