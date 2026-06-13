/**
 * thumbnails — vignettes des items Combine (image ou première page de PDF).
 *
 * - Image : URL objet via le cache global lib/assets (resolveAssetUrl) —
 *   AUCUNE revocation ici, le cache global s'en charge.
 * - PDF : première page rendue en data URL JPEG (qualité 0.7) via pdfjs
 *   (worker partagé). Toute erreur (PDF corrompu, canvas indisponible…)
 *   → null, jamais de throw. Garde-fou : pas de rendu au-delà de 50 Mo.
 * - Cache mémoire LRU borné (Map assetId → url, réinsertion à chaque accès)
 *   pour ne pas re-rendre à chaque render de la liste.
 */
import { db } from '../../db'
import { resolveAssetUrl } from '../../lib/assets'
import { ensurePdfWorker } from '../../lib/pdf-worker-setup'

/** Au-delà de cette taille, on ne tente pas de rendre la vignette PDF. */
const MAX_PDF_THUMB_BYTES = 50 * 1024 * 1024

const THUMB_CACHE_MAX = 50
const thumbCache = new Map<string, string>()

/** Réinsertion LRU + éviction des entrées les plus anciennes au-delà de la borne. */
function rememberThumb(assetId: string, url: string): string {
  thumbCache.delete(assetId)
  thumbCache.set(assetId, url)
  while (thumbCache.size > THUMB_CACHE_MAX) {
    const oldest = thumbCache.keys().next().value
    if (oldest === undefined) break
    thumbCache.delete(oldest)
  }
  return url
}

/** Taille courante du cache (tests). */
export function getThumbCacheSize(): number {
  return thumbCache.size
}

/** Vide le cache (tests). */
export function clearThumbCache(): void {
  thumbCache.clear()
}

/**
 * URL objet d'une image stockée. Réutilise le cache global lib/assets :
 * pas de revocation ici. Chaîne vide si l'asset n'existe pas.
 */
export async function imageThumbUrl(assetId: string): Promise<string> {
  const hit = thumbCache.get(assetId)
  if (hit) return rememberThumb(assetId, hit)
  const url = await resolveAssetUrl(assetId)
  if (url) rememberThumb(assetId, url)
  return url
}

/**
 * Première page d'un PDF → data URL JPEG dont max(largeur, hauteur) ≈ maxDim.
 * Retourne null sur toute erreur (jamais de throw) et sans rendu si > 50 Mo.
 */
export async function pdfThumbDataUrl(blob: Blob, maxDim = 96): Promise<string | null> {
  if (blob.size > MAX_PDF_THUMB_BYTES) return null
  try {
    ensurePdfWorker()
    const pdfjs = await import('pdfjs-dist')
    const data = await blob.arrayBuffer()
    const doc = await pdfjs.getDocument({ data }).promise
    try {
      const page = await doc.getPage(1)
      const base = page.getViewport({ scale: 1 })
      const scale = maxDim / Math.max(base.width, base.height, 1)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(viewport.width))
      canvas.height = Math.max(1, Math.round(viewport.height))
      const ctx = canvas.getContext('2d')
      if (!ctx) return null
      await page.render({ canvas, canvasContext: ctx, viewport }).promise
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
      // Libère le canvas temporaire immédiatement après encodage
      canvas.width = 0
      canvas.height = 0
      page.cleanup()
      return dataUrl
    } finally {
      void doc.destroy()
    }
  } catch {
    return null
  }
}

/**
 * Vignette d'un item Combine (cache LRU par assetId).
 * null → l'appelant affiche le fallback icône. Ne throw jamais.
 */
export async function thumbUrlForAsset(
  assetId: string,
  kind: 'pdf' | 'image',
): Promise<string | null> {
  const hit = thumbCache.get(assetId)
  if (hit) return rememberThumb(assetId, hit)
  try {
    if (kind === 'image') {
      const url = await imageThumbUrl(assetId)
      return url === '' ? null : url
    }
    const asset = await db.assets.get(assetId)
    if (!asset) return null
    const dataUrl = await pdfThumbDataUrl(asset.blob)
    if (dataUrl) rememberThumb(assetId, dataUrl)
    return dataUrl
  } catch {
    return null
  }
}
