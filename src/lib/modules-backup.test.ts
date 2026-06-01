import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { exportModulesBundle, importModulesBundle, MODULE_PREF_KEYS } from './modules-backup'
import { putAsset } from './assets'
import type { FormaDocument, MoodboardBoard, MoodboardImage } from '../types'
import type { LibraryItem } from './formalibrary/model'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

function makeDoc(id: string): FormaDocument {
  return {
    id,
    name: `Doc ${id}`,
    templateId: 'blank' as FormaDocument['templateId'],
    createdAt: 1000,
    updatedAt: 2000,
    fontFamily: 'serif',
    fontSize: 14,
    lineHeight: 1.5,
    pages: [{ id: `${id}-p1`, html: '<p>hello</p>' } as FormaDocument['pages'][number]],
  }
}

function makeBoard(id: string): MoodboardBoard {
  return {
    id,
    name: `Board ${id}`,
    emoji: '🎨',
    color: '#fff',
    archived: false,
    createdAt: 1,
    updatedAt: 2,
  }
}

function makeImage(id: string, boardId: string, assetId: string): MoodboardImage {
  return {
    id,
    boardId,
    assetId,
    name: 'img',
    tags: [],
    description: '',
    starred: false,
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    rotation: 0,
    zIndex: 1,
    createdAt: 1,
    updatedAt: 2,
  }
}

function makeLibItem(id: string, blob?: Blob): LibraryItem {
  return {
    id,
    folderId: null,
    name: `Item ${id}`,
    category: 'image',
    tags: [],
    favorite: false,
    mimeType: blob ? blob.type : '',
    textContent: '',
    createdAt: 1,
    updatedAt: 2,
    blob,
  } as LibraryItem
}

describe('modules-backup', () => {
  beforeEach(async () => {
    await resetDb()
    for (const k of MODULE_PREF_KEYS) localStorage.removeItem(k)
  })

  it('round-trips module tables, library blobs, moodboard assets and prefs', async () => {
    await db.formaDocuments.bulkPut([makeDoc('d1'), makeDoc('d2')])
    await db.moodboardBoards.put(makeBoard('b1'))
    await putAsset('asset-1', 'moodboard:b1', new Blob([1, 2, 3, 4], { type: 'image/png' }), 'image/png')
    await db.moodboardImages.put(makeImage('mi1', 'b1', 'asset-1'))
    await db.libraryItems.put(
      makeLibItem('li1', new Blob(['SVGDATA'], { type: 'image/svg+xml' })),
    )
    await db.settings.put({ key: 'foo', value: 'bar' })
    localStorage.setItem('forma-focus-prefs', '{"workMin":30}')
    localStorage.setItem(
      'forma-formula-prefs',
      JSON.stringify({ state: { favorites: ['blondel'], recent: ['area-rect'], lengthUnit: 'cm' }, version: 0 }),
    )
    localStorage.setItem(
      'forma-formula-history',
      JSON.stringify({
        state: {
          entries: [
            {
              id: 'h1',
              formulaId: 'blondel',
              title: 'Loi de Blondel',
              mode: 'height-steps',
              values: { totalHeight: '280', steps: '18' },
              summary: '2H + G = 62 cm',
              createdAt: 1000,
            },
          ],
        },
        version: 0,
      }),
    )

    const blob = await exportModulesBundle()
    expect(blob.size).toBeGreaterThan(0)

    // Le ZIP externalise le blob bibliothèque et l'asset moodboard dans des fichiers dédiés.
    // (fake-indexeddb ne restitue pas fidèlement les octets d'un Blob ; en prod oui.)
    const JSZip = (await import('jszip')).default
    const checkZip = await JSZip.loadAsync(await blob.arrayBuffer())
    expect(checkZip.file('lib-blobs/li1.svg')).toBeTruthy()
    expect(checkZip.file('assets/asset-1.png')).toBeTruthy()
    expect(checkZip.file('modules.json')).toBeTruthy()

    // Efface tout puis réimporte en mode remplacement.
    await db.formaDocuments.clear()
    await db.moodboardBoards.clear()
    await db.moodboardImages.clear()
    await db.libraryItems.clear()
    await db.assets.clear()
    await db.settings.clear()
    localStorage.removeItem('forma-focus-prefs')
    localStorage.removeItem('forma-formula-prefs')
    localStorage.removeItem('forma-formula-history')

    const counts = await importModulesBundle(new File([blob], 'm.formamods.zip'), 'replace')
    expect(counts.formaDocuments).toBe(2)
    expect(counts.moodboardImages).toBe(1)
    expect(counts.libraryItems).toBe(1)

    expect((await db.formaDocuments.toArray()).map((d) => d.id).sort()).toEqual(['d1', 'd2'])
    const restoredAsset = await db.assets.get('asset-1')
    expect(restoredAsset).toBeDefined()
    const restoredItem = await db.libraryItems.get('li1')
    // fake-indexeddb renvoie une forme sérialisée (pas une instance Blob) ; en prod c'est un Blob.
    expect(restoredItem?.blob).toBeDefined()
    expect(restoredItem?.mimeType).toBe('image/svg+xml')
    expect((await db.settings.get('foo'))?.value).toBe('bar')
    expect(localStorage.getItem('forma-focus-prefs')).toBe('{"workMin":30}')
    expect(localStorage.getItem('forma-formula-prefs')).toContain('blondel')
    expect(localStorage.getItem('forma-formula-history')).toContain('Loi de Blondel')
  })

  it('merge mode keeps existing rows and adds only new ones', async () => {
    await db.formaDocuments.put(makeDoc('d1'))
    const blob = await exportModulesBundle()

    // Modifie d1 localement et ajoute d3 ; l'import ne doit pas écraser d1.
    await db.formaDocuments.put({ ...makeDoc('d1'), name: 'LOCAL EDIT' })
    await db.formaDocuments.put(makeDoc('d3'))

    await importModulesBundle(new File([blob], 'm.formamods.zip'), 'merge')

    expect((await db.formaDocuments.get('d1'))?.name).toBe('LOCAL EDIT')
    expect((await db.formaDocuments.get('d3'))?.name).toBe('Doc d3')
  })

  it('rejects an archive without modules.json', async () => {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    zip.file('nope.txt', 'x')
    const bad = await zip.generateAsync({ type: 'blob' })
    await expect(importModulesBundle(new File([bad], 'bad.zip'))).rejects.toThrow()
  })
})
