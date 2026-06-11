import { revokeAllAssetUrls } from './assets'
import { clearPdfRenderCache } from './pdf-page-render'
import { clearPageImageCache } from './page-render'

/** Réduit les caches quand la mémoire est contrainte (addendum §16). */
export function reduceMemoryCaches(): void {
  clearPdfRenderCache()
  clearPageImageCache()
  revokeAllAssetUrls()
}

export function setupMemoryPressureListener(): () => void {
  if (!('memory' in performance)) return () => {}

  const check = () => {
    const mem = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } })
      .memory
    if (!mem) return
    if (mem.usedJSHeapSize / mem.jsHeapSizeLimit > 0.85) {
      reduceMemoryCaches()
      void import('./assets').then(({ garbageCollectOrphanAssets }) =>
        garbageCollectOrphanAssets().catch(() => {}),
      )
    }
  }

  const id = window.setInterval(check, 30_000)
  return () => clearInterval(id)
}
