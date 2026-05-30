import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./pdf-backfill', () => ({
  backfillMissingPdfText: vi.fn(async () => 0),
}))

vi.mock('../stores/confirmStore', () => ({
  confirm: vi.fn(async () => true),
}))

import { db } from '../db'
import { saveCloudSnapshot, listCloudSnapshots } from './cloud-snapshots'
import { exportSnapshotFile, importSnapshotFile, SNAPSHOT_FILE_VERSION } from './snapshot-file'
import { makeTestNotebook, makeTestPage } from './forma-test-fixtures'
import { clearSaveJournal } from './save-journal'
import type { FormaDocument } from '../types'
import JSZip from 'jszip'

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

describe('snapshot-file', () => {
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

  it('exports a snapshot to a .formasnap zip with both archives and meta', async () => {
    await db.notebooks.add(makeTestNotebook({ id: 'nb-1' }))
    await db.pages.add(makeTestPage('nb-1', { id: 'p-1', order: 0 }))
    await db.formaDocuments.add(makeDoc('d1'))

    const meta = await saveCloudSnapshot('MySnap')
    const blob = await exportSnapshotFile(meta.id)

    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    expect(zip.file('library.forma.zip')).toBeTruthy()
    expect(zip.file('modules.formamods.zip')).toBeTruthy()
    const m = JSON.parse(await zip.file('snapshot.json')!.async('string'))
    expect(m.fileVersion).toBe(SNAPSHOT_FILE_VERSION)
    expect(m.label).toBe('MySnap')
    expect(m.notebooks).toBe(1)
  })

  it('round-trips: export file then import creates an equivalent snapshot', async () => {
    await db.notebooks.add(makeTestNotebook({ id: 'nb-1' }))
    await db.pages.add(makeTestPage('nb-1', { id: 'p-1', order: 0 }))
    const meta = await saveCloudSnapshot('Original')
    const blob = await exportSnapshotFile(meta.id)

    // Efface tous les instantanés, puis réimporte le fichier.
    await db.cloudSnapshots.clear()
    expect(await listCloudSnapshots()).toHaveLength(0)

    const imported = await importSnapshotFile(new File([blob], 'snap.formasnap.zip'))
    expect(imported.label).toBe('Original (importé)')
    expect(imported.notebooks).toBe(1)
    expect(imported.pages).toBe(1)

    const row = await db.cloudSnapshots.get(imported.id)
    expect(row?.libraryBytes.byteLength).toBeGreaterThan(0)
  })

  it('rejects a file without the library archive', async () => {
    const zip = new JSZip()
    zip.file('snapshot.json', JSON.stringify({ fileVersion: 1 }))
    const bad = await zip.generateAsync({ type: 'blob' })
    await expect(importSnapshotFile(new File([bad], 'bad.zip'))).rejects.toThrow()
  })
})
