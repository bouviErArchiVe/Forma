import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { createId } from './id'
import { makeTestNotebook, makeTestPage } from './forma-test-fixtures'
import { pruneOldSnapshots, pruneOrphanThumbnails, runAutoCleanup } from './storage-cleanup'
import type { PageSnapshot } from '../types'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

function makeSnapshot(pageId: string, createdAt: number): PageSnapshot {
  return {
    id: createId(),
    pageId,
    label: 'auto',
    createdAt,
    data: makeTestPage(pageId, { id: pageId }),
  }
}

describe('pruneOldSnapshots', () => {
  beforeEach(resetDb)

  it('garde uniquement les N instantanés les plus récents par page', async () => {
    const pageId = createId()
    const snapshots: PageSnapshot[] = []
    for (let i = 0; i < 25; i++) {
      snapshots.push(makeSnapshot(pageId, 1000 + i))
    }
    await db.pageSnapshots.bulkAdd(snapshots)

    const deleted = await pruneOldSnapshots(20)
    expect(deleted).toBe(5)

    const remaining = await db.pageSnapshots.where('pageId').equals(pageId).toArray()
    expect(remaining).toHaveLength(20)
    // Les 20 plus récents (createdAt 1005..1024) doivent être conservés
    const createdAts = remaining.map((s) => s.createdAt).sort((a, b) => a - b)
    expect(createdAts[0]).toBe(1005)
    expect(createdAts[createdAts.length - 1]).toBe(1024)
  })

  it('ne supprime rien si sous la limite', async () => {
    const pageId = createId()
    await db.pageSnapshots.bulkAdd([makeSnapshot(pageId, 1), makeSnapshot(pageId, 2)])
    const deleted = await pruneOldSnapshots(20)
    expect(deleted).toBe(0)
    expect(await db.pageSnapshots.count()).toBe(2)
  })

  it('applique la limite indépendamment par page', async () => {
    const pageA = createId()
    const pageB = createId()
    const snapshots: PageSnapshot[] = []
    for (let i = 0; i < 21; i++) snapshots.push(makeSnapshot(pageA, i))
    for (let i = 0; i < 5; i++) snapshots.push(makeSnapshot(pageB, i))
    await db.pageSnapshots.bulkAdd(snapshots)

    const deleted = await pruneOldSnapshots(20)
    expect(deleted).toBe(1)
    expect(await db.pageSnapshots.where('pageId').equals(pageA).count()).toBe(20)
    expect(await db.pageSnapshots.where('pageId').equals(pageB).count()).toBe(5)
  })
})

describe('pruneOrphanThumbnails', () => {
  beforeEach(resetDb)

  it('supprime les miniatures dont la page ou le carnet est absent', async () => {
    const nb = makeTestNotebook()
    const page = makeTestPage(nb.id)
    await db.notebooks.add(nb)
    await db.pages.add(page)

    await db.thumbnails.bulkAdd([
      { pageId: page.id, notebookId: nb.id, dataUrl: 'data:image/png;base64,aaaa', updatedAt: 1 },
      { pageId: 'orphan-page', notebookId: nb.id, dataUrl: 'data:image/png;base64,bbbb', updatedAt: 2 },
      { pageId: 'orphan-page-2', notebookId: 'orphan-notebook', dataUrl: 'data:image/png;base64,cccc', updatedAt: 3 },
    ])

    const deleted = await pruneOrphanThumbnails()
    expect(deleted).toBe(2)

    const remaining = await db.thumbnails.toArray()
    expect(remaining).toHaveLength(1)
    expect(remaining[0]?.pageId).toBe(page.id)
  })

  it('supprime les miniatures liées à un carnet supprimé (deletedAt)', async () => {
    const nb = makeTestNotebook({ deletedAt: Date.now() })
    const page = makeTestPage(nb.id)
    await db.notebooks.add(nb)
    await db.pages.add(page)
    await db.thumbnails.add({
      pageId: page.id,
      notebookId: nb.id,
      dataUrl: 'data:image/png;base64,aaaa',
      updatedAt: 1,
    })

    const deleted = await pruneOrphanThumbnails()
    expect(deleted).toBe(1)
    expect(await db.thumbnails.count()).toBe(0)
  })

  it('ne supprime rien si tout est valide', async () => {
    const nb = makeTestNotebook()
    const page = makeTestPage(nb.id)
    await db.notebooks.add(nb)
    await db.pages.add(page)
    await db.thumbnails.add({
      pageId: page.id,
      notebookId: nb.id,
      dataUrl: 'data:image/png;base64,aaaa',
      updatedAt: 1,
    })
    expect(await pruneOrphanThumbnails()).toBe(0)
  })
})

describe('runAutoCleanup', () => {
  beforeEach(resetDb)

  it('combine assets orphelins, instantanés et miniatures orphelines', async () => {
    const nb = makeTestNotebook()
    const page = makeTestPage(nb.id)
    await db.notebooks.add(nb)
    await db.pages.add(page)

    // Asset orphelin (non référencé)
    await db.assets.add({
      id: createId(),
      notebookId: nb.id,
      mimeType: 'image/png',
      blob: new Blob(['x']),
      createdAt: Date.now(),
    })

    // Trop d'instantanés pour la page
    const snapshots: PageSnapshot[] = []
    for (let i = 0; i < 25; i++) snapshots.push(makeSnapshot(page.id, i))
    await db.pageSnapshots.bulkAdd(snapshots)

    // Miniature orpheline
    await db.thumbnails.add({
      pageId: 'orphan-page',
      notebookId: nb.id,
      dataUrl: 'data:image/png;base64,aaaa',
      updatedAt: 1,
    })

    const result = await runAutoCleanup(20)
    expect(result.orphanAssets).toBe(1)
    expect(result.prunedSnapshots).toBe(5)
    expect(result.orphanThumbnails).toBe(1)
  })
})
