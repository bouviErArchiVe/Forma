import { formatBytes } from './storage-stats'

export interface BrowserStorageEstimate {
  usage: number | null
  quota: number | null
  /** 0–100 si usage et quota connus */
  percent: number | null
}

export async function getBrowserStorageEstimate(): Promise<BrowserStorageEstimate> {
  if (!navigator.storage?.estimate) {
    return { usage: null, quota: null, percent: null }
  }
  try {
    const est = await navigator.storage.estimate()
    const usage = est.usage ?? null
    const quota = est.quota ?? null
    const percent =
      usage != null && quota != null && quota > 0
        ? Math.min(100, Math.round((usage / quota) * 100))
        : null
    return { usage, quota, percent }
  } catch {
    return { usage: null, quota: null, percent: null }
  }
}

export function formatStorageEstimate(est: BrowserStorageEstimate): string | null {
  if (est.usage == null || est.quota == null) return null
  const pct = est.percent != null ? ` (${est.percent} %)` : ''
  return `${formatBytes(est.usage)} / ${formatBytes(est.quota)}${pct}`
}

export function isStorageNearlyFull(percent: number | null, threshold = 85): boolean {
  return percent != null && percent >= threshold
}
