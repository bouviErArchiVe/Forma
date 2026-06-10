import { appendSaveJournalEvent } from '../lib/save-journal'
import { clearPageRecovery, stashPageRecovery } from '../lib/save-recovery'
import {
  classifyStorageError,
  storageErrorMessage,
  type StorageErrorKind,
} from '../lib/storage-errors'
import { updatePage } from './pages'
import type { Page } from '../types'

const DEBOUNCE_MS = 2000
const ERROR_TOAST_COOLDOWN_MS = 8000

type Entry = {
  page: Page
  timer: ReturnType<typeof setTimeout> | null
  /** Incrémenté à chaque schedule — détecte les edits pendant une sauvegarde. */
  generation: number
}

const pending = new Map<string, Entry>()
const saveChains = new Map<string, Promise<void>>()
const listeners = new Set<(status: 'idle' | 'saving' | 'saved' | 'error') => void>()
let lastErrorKind: StorageErrorKind | null = null
let lastErrorToastAt = 0
let activeSaves = 0

function notify(status: 'idle' | 'saving' | 'saved' | 'error'): void {
  for (const fn of listeners) fn(status)
}

export function getAutosaveErrorKind(): StorageErrorKind | null {
  return lastErrorKind
}

export function autosaveErrorButtonLabel(kind: StorageErrorKind | null): string {
  if (kind === 'quota') return 'Espace insuffisant — réessayer'
  return 'Erreur — réessayer'
}

export function subscribeAutosaveStatus(
  fn: (status: 'idle' | 'saving' | 'saved' | 'error') => void,
): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function isAutosaveBusy(): boolean {
  return activeSaves > 0 || pending.size > 0
}

function maybeToastSaveError(kind: StorageErrorKind): void {
  const now = Date.now()
  if (now - lastErrorToastAt < ERROR_TOAST_COOLDOWN_MS) return
  lastErrorToastAt = now
  void import('../stores/toastStore').then(({ useToastStore }) => {
    useToastStore.getState().show(storageErrorMessage(kind), kind === 'quota' ? 9000 : 5000)
  })
}

async function persistOnce(page: Page): Promise<void> {
  notify('saving')
  const pageWithTimestamp: Page = { ...page, updatedAt: Date.now() }
  stashPageRecovery(pageWithTimestamp)
  appendSaveJournalEvent({ type: 'recovery_stash', pageId: page.id, at: Date.now() })
  try {
    await updatePage(pageWithTimestamp)
    clearPageRecovery(page.id)
    lastErrorKind = null
    appendSaveJournalEvent({ type: 'autosave_ok', pageId: page.id, at: Date.now() })
    void import('../lib/thumb-cache').then(({ invalidateThumb }) => void invalidateThumb(page.id))
    notify('saved')
  } catch (err) {
    lastErrorKind = classifyStorageError(err)
    appendSaveJournalEvent({
      type: 'autosave_fail',
      pageId: page.id,
      at: Date.now(),
      kind: lastErrorKind,
    })
    notify('error')
    maybeToastSaveError(lastErrorKind)
    throw err
  }
}

async function runSaveChain(pageId: string): Promise<void> {
  activeSaves++
  try {
    while (true) {
      const entry = pending.get(pageId)
      if (!entry) break
      const page = entry.page
      const gen = entry.generation
      await persistOnce(page)
      const cur = pending.get(pageId)
      if (!cur) break
      if (cur.generation !== gen) continue
      if (!cur.timer) pending.delete(pageId)
      break
    }
  } finally {
    activeSaves--
  }
}

function enqueueSave(pageId: string): Promise<void> {
  const prev = saveChains.get(pageId) ?? Promise.resolve()
  const next = prev.then(() => runSaveChain(pageId)).catch(() => {})
  saveChains.set(pageId, next)
  void next.finally(() => {
    if (saveChains.get(pageId) === next) saveChains.delete(pageId)
  })
  return next
}

/** Planifie une sauvegarde debounced (spec §12). */
export function schedulePageSave(page: Page): void {
  const id = page.id
  let entry = pending.get(id)
  if (!entry) {
    entry = { page, timer: null, generation: 0 }
    pending.set(id, entry)
  }
  entry.page = page
  entry.generation++
  if (entry.timer) clearTimeout(entry.timer)
  entry.timer = setTimeout(() => {
    entry!.timer = null
    void flushPage(id)
  }, DEBOUNCE_MS)
}

/** Écrit immédiatement une page en attente (séquentiel par page). */
export async function flushPage(pageId: string): Promise<void> {
  const entry = pending.get(pageId)
  if (!entry) return
  if (entry.timer) {
    clearTimeout(entry.timer)
    entry.timer = null
  }
  await enqueueSave(pageId)
}

/** Flush toutes les pages en attente (fermeture doc, visibility) — ordre séquentiel. */
export async function flushAllPending(): Promise<void> {
  const ids = [...pending.keys()]
  for (const id of ids) {
    await flushPage(id)
  }
}

export function hasPendingSaves(): boolean {
  return pending.size > 0
}

/** Réessaie toutes les pages encore en file (après erreur). */
export async function retryFailedSaves(): Promise<boolean> {
  const ids = [...pending.keys()]
  if (!ids.length) {
    notify('saved')
    return true
  }
  let ok = true
  for (const id of ids) {
    try {
      await flushPage(id)
    } catch {
      ok = false
    }
  }
  return ok
}
