import JSZip from 'jszip'
import { describe, expect, it, vi } from 'vitest'
import { FORMA_V2_THUMBNAIL_PREFIX } from './forma-types'
import { extractFormaThumbnailsFromZip, remapThumbnailKeys, seedImportedPageThumbnails } from './forma-thumbnails'
import { makeTestLibraryPayload } from './forma-test-fixtures'
import { sidebarThumbQueue } from './thumb-queue'

describe('forma-thumbnails', () => {
  it('extractFormaThumbnailsFromZip reads page PNGs', async () => {
    const payload = makeTestLibraryPayload()
    const pageId = payload.pages[0].id
    const zip = new JSZip()
    zip.file(`${FORMA_V2_THUMBNAIL_PREFIX}${pageId}.png`, new Uint8Array([137, 80, 78, 71]))
    const map = await extractFormaThumbnailsFromZip(zip)
    expect(map.size).toBe(1)
    expect(map.get(pageId)).toBeInstanceOf(Blob)
  })

  it('remapThumbnailKeys follows page id remap', () => {
    const blob = new Blob([1], { type: 'image/png' })
    const mapped = remapThumbnailKeys(
      new Map([['page-old', blob]]),
      new Map([['page-old', 'page-new']]),
    )
    expect(mapped.has('page-new')).toBe(true)
    expect(mapped.has('page-old')).toBe(false)
  })

  it('seedImportedPageThumbnails preloads sidebar and library cache', () => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:seed-test' })
    sidebarThumbQueue.clear()
    const payload = makeTestLibraryPayload()
    const pageId = payload.pages[0].id
    const blob = new Blob([1, 2, 3], { type: 'image/png' })
    const count = seedImportedPageThumbnails(new Map([[pageId, blob]]), payload.pages)
    expect(count).toBe(1)
    expect(sidebarThumbQueue.peek(pageId)).toBe('blob:seed-test')
    sidebarThumbQueue.clear()
    vi.unstubAllGlobals()
  })
})
