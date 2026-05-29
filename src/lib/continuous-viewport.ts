/** Helpers vue continue — prefetch et marge viewport (Phase 2). */

export function computePrefetchIndices(
  centerIndex: number,
  total: number,
  radius = 2,
): number[] {
  if (total <= 0 || centerIndex < 0) return []
  const out: number[] = []
  for (let i = centerIndex - radius; i <= centerIndex + radius; i++) {
    if (i >= 0 && i < total) out.push(i)
  }
  return out
}

/** Marge IntersectionObserver selon taille du carnet. */
export function continuousRootMargin(pageCount: number): string {
  if (pageCount > 80) return '80px 0px'
  if (pageCount > 40) return '120px 0px'
  return '240px 0px'
}

/** Délai avant démontage canvas hors viewport (évite flash au scroll rapide). */
export const CONTINUOUS_UNMOUNT_MS = 700

/** Nombre max de PageCanvas montés simultanément (page active incluse). */
export function maxMountedCanvases(pageCount: number): number {
  if (pageCount <= 15) return pageCount
  if (pageCount <= 40) return 5
  if (pageCount <= 80) return 4
  return 3
}
