import type JSZip from 'jszip'
import { FORMA_V2_THUMBNAIL_PREFIX } from './forma-types'
import type { Page } from '../types'
import { libraryThumbQueue, sidebarThumbQueue } from './thumb-queue'

/** Lit les PNG vignettes optionnels d’un package `.forma v2`. */
export async function extractFormaThumbnailsFromZip(zip: JSZip): Promise<Map<string, Blob>> {
  const out = new Map<string, Blob>()
  for (const path of Object.keys(zip.files)) {
    if (!path.startsWith(FORMA_V2_THUMBNAIL_PREFIX) || !path.endsWith('.png')) continue
    const pageId = path.slice(FORMA_V2_THUMBNAIL_PREFIX.length, -4)
    if (!pageId) continue
    const file = zip.file(path)
    if (!file) continue
    out.set(pageId, await file.async('blob'))
  }
  return out
}

/** Précharge le cache miniatures (sidebar + couverture bibliothèque) après import. */
export function seedImportedPageThumbnails(
  thumbnails: Map<string, Blob>,
  pages: Page[],
): number {
  if (thumbnails.size === 0) return 0
  const notebookByPage = new Map(pages.map((p) => [p.id, p.notebookId]))
  const coverSeeded = new Set<string>()
  let seeded = 0
  for (const [pageId, blob] of thumbnails) {
    const url = URL.createObjectURL(blob)
    sidebarThumbQueue.seedCache(pageId, url)
    seeded++
    const nbId = notebookByPage.get(pageId)
    if (nbId && !coverSeeded.has(nbId)) {
      libraryThumbQueue.seedCache(nbId, url)
      coverSeeded.add(nbId)
    }
  }
  return seeded
}
