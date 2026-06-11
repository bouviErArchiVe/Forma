/** Convertit blob:/http: en data: pour exports autonomes (SVG, etc.). */

/** Taille max (octets estimés) pour inline `data:` image dans SVG ; au-delà, skip + note. */
export const SVG_INLINE_DATA_URL_MAX_BYTES = 256 * 1024

export type ExportImageResolveResult = {
  href?: string
  skipped?: boolean
  note?: string
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(new Error('Lecture blob impossible'))
    r.readAsDataURL(blob)
  })
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  if (comma < 0) return dataUrl.length
  const payload = dataUrl.slice(comma + 1)
  if (dataUrl.slice(0, comma).includes(';base64')) {
    return Math.ceil((payload.length * 3) / 4)
  }
  return payload.length
}

export async function resolveExportDataUrl(src: string | undefined): Promise<string | undefined> {
  if (!src) return undefined
  if (src.startsWith('data:')) return src
  try {
    const blob = await fetch(src).then((res) => res.blob())
    return await blobToDataUrl(blob)
  } catch {
    return undefined
  }
}

/**
 * Résout href image pour export SVG : préfère blob:/http: (asset) sans inline ;
 * skip les data: trop volumineux avec note explicative.
 */
export async function resolveExportImageHref(
  src: string | undefined,
  assetId?: string,
): Promise<ExportImageResolveResult> {
  if (!src) return {}
  if (src.startsWith('blob:') || src.startsWith('http:') || src.startsWith('https:')) {
    return { href: src }
  }
  if (src.startsWith('data:')) {
    const bytes = estimateDataUrlBytes(src)
    if (bytes > SVG_INLINE_DATA_URL_MAX_BYTES) {
      const kb = Math.round(bytes / 1024)
      const limitKb = Math.round(SVG_INLINE_DATA_URL_MAX_BYTES / 1024)
      const ref = assetId ? ` (asset ${assetId})` : ''
      return {
        skipped: true,
        note: `Image omise (${kb} ko > ${limitKb} ko)${ref}`,
      }
    }
    return { href: src }
  }
  const href = await resolveExportDataUrl(src)
  return href ? { href } : {}
}
