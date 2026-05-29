/** Taille max cache bitmap PDF (LRU insertion-order Map). */
export const PDF_PAGE_CACHE_MAX = 36

/** Rayon prefetch par défaut (±N pages autour du centre, vue continue). */
export const PDF_PREFETCH_RADIUS = 2

/** Concurrence max prefetch fire-and-forget (évite saturation worker PDF). */
export const PDF_PREFETCH_MAX_CONCURRENT = 3

export function pdfPageCacheKey(scope: string, pageIndex: number, dpr: number): string {
  return `${scope}:${pageIndex}:${dpr}`
}

export function pdfDocCacheKey(source: string, scope: string): string {
  return scope || source.slice(0, 96)
}

/** Index 0-based → numéro page PDF 1-based, clampé. */
export function clampPdfPageNumber(pageIndex: number, numPages: number): number {
  if (numPages <= 0) return 1
  return Math.min(Math.max(1, pageIndex + 1), numPages)
}

/** Échelle viewport pour couvrir la zone page Forma à DPR donné. */
export function computePdfFitScale(
  pdfWidth: number,
  pdfHeight: number,
  pageWidth: number,
  pageHeight: number,
  dpr: number,
): number {
  return Math.max(pageWidth / pdfWidth, pageHeight / pdfHeight) * dpr
}

/**
 * Ordonne indices prefetch : centre d'abord, puis voisins par distance croissante.
 * `centerIndex` est un index PDF (pdfPageIndex), pas l'index dans le carnet.
 */
export function orderPdfPrefetchIndices(
  pageIndices: number[],
  centerIndex?: number,
): number[] {
  const unique = [...new Set(pageIndices)].filter((i) => i >= 0)
  if (centerIndex == null) return unique
  return unique.sort((a, b) => {
    const da = Math.abs(a - centerIndex)
    const db = Math.abs(b - centerIndex)
    return da !== db ? da - db : a - b
  })
}

export function defaultPdfDpr(exportMode = false): number {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  return exportMode ? Math.min(3, Math.max(2, dpr)) : Math.min(2, Math.max(1, dpr))
}

/** Parcours simulés bench dev (Paramètres → Bench PDF). */
export const PDF_BENCH_PAGE_COUNTS = [50, 100, 200] as const

/** Indices 0..count-1 pour simuler un scroll / prefetch sur N pages. */
export function buildPdfBenchPageIndices(count: number): number[] {
  const n = Math.max(0, Math.floor(count))
  return Array.from({ length: n }, (_, i) => i)
}
