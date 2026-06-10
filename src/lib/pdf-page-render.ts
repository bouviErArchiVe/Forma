import * as pdfjs from 'pdfjs-dist'
import { PAGE_HEIGHT_PORTRAIT, PAGE_WIDTH_PORTRAIT } from './page-dimensions'
import { ensurePdfWorker } from './pdf-worker-setup'
import {
  buildPdfBenchPageIndices,
  clampPdfPageNumber,
  computePdfFitScale,
  defaultPdfDpr,
  orderPdfPrefetchIndices,
  PDF_BENCH_PAGE_COUNTS,
  PDF_PAGE_CACHE_MAX,
  PDF_PREFETCH_MAX_CONCURRENT,
  pdfDocCacheKey,
  pdfPageCacheKey,
} from './pdf-page-render-helpers'

export {
  buildPdfBenchPageIndices,
  clampPdfPageNumber,
  computePdfFitScale,
  defaultPdfDpr,
  orderPdfPrefetchIndices,
  PDF_BENCH_PAGE_COUNTS,
  PDF_PAGE_CACHE_MAX,
  PDF_PREFETCH_MAX_CONCURRENT,
  PDF_PREFETCH_RADIUS,
  pdfDocCacheKey,
  pdfPageCacheKey,
} from './pdf-page-render-helpers'

const docCache = new Map<string, Promise<pdfjs.PDFDocumentProxy>>()
const pageCache = new Map<string, string>()

/** Max concurrent document loads (prevents saturating memory on multi-notebook scenarios). */
const MAX_DOC_CACHE = 4

function touchPageCache(key: string, value: string): string {
  pageCache.delete(key)
  pageCache.set(key, value)
  return value
}

function evictIfNeeded(): void {
  while (pageCache.size > PDF_PAGE_CACHE_MAX) {
    const first = pageCache.keys().next().value
    if (!first) break
    pageCache.delete(first)
  }
}

/** Evict oldest document from doc cache if over limit, destroying the PDF to free worker memory. */
function evictDocCacheIfNeeded(): void {
  if (docCache.size <= MAX_DOC_CACHE) return
  const firstKey = docCache.keys().next().value
  if (!firstKey) return
  const pending = docCache.get(firstKey)
  docCache.delete(firstKey)
  if (pending) {
    void pending.then((doc) => {
      try { doc.destroy() } catch { /* ignore */ }
    })
  }
}

async function loadPdf(source: string, scope: string): Promise<pdfjs.PDFDocumentProxy> {
  const key = pdfDocCacheKey(source, scope)
  let pending = docCache.get(key)
  if (!pending) {
    evictDocCacheIfNeeded()
    // Use fetch + ArrayBuffer for data URLs; pdfjs handles both
    const data = await fetch(source).then((r) => r.arrayBuffer())
    pending = pdfjs.getDocument({ data }).promise
    docCache.set(key, pending)
  }
  return pending
}

/** Rend une page PDF en data URL PNG (cache LRU, DPR-aware). */
export async function renderPdfPageDataUrl(
  pdfSourceDataUrl: string,
  pageIndex: number,
  dpr = defaultPdfDpr(false),
  cacheScope = 'default',
): Promise<string> {
  ensurePdfWorker()
  const key = pdfPageCacheKey(cacheScope, pageIndex, dpr)
  const hit = pageCache.get(key)
  if (hit) return touchPageCache(key, hit)

  const pdf = await loadPdf(pdfSourceDataUrl, cacheScope)
  const pageNum = clampPdfPageNumber(pageIndex, pdf.numPages)
  const page = await pdf.getPage(pageNum)
  const base = page.getViewport({ scale: 1 })
  const scale = computePdfFitScale(
    base.width,
    base.height,
    PAGE_WIDTH_PORTRAIT,
    PAGE_HEIGHT_PORTRAIT,
    dpr,
  )
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D indisponible')
  await page.render({ canvas, canvasContext: ctx, viewport }).promise
  // Use JPEG for cached page renders to reduce memory footprint (~3-5× smaller than PNG)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
  // Release canvas immediately after encoding
  canvas.width = 0
  canvas.height = 0
  // Release pdfjs internal page resources
  page.cleanup()
  touchPageCache(key, dataUrl)
  evictIfNeeded()
  return dataUrl
}

let prefetchRunning = 0
const prefetchWaitlist: Array<() => void> = []

function schedulePrefetch(task: () => Promise<void>): void {
  const run = () => {
    prefetchRunning++
    void task().finally(() => {
      prefetchRunning--
      const next = prefetchWaitlist.shift()
      if (next) next()
    })
  }
  if (prefetchRunning < PDF_PREFETCH_MAX_CONCURRENT) run()
  else prefetchWaitlist.push(run)
}

/** Précharge des pages PDF (fire-and-forget, centre d'abord, concurrence limitée). */
export function prefetchPdfPages(
  pdfSourceDataUrl: string,
  pageIndices: number[],
  cacheScope: string,
  dpr = defaultPdfDpr(false),
  centerIndex?: number,
): void {
  const ordered = orderPdfPrefetchIndices(pageIndices, centerIndex)
  for (const idx of ordered) {
    const key = pdfPageCacheKey(cacheScope, idx, dpr)
    if (pageCache.has(key)) continue
    schedulePrefetch(() =>
      renderPdfPageDataUrl(pdfSourceDataUrl, idx, dpr, cacheScope).then(() => {}).catch(() => {}),
    )
  }
}

export function getPdfPageCacheSize(): number {
  return pageCache.size
}

export function getPdfPrefetchInFlight(): number {
  return prefetchRunning
}

export function clearPdfRenderCache(): void {
  pageCache.clear()
}

/** Destroy all cached PDF documents to release worker memory (call on notebook close). */
export function clearPdfDocCache(): void {
  for (const pending of docCache.values()) {
    void pending.then((doc) => {
      try { doc.destroy() } catch { /* ignore */ }
    })
  }
  docCache.clear()
  pageCache.clear()
}

export type PdfBenchLoopResult = {
  pageCount: number
  totalMs: number
  avgMs: number
  cacheHits: number
}

/** Bench helper (dev) — mesure le render d'une page PDF (1er appel = cold, 2e = cache). */
export async function benchmarkPdfPageRender(
  pdfSourceDataUrl: string,
  pageIndex: number,
  cacheScope = 'bench',
  dpr = defaultPdfDpr(false),
): Promise<{ ms: number; fromCache: boolean }> {
  const fromCache = pageCache.has(pdfPageCacheKey(cacheScope, pageIndex, dpr))
  const t0 = performance.now()
  await renderPdfPageDataUrl(pdfSourceDataUrl, pageIndex, dpr, cacheScope)
  return { ms: Math.round(performance.now() - t0), fromCache }
}

/** Bench helper (dev) — simule une boucle sur N indices de page et mesure le temps total. */
export async function benchmarkPdfPageLoop(
  pdfSourceDataUrl: string,
  pageCount: number,
  cacheScope = 'bench',
  dpr = defaultPdfDpr(false),
): Promise<PdfBenchLoopResult> {
  const indices = buildPdfBenchPageIndices(pageCount)
  let cacheHits = 0
  const t0 = performance.now()
  for (const idx of indices) {
    if (pageCache.has(pdfPageCacheKey(cacheScope, idx, dpr))) cacheHits++
    await renderPdfPageDataUrl(pdfSourceDataUrl, idx, dpr, cacheScope)
  }
  const totalMs = Math.round(performance.now() - t0)
  return {
    pageCount: indices.length,
    totalMs,
    avgMs: indices.length ? Math.round(totalMs / indices.length) : 0,
    cacheHits,
  }
}

/** Bench helper (dev) — enchaîne 50 / 100 / 200 pages (cache vidé avant chaque palier). */
export async function benchmarkPdfPageCounts(
  pdfSourceDataUrl: string,
  counts: readonly number[] = PDF_BENCH_PAGE_COUNTS,
  cacheScope = 'bench',
  dpr = defaultPdfDpr(false),
): Promise<PdfBenchLoopResult[]> {
  const results: PdfBenchLoopResult[] = []
  for (const count of counts) {
    clearPdfRenderCache()
    results.push(await benchmarkPdfPageLoop(pdfSourceDataUrl, count, cacheScope, dpr))
  }
  return results
}
