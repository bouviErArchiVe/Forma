/**
 * PWA registration & update flow.
 *
 * New service workers wait until the user confirms (Settings or prompt).
 * Call `applyPwaUpdate()` → postMessage SKIP_WAITING → controllerchange → reload.
 */

export type PwaUpdateState = 'idle' | 'available' | 'applying'

let registration: ServiceWorkerRegistration | null = null
let updateState: PwaUpdateState = 'idle'
const listeners = new Set<(state: PwaUpdateState) => void>()

function setUpdateState(state: PwaUpdateState) {
  updateState = state
  listeners.forEach((fn) => fn(state))
}

export function getPwaUpdateState(): PwaUpdateState {
  return updateState
}

export function subscribePwaUpdate(fn: (state: PwaUpdateState) => void): () => void {
  listeners.add(fn)
  fn(updateState)
  return () => listeners.delete(fn)
}

export function getPwaRegistration(): ServiceWorkerRegistration | null {
  return registration
}

function watchWaiting(worker: ServiceWorker) {
  if (worker.state === 'installed' && navigator.serviceWorker.controller) {
    setUpdateState('available')
  }
  worker.addEventListener('statechange', () => {
    if (
      worker.state === 'installed' &&
      navigator.serviceWorker.controller
    ) {
      setUpdateState('available')
    }
  })
}

/** Sends SKIP_WAITING to the waiting worker; page reloads on controllerchange. */
export async function applyPwaUpdate(): Promise<boolean> {
  const waiting = registration?.waiting
  if (!waiting) return false
  setUpdateState('applying')
  waiting.postMessage({ type: 'SKIP_WAITING' })
  return true
}

export async function registerPwa(options?: { promptOnUpdate?: boolean }): Promise<void> {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return

  try {
    registration = await navigator.serviceWorker.register('/sw.js')
  } catch {
    return
  }

  if (registration.waiting) watchWaiting(registration.waiting)

  registration.addEventListener('updatefound', () => {
    const installing = registration?.installing
    if (!installing) return
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && registration?.waiting) {
        watchWaiting(registration.waiting)
      }
    })
  })

  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })

  if (options?.promptOnUpdate !== false) {
    subscribePwaUpdate(async (state) => {
      if (state !== 'available') return
      const { confirm } = await import('../stores/confirmStore')
      const ok = await confirm('Une nouvelle version de Forma est disponible.', {
        title: 'Mise à jour',
        confirmLabel: 'Recharger',
      })
      if (ok) void applyPwaUpdate()
    })
  }

  void registration.update()
}
