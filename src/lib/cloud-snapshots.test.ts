import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./pdf-backfill', () => ({
  backfillMissingPdfText: vi.fn(async () => 0),
}))

vi.mock('../stores/confirmStore', () => ({
  confirm: vi.fn(async () => true),
}))

import { db } from '../db'
import {
  deleteCloudSnapshot,
  latestCloudSnapshot,
  listCloudSnapshots,
  MAX_CLOUD_SNAPSHOTS,
  migrateLegacyCloudSlot,
  pruneCloudSnapshots,
  restoreCloudSnapshot,
  saveCloudSnapshot,
} from './cloud-snapshots'
import { makeTestNotebook, makeTestPage } from './forma-test-fixtures'
import { clearSaveJournal } from './save-journal'
import type { FormaDocument } from '../types'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

function makeDoc(id: string): FormaDocument {
  return {
    id,
    name: `Doc ${id}`,
    templateId: 'blank',
    createdAt: 1,
    updatedAt: 2,
    fontFamily: 'serif',
    fontSize: 14,
    lineHeight: 1.5,
    pages: [{ id: `${id}-p1`, html: '<p>x</p>' }],
  }
}

describe('cloud-snapshots', () => {
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

  it('saves a snapshot bundling notebooks and module data', async () => {
    await db.notebooks.add(makeTestNotebook({ id: 'nb-1' }))
    await db.pages.add(makeTestPage('nb-1', { id: 'p-1', order: 0 }))
    await db.formaDocuments.add(makeDoc('d1'))

    const meta = await saveCloudSnapshot('Test')
    expect(meta.label).toBe('Test')
    expect(meta.notebooks).toBe(1)
    expect(meta.pages).toBe(1)
    expect(meta.hasModules).toBe(true)
    expect(meta.size).toBeGreaterThan(0)

    const list = await listCloudSnapshots()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(meta.id)
  })

  it('prunes oldest snapshots beyond MAX', async () => {
    await db.notebooks.add(makeTestNotebook({ id: 'nb-1' }))
    for (let i = 0; i < MAX_CLOUD_SNAPSHOTS + 3; i++) {
      await saveCloudSnapshot(`snap-${i}`)
    }
    const list = await listCloudSnapshots()
    expect(list).toHaveLength(MAX_CLOUD_SNAPSHOTS)
    // Les plus récents sont conservés (ordre décroissant).
    expect(list[0].label).toBe(`snap-${MAX_CLOUD_SNAPSHOTS + 2}`)
  })

  it('restores a snapshot (replace) including modules', async () => {
    await db.notebooks.add(makeTestNotebook({ id: 'nb-keep' }))
    await db.pages.add(makeTestPage('nb-keep', { id: 'p-keep', order: 0 }))
    await db.formaDocuments.add(makeDoc('d-keep'))

    const meta = await saveCloudSnapshot('before')

    // Pollue l'état local après l'instantané.
    await db.notebooks.add(makeTestNotebook({ id: 'nb-noise', name: 'Noise' }))
    await db.formaDocuments.add(makeDoc('d-noise'))

    const result = await restoreCloudSnapshot(meta.id, { mode: 'replace', confirmed: true })
    expect(result.library.notebooks).toBe(1)
    expect(result.modules?.formaDocuments).toBe(1)

    const nbs = await db.notebooks.toArray()
    expect(nbs).toHaveLength(1)
    expect(nbs[0].id).toBe('nb-keep')
    const docs = await db.formaDocuments.toArray()
    expect(docs.map((d) => d.id)).toEqual(['d-keep'])
  })

  it('deletes a snapshot', async () => {
    await db.notebooks.add(makeTestNotebook({ id: 'nb-1' }))
    const meta = await saveCloudSnapshot()
    await deleteCloudSnapshot(meta.id)
    expect(await latestCloudSnapshot()).toBeNull()
  })

  it('migrates a legacy localStorage cloud slot into a snapshot once', async () => {
    // dataURL d'un petit blob zip factice.
    const dataUrl = 'data:application/zip;base64,UEsDBAoAAAAAAA=='
    localStorage.setItem('forma-cloud-slot', dataUrl)

    const migrated = await migrateLegacyCloudSlot()
    expect(migrated).toBe(true)
    expect(localStorage.getItem('forma-cloud-slot')).toBeNull()

    const list = await listCloudSnapshots()
    expect(list.some((s) => s.label.includes('migrée'))).toBe(true)

    // Idempotent : un second appel ne recrée rien.
    const again = await migrateLegacyCloudSlot()
    expect(again).toBe(false)
  })

  it('pruneCloudSnapshots returns count removed', async () => {
    await db.notebooks.add(makeTestNotebook({ id: 'nb-1' }))
    for (let i = 0; i < 3; i++) await saveCloudSnapshot(`s${i}`)
    const removed = await pruneCloudSnapshots(1)
    expect(removed).toBe(2)
    expect(await listCloudSnapshots()).toHaveLength(1)
  })
})
