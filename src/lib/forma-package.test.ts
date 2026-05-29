import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { exportLibraryFormaPackage, importFormaPackage } from './forma-package'
import { computeFormaPayloadDigest } from './forma-validate'
import { makeTestLibraryPayload, makeTestPage } from './forma-test-fixtures'
import { FORMA_FORMAT_VERSION, FORMA_FORMAT_VERSION_V2, FORMA_V2_THUMBNAIL_PREFIX } from './forma-types'

/** Package minimal sans accès Dexie (pages sans assetId blob). */
async function buildMinimalFormaZip(): Promise<Blob> {
  const payload = makeTestLibraryPayload()
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
  zip.file(
    'metadata.json',
    JSON.stringify({
      notebookCount: payload.notebooks.length,
      pageCount: payload.pages.length,
      folderCount: 0,
    }),
  )
  zip.file('indexes/folders.json', JSON.stringify(payload.folders))
  zip.file('indexes/notebooks.json', JSON.stringify(payload.notebooks))
  zip.file('indexes/audio.json', '[]')
  zip.file('indexes/study.json', '[]')
  zip.file('indexes/share-links.json', '[]')
  zip.file('indexes/snapshots.json', '[]')
  for (const nb of payload.notebooks) {
    zip.file(`notebooks/${nb.id}.json`, JSON.stringify(nb))
  }
  for (const page of payload.pages) {
    zip.file(`pages/${page.id}.json`, JSON.stringify(page))
    if (page.strokes.length) {
      zip.file(`strokes/${page.id}.json`, JSON.stringify(page.strokes))
    }
  }
  zip.file('backup.json', JSON.stringify({ version: 4, exportedAt, ...payload }))
  return zip.generateAsync({ type: 'blob' })
}

describe('forma-package import', () => {
  it('imports forma-v1 and restores strokes', async () => {
    const blob = await buildMinimalFormaZip()
    const file = new File([blob], 'test.forma.zip', { type: 'application/zip' })
    const { data, result } = await importFormaPackage(file)
    expect(result.format).toBe('forma-v1')
    expect(data.pages).toHaveLength(1)
    expect(data.pages[0].strokes).toHaveLength(1)
    expect(result.skippedPages).toBe(0)
  })

  it('imports forma-v2 thumbnails from zip', async () => {
    const payload = makeTestLibraryPayload()
    const pageId = payload.pages[0].id
    const zip = new JSZip()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: FORMA_FORMAT_VERSION_V2,
        appVersion: 'test',
        exportedAt: Date.now(),
        packageType: 'library',
      }),
    )
    zip.file('metadata.json', JSON.stringify({ notebookCount: 1, pageCount: 1, folderCount: 0 }))
    zip.file('indexes/folders.json', '[]')
    zip.file('indexes/notebooks.json', JSON.stringify(payload.notebooks))
    zip.file('indexes/audio.json', '[]')
    zip.file('indexes/study.json', '[]')
    zip.file('indexes/share-links.json', '[]')
    zip.file('indexes/snapshots.json', '[]')
    zip.file(`pages/${pageId}.json`, JSON.stringify(payload.pages[0]))
    zip.file(`strokes/${pageId}.json`, JSON.stringify(payload.pages[0].strokes))
    zip.file(`${FORMA_V2_THUMBNAIL_PREFIX}${pageId}.png`, new Uint8Array([137, 80, 78, 71]))
    zip.file('backup.json', '{}')

    const blob = await zip.generateAsync({ type: 'blob' })
    const { result, thumbnails } = await importFormaPackage(
      new File([blob], 'v2.forma.zip', { type: 'application/zip' }),
    )
    expect(result.format).toBe('forma-v2')
    expect(result.importedThumbnails).toBe(1)
    expect(thumbnails?.size).toBe(1)
  })

  it('skips corrupt page but keeps valid pages', async () => {
    const payload = makeTestLibraryPayload()
    const good = payload.pages[0]
    const extra = makeTestPage(payload.notebooks[0].id, { id: 'page-good-2', order: 1 })
    const zip = new JSZip()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: FORMA_FORMAT_VERSION,
        appVersion: 'test',
        exportedAt: Date.now(),
        packageType: 'library',
      }),
    )
    zip.file('metadata.json', JSON.stringify({ notebookCount: 1, pageCount: 2, folderCount: 0 }))
    zip.file('indexes/folders.json', '[]')
    zip.file('indexes/notebooks.json', JSON.stringify(payload.notebooks))
    zip.file('indexes/audio.json', '[]')
    zip.file('indexes/study.json', '[]')
    zip.file('indexes/share-links.json', '[]')
    zip.file('indexes/snapshots.json', '[]')
    zip.file(`pages/${good.id}.json`, JSON.stringify(good))
    zip.file(`strokes/${good.id}.json`, JSON.stringify(good.strokes))
    zip.file('pages/bad-page.json', '{ not valid json')
    zip.file('backup.json', '{}')

    const blob = await zip.generateAsync({ type: 'blob' })
    const { data, result } = await importFormaPackage(
      new File([blob], 'partial.forma.zip', { type: 'application/zip' }),
    )
    expect(result.skippedPages).toBeGreaterThanOrEqual(1)
    expect(data.pages.length).toBeGreaterThanOrEqual(1)
  })

  it('export sets sha256 integrity in manifest', async () => {
    const payload = makeTestLibraryPayload()
    const blob = await exportLibraryFormaPackage(payload)
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const manifest = JSON.parse((await zip.file('manifest.json')!.async('string')) as string)
    expect(manifest.integrity?.algorithm).toBe('sha256')
    expect(manifest.integrity?.digest).toMatch(/^[a-f0-9]{64}$/)
    expect(manifest.integrity.digest).toBe(await computeFormaPayloadDigest(zip))
  })

  it('imports backup.json legacy path', async () => {
    const payload = makeTestLibraryPayload()
    const zip = new JSZip()
    zip.file(
      'backup.json',
      JSON.stringify({
        version: 4,
        exportedAt: Date.now(),
        folders: [],
        notebooks: payload.notebooks,
        pages: payload.pages,
        audio: [],
        studyCards: [],
        shareLinks: [],
      }),
    )
    const blob = await zip.generateAsync({ type: 'blob' })
    const { result } = await importFormaPackage(
      new File([blob], 'legacy.forma.zip', { type: 'application/zip' }),
    )
    expect(result.format).toBe('backup-json')
    expect(result.pages).toBe(1)
  })
})
