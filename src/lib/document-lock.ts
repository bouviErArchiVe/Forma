/**
 * Verrou par carnet (localStorage + storage events) — empêche l’édition concurrente multi-onglets.
 * Le second onglet doit rester en lecture seule (readMode forcé côté EditorPage).
 */

export const DOCUMENT_LOCK_PREFIX = 'forma-doc-lock-'
/** Durée sans heartbeat avant qu’un verrou soit considéré expiré (ms). */
export const DOCUMENT_LOCK_STALE_MS = 45_000
const STALE_MS = DOCUMENT_LOCK_STALE_MS

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

/** Supprime les verrous expirés (onglet fermé sans cleanup). */
export function pruneStaleDocumentLocks(maxAgeMs = STALE_MS): number {
  let removed = 0
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(DOCUMENT_LOCK_PREFIX)) keys.push(key)
  }
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as LockRecord
      if (Date.now() - parsed.at > maxAgeMs) {
        localStorage.removeItem(key)
        removed++
      }
    } catch {
      localStorage.removeItem(key)
      removed++
    }
  }
  return removed
}

/** Reprend l’édition si le verrou est absent ou expiré. */
export function tryReacquireDocumentLock(notebookId: string, tabId: string): boolean {
  const cur = readLock(notebookId)
  if (cur && cur.tabId !== tabId) return false
  writeLock(notebookId, tabId)
  return true
}

export function isDocumentLockStale(notebookId: string, maxAgeMs = STALE_MS): boolean {
  try {
    const raw = localStorage.getItem(documentLockStorageKey(notebookId))
    if (!raw) return true
    const parsed = JSON.parse(raw) as LockRecord
    return Date.now() - parsed.at > maxAgeMs
  } catch {
    return true
  }
}

/** Millisecondes restantes avant expiration du verrou actif (0 si absent/expiré). */
export function getDocumentLockRemainingMs(
  notebookId: string,
  maxAgeMs = STALE_MS,
): number {
  try {
    const raw = localStorage.getItem(documentLockStorageKey(notebookId))
    if (!raw) return 0
    const parsed = JSON.parse(raw) as LockRecord
    const remaining = maxAgeMs - (Date.now() - parsed.at)
    return remaining > 0 ? remaining : 0
  } catch {
    return 0
  }
}
