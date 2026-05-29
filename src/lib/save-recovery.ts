import type { Page } from '../types'

const PREFIX = 'forma-recovery-'

export function stashPageRecovery(page: Page): void {
  try {
    localStorage.setItem(`${PREFIX}${page.id}`, JSON.stringify(page))
  } catch {
    /* quota */
  }
}

export function popPageRecovery(pageId: string): Page | null {
  try {
    const raw = localStorage.getItem(`${PREFIX}${pageId}`)
    if (!raw) return null
    localStorage.removeItem(`${PREFIX}${pageId}`)
    return JSON.parse(raw) as Page
  } catch {
    return null
  }
}

export function clearPageRecovery(pageId: string): void {
  localStorage.removeItem(`${PREFIX}${pageId}`)
}
