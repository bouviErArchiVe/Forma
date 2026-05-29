/**
 * Instrumentation légère (addendum PERF) — FPS et changements de page.
 */

/** Objectifs addendum : 60 FPS, changement de page < 200 ms */
export const PERF_TARGET_FPS = 60
export const PERF_WARN_FPS = 55
export const PERF_TARGET_PAGE_MS = 200

export interface PerfSnapshot {
  fps: number
  lastPageSwitchMs: number | null
  frameDrops: number
}

let rafId = 0
let lastFrame = 0
let frameCount = 0
let fps = 60
let frameDrops = 0
let lastPageSwitchMs: number | null = null
let listeners = new Set<(s: PerfSnapshot) => void>()

function tick(now: number): void {
  frameCount++
  if (lastFrame > 0) {
    const dt = now - lastFrame
    if (dt > 24) frameDrops++
  }
  lastFrame = now
  rafId = requestAnimationFrame(tick)
}

function emit(): void {
  const snap: PerfSnapshot = { fps, lastPageSwitchMs, frameDrops }
  for (const fn of listeners) fn(snap)
}

export function startPerfMonitor(): () => void {
  if (rafId) return () => stopPerfMonitor()
  lastFrame = performance.now()
  rafId = requestAnimationFrame(tick)
  const interval = window.setInterval(() => {
    fps = Math.round(frameCount * 10) / 10
    frameCount = 0
    emit()
  }, 1000)
  return () => {
    stopPerfMonitor()
    clearInterval(interval)
  }
}

export function stopPerfMonitor(): void {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
  listeners.clear()
}

export function subscribePerf(fn: (s: PerfSnapshot) => void): () => void {
  listeners.add(fn)
  fn({ fps, lastPageSwitchMs, frameDrops })
  return () => listeners.delete(fn)
}

export function markPageSwitch(durationMs: number): void {
  lastPageSwitchMs = Math.round(durationMs)
  emit()
}

export function resetPerfCounters(): void {
  frameDrops = 0
  lastPageSwitchMs = null
  emit()
}
