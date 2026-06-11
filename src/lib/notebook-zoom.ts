const PREFIX = 'forma-zoom-'
const MIN = 0.35
const MAX = 1.6

export function clampZoom(z: number): number {
  return Math.min(MAX, Math.max(MIN, z))
}

export function getNotebookZoom(notebookId: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(`${PREFIX}${notebookId}`)
    if (!raw) return clampZoom(fallback)
    const n = parseFloat(raw)
    if (Number.isFinite(n)) return clampZoom(n)
  } catch {
    /* ignore */
  }
  return clampZoom(fallback)
}

export function setNotebookZoom(notebookId: string, zoom: number): void {
  try {
    localStorage.setItem(`${PREFIX}${notebookId}`, String(clampZoom(zoom)))
  } catch {
    /* quota */
  }
}
