/**
 * Verrou par carnet (localStorage + storage events) — empêche l’édition concurrente multi-onglets.
 * Le second onglet doit rester en lecture seule (readMode forcé côté EditorPage).
 */

export const DOCUMENT_LOCK_PREFIX = 'forma-doc-lock-'
const STALE_MS = 45_000

interface LockRecord {
  tabId: string
  at: number
}

export function documentLockStorageKey(notebookId: string): string {
  return `${DOCUMENT_LOCK_PREFIX}${notebookId}`
}

function readLock(notebookId: string): LockRecord | null {
  try {
    const raw = localStorage.getItem(documentLockStorageKey(notebookId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as LockRecord
    if (!parsed.tabId) return null
    if (Date.now() - parsed.at > STALE_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeLock(notebookId: string, tabId: string): void {
  try {
    localStorage.setItem(
      documentLockStorageKey(notebookId),
      JSON.stringify({ tabId, at: Date.now() } satisfies LockRecord),
    )
  } catch {
    /* quota / mode privé */
  }
}

function clearLock(notebookId: string, tabId: string): void {
  try {
    const cur = readLock(notebookId)
    if (cur?.tabId === tabId) localStorage.removeItem(documentLockStorageKey(notebookId))
  } catch {
    /* ignore */
  }
}

/** Tente d’acquérir le verrou ; false si un autre onglet détient le verrou actif. */
export function tryAcquireDocumentLock(notebookId: string, tabId: string): boolean {
  const cur = readLock(notebookId)
  if (cur && cur.tabId !== tabId) return false
  writeLock(notebookId, tabId)
  return true
}

export function refreshDocumentLock(notebookId: string, tabId: string): void {
  const cur = readLock(notebookId)
  if (cur && cur.tabId !== tabId) return
  writeLock(notebookId, tabId)
}

export function releaseDocumentLock(notebookId: string, tabId: string): void {
  clearLock(notebookId, tabId)
}

export function isDocumentLockedByOther(notebookId: string, tabId: string): boolean {
  const cur = readLock(notebookId)
  return !!cur && cur.tabId !== tabId
}

export function getDocumentLockTabId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function subscribeDocumentLock(
  notebookId: string,
  tabId: string,
  onChange: (lockedByOther: boolean) => void,
): () => void {
  const sync = () => onChange(isDocumentLockedByOther(notebookId, tabId))
  const onStorage = (e: StorageEvent) => {
    if (e.key === documentLockStorageKey(notebookId)) sync()
  }
  window.addEventListener('storage', onStorage)
  sync()
  return () => window.removeEventListener('storage', onStorage)
}
