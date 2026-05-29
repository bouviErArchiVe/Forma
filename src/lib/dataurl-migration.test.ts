import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  externalizeDataUrl,
  migrateInlinePagesBatch,
  persistPageAssets,
} from './assets'
import { runDexieDataUrlMigration, runDexieDataUrlMigrationTx } from './dataurl-migration'
import { makeTestNotebook, makeTestPage } from './forma-test-fixtures'

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

describe('dataURL → blob migration', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('keeps small inline data URLs under the size threshold', async () => {
    const tiny = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    const result = await externalizeDataUrl(tiny, 'nb-small', 'img-small')
    expect(result.assetId).toBeUndefined()
    expect(result.dataUrl).toBe(tiny)
    expect(await db.assets.count()).toBe(0)
  })

  it('externalizes large image data URLs via persistPageAssets', async () => {
    const nb = makeTestNotebook({ id: 'nb-migrate' })
    const pageId = 'page-migrate'
    const imageId = 'img-large'
    const dataUrl = makeLargePngDataUrl()
    const page = makeTestPage(nb.id, {
      id: pageId,
      images: [
        {
          id: imageId,
          pageId,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          dataUrl,
        },
      ],
    })
    await db.notebooks.add(nb)
    await db.pages.add(page)

    const stored = await persistPageAssets(page)
    await db.pages.put(stored)

    const row = await db.pages.get(pageId)
    expect(row?.images[0]?.assetId).toBe(imageId)
    expect(row?.images[0]?.dataUrl).toBeUndefined()

    const asset = await db.assets.get(imageId)
    expect(asset).toBeDefined()
    expect(asset!.notebookId).toBe(nb.id)
    expect(asset!.mimeType).toContain('image')
  })

  it('migrateInlinePagesBatch processes pages with inline data URLs', async () => {
    const nb = makeTestNotebook({ id: 'nb-batch' })
    const pageId = 'page-batch'
    const dataUrl = makeLargePngDataUrl()
    await db.notebooks.add(nb)
    await db.pages.add(
      makeTestPage(nb.id, {
        id: pageId,
        images: [
          {
            id: 'img-batch',
            pageId,
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            dataUrl,
          },
        ],
      }),
    )

    const n = await migrateInlinePagesBatch(4)
    expect(n).toBeGreaterThanOrEqual(1)
    const row = await db.pages.get(pageId)
    expect(row?.images[0]?.assetId).toBe('img-batch')
    expect(row?.images[0]?.dataUrl).toBeUndefined()
  })

  it('runDexieDataUrlMigrationTx externalizes inline images in a transaction', async () => {
    const nb = makeTestNotebook({ id: 'nb-tx' })
    const pageId = 'page-tx'
    const imageId = 'img-tx'
    const dataUrl = makeLargePngDataUrl()
    await db.notebooks.add(nb)
    await db.pages.add(
      makeTestPage(nb.id, {
        id: pageId,
        images: [{ id: imageId, pageId, x: 0, y: 0, width: 50, height: 50, dataUrl }],
      }),
    )

    const result = await db.transaction('rw', db.pages, db.assets, (tx) =>
      runDexieDataUrlMigrationTx(tx),
    )
    expect(result.pagesMigrated).toBe(1)
    const row = await db.pages.get(pageId)
    expect(row?.images[0]?.assetId).toBe(imageId)
    expect(row?.images[0]?.dataUrl).toBeUndefined()
  })

  it('runDexieDataUrlMigration drains all inline pages in one call', async () => {
    const nb = makeTestNotebook({ id: 'nb-drain' })
    const dataUrl = makeLargePngDataUrl()
    await db.notebooks.add(nb)
    for (let i = 0; i < 3; i++) {
      const pageId = `page-drain-${i}`
      await db.pages.add(
        makeTestPage(nb.id, {
          id: pageId,
          images: [
            {
              id: `img-drain-${i}`,
              pageId,
              x: 0,
              y: 0,
              width: 40,
              height: 40,
              dataUrl,
            },
          ],
        }),
      )
    }

    const result = await runDexieDataUrlMigration()
    expect(result.pagesMigrated).toBe(3)
    for (let i = 0; i < 3; i++) {
      const row = await db.pages.get(`page-drain-${i}`)
      expect(row?.images[0]?.assetId).toBe(`img-drain-${i}`)
      expect(row?.images[0]?.dataUrl).toBeUndefined()
    }
  })
})
