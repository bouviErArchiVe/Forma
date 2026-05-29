/**
 * Détection discrète d’autres onglets Forma (BroadcastChannel + repli storage).
 * IndexedDB n’est pas partagé de façon sûre entre onglets actifs — avertir l’utilisateur.
 */

const CHANNEL = 'forma-tab-presence-v1'
const HEARTBEAT_KEY = 'forma-tab-heartbeat'
const HEARTBEAT_MS = 5000

let tabId = ''
let hasOtherTabs = false
let initialized = false
const listeners = new Set<(hasOther: boolean) => void>()

function notify(): void {
  for (const fn of listeners) fn(hasOtherTabs)
}

function markOtherTab(): void {
  if (hasOtherTabs) return
  hasOtherTabs = true
  notify()
}

export function getHasOtherTabs(): boolean {
  return hasOtherTabs
}

export function subscribeMultiTab(fn: (hasOther: boolean) => void): () => void {
  listeners.add(fn)
  fn(hasOtherTabs)
  return () => listeners.delete(fn)
}

function newTabId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function parseHeartbeat(raw: string | null): { tabId: string } | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as { tabId?: string }
    return parsed.tabId ? { tabId: parsed.tabId } : null
  } catch {
    return null
  }
}

/** À appeler une fois au démarrage de l’app ; retourne le cleanup. */
export function initMultiTabDetection(): () => void {
  if (initialized || typeof window === 'undefined') return () => {}
  initialized = true
  tabId = newTabId()

  const cleanups: Array<() => void> = []

  if (typeof BroadcastChannel !== 'undefined') {
    const bc = new BroadcastChannel(CHANNEL)
    const onMessage = (ev: MessageEvent) => {
      const data = ev.data as { type?: string; tabId?: string } | null
      if (data?.type !== 'presence' || !data.tabId || data.tabId === tabId) return
      markOtherTab()
      bc.postMessage({ type: 'presence', tabId })
    }
    bc.addEventListener('message', onMessage)
    bc.postMessage({ type: 'presence', tabId })
    cleanups.push(() => {
      bc.removeEventListener('message', onMessage)
      bc.close()
    })
  }

  const writeHeartbeat = () => {
    try {
      localStorage.setItem(
        HEARTBEAT_KEY,
        JSON.stringify({ tabId, at: Date.now() }),
      )
    } catch {
      /* quota / mode privé — BroadcastChannel suffit */
    }
  }

  writeHeartbeat()
  const interval = window.setInterval(writeHeartbeat, HEARTBEAT_MS)

  const onStorage = (e: StorageEvent) => {
    if (e.key !== HEARTBEAT_KEY) return
    const beat = parseHeartbeat(e.newValue)
    if (beat && beat.tabId !== tabId) markOtherTab()
  }
  window.addEventListener('storage', onStorage)

  cleanups.push(() => {
    window.clearInterval(interval)
    window.removeEventListener('storage', onStorage)
  })

  return () => {
    for (const fn of cleanups) fn()
    initialized = false
    hasOtherTabs = false
    tabId = ''
  }
}
