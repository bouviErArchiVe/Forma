/**
 * formadoc-assets.ts
 *
 * Migration bidirectionnelle HTML ↔ assets pour FormaDoc.
 * Les images inline base64 sont stockées dans la table `assets` (Dexie)
 * et référencées dans le HTML via `data-asset-id` pour éviter les QuotaExceededError.
 */

import { db } from '../db'
import { createId } from './id'

/**
 * Scanne le HTML FormaDoc, extrait les <img src="data:..."> inline,
 * les convertit en blobs dans la table assets, et remplace les src
 * par data-asset-id="<id>" (src vide).
 * Retourne le HTML transformé + les IDs des assets créés.
 */
export async function extractInlineImagesToAssets(
  html: string,
  notebookId: string,
): Promise<{ html: string; assetIds: string[] }> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const imgs = Array.from(doc.querySelectorAll('img[src^="data:"]'))
  const assetIds: string[] = []

  for (const img of imgs) {
    const src = img.getAttribute('src')!
    const mimeType = src.match(/:(.*?);/)?.[1] ?? 'image/png'
    let blob: Blob
    try {
      const res = await fetch(src)
      blob = await res.blob()
    } catch {
      // Fallback: manual atob decode
      const b64 = src.split(',')[1] ?? ''
      const binary = atob(b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      blob = new Blob([bytes], { type: mimeType })
    }

    const id = createId()
    await db.assets.put({ id, notebookId, blob, mimeType, createdAt: Date.now() })
    img.setAttribute('data-asset-id', id)
    img.removeAttribute('src')
    assetIds.push(id)
  }

  return { html: doc.body.innerHTML, assetIds }
}

/**
 * À l'affichage : reconstruit les src blob URL depuis les data-asset-id.
 * Retourne le HTML avec src="blob:..." pour l'affichage ainsi que
 * la liste des blob URLs créées (à révoquer à l'unmount).
 */
export async function resolveAssetImages(
  html: string,
): Promise<{ html: string; blobUrls: string[] }> {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const imgs = Array.from(doc.querySelectorAll('img[data-asset-id]'))
  const blobUrls: string[] = []

  for (const img of imgs) {
    const assetId = img.getAttribute('data-asset-id')!
    const asset = await db.assets.get(assetId)
    if (asset) {
      const url = URL.createObjectURL(asset.blob)
      blobUrls.push(url)
      img.setAttribute('src', url)
    }
  }

  return { html: doc.body.innerHTML, blobUrls }
}
