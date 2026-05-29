import { useEffect, useSyncExternalStore } from 'react'
import { maxMountedCanvases } from '../lib/continuous-viewport'

type Entry = {
  pageId: string
  pageIndex: number
  isActive: boolean
  intersecting: boolean
}

const entries = new Map<string, Entry>()
const subs = new Set<() => void>()
let grants = new Set<string>()
let grantsKey = ''

function notify() {
  for (const s of subs) s()
}

function grantsCacheKey(pageCount: number): string {
  const parts = [...entries.values()]
    .sort((a, b) => a.pageId.localeCompare(b.pageId))
    .map((e) => `${e.pageId}:${e.pageIndex}:${e.isActive ? 1 : 0}:${e.intersecting ? 1 : 0}`)
  return `${pageCount}|${parts.join(';')}`
}

function recomputeGrants(pageCount: number): Set<string> {
  const key = grantsCacheKey(pageCount)
  if (key === grantsKey) return grants
  grantsKey = key

  const max = maxMountedCanvases(pageCount)
  const next = new Set<string>()
  let activeIdx = 0
  for (const e of entries.values()) {
    if (e.isActive) {
      next.add(e.pageId)
      activeIdx = e.pageIndex
      break
    }
  }

  const candidates = [...entries.values()]
    .filter((e) => !e.isActive && e.intersecting)
    .sort(
      (a, b) =>
        Math.abs(a.pageIndex - activeIdx) - Math.abs(b.pageIndex - activeIdx) ||
        a.pageIndex - b.pageIndex,
    )

  for (const c of candidates) {
    if (next.size >= max) break
    next.add(c.pageId)
  }

  grants = next
  return grants
}

function subscribe(cb: () => void) {
  subs.add(cb)
  return () => {
    subs.delete(cb)
  }
}

function getGranted(pageId: string, pageCount: number): boolean {
  return recomputeGrants(pageCount).has(pageId)
}

/** Limite les montages PageCanvas en vue continue ; la page active est toujours accordée. */
export function usePageCanvasMount(
  pageId: string,
  pageIndex: number,
  isActive: boolean,
  intersecting: boolean,
  pageCount: number,
): boolean {
  useEffect(() => {
    entries.set(pageId, { pageId, pageIndex, isActive, intersecting })
    notify()
    return () => {
      entries.delete(pageId)
      notify()
    }
  }, [pageId, pageIndex, isActive, intersecting])

  return useSyncExternalStore(
    subscribe,
    () => getGranted(pageId, pageCount),
    () => isActive || intersecting,
  )
}

/** Test-only reset. */
export function resetPageCanvasPoolForTests(): void {
  entries.clear()
  subs.clear()
  grants = new Set()
  grantsKey = ''
}
