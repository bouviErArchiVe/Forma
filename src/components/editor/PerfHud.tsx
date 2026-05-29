import { useEffect, useState } from 'react'
import {
  getPdfPageCacheSize,
  getPdfPrefetchInFlight,
  PDF_PAGE_CACHE_MAX,
} from '../../lib/pdf-page-render'
import {
  PERF_TARGET_PAGE_MS,
  PERF_WARN_FPS,
  subscribePerf,
  startPerfMonitor,
  type PerfSnapshot,
} from '../../lib/perf-monitor'

export function PerfHud() {
  const [snap, setSnap] = useState<PerfSnapshot>({ fps: 0, lastPageSwitchMs: null, frameDrops: 0 })

  const [pdfCache, setPdfCache] = useState(0)
  const [pdfPrefetch, setPdfPrefetch] = useState(0)

  useEffect(() => {
    const stop = startPerfMonitor()
    const unsub = subscribePerf(setSnap)
    const cacheTick = window.setInterval(() => {
      setPdfCache(getPdfPageCacheSize())
      setPdfPrefetch(getPdfPrefetchInFlight())
    }, 2000)
    return () => {
      unsub()
      stop()
      clearInterval(cacheTick)
    }
  }, [])

  const slowPage =
    snap.lastPageSwitchMs != null && snap.lastPageSwitchMs > PERF_TARGET_PAGE_MS
  const lowFps = snap.fps > 0 && snap.fps < PERF_WARN_FPS

  return (
    <div
      className="fixed bottom-3 left-3 z-50 pointer-events-none text-[10px] font-mono px-2 py-1 rounded-md bg-black/70 text-white/90 shadow"
      aria-hidden
    >
      <span className={lowFps ? 'text-amber-300' : ''}>{snap.fps} FPS</span>
      {snap.lastPageSwitchMs != null && (
        <span className={slowPage ? ' text-red-300' : ' text-white/70'}>
          {' '}
          · page {snap.lastPageSwitchMs} ms
        </span>
      )}
      {snap.frameDrops > 0 && (
        <span className="text-amber-300/80"> · drops {snap.frameDrops}</span>
      )}
      {(pdfCache > 0 || pdfPrefetch > 0) && (
        <span className="text-white/60">
          {' '}
          · pdf {pdfCache}/{PDF_PAGE_CACHE_MAX}
          {pdfPrefetch > 0 ? ` +${pdfPrefetch}` : ''}
        </span>
      )}
    </div>
  )
}
