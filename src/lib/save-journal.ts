/**
 * Journal léger des événements de persistance (recovery / debug).
 * Ring buffer localStorage — ne remplace pas IndexedDB.
 */
import type { StorageErrorKind } from './storage-errors'

export type SaveJournalEvent =
  | { type: 'autosave_ok'; pageId: string; at: number }
  | { type: 'autosave_fail'; pageId: string; at: number; kind: StorageErrorKind }
  | { type: 'recovery_stash'; pageId: string; at: number }
  | { type: 'import_backup'; at: number; notebooks: number }

const KEY = 'forma-save-journal'
const MAX_EVENTS = 80

interface JournalFile {
  v: 1
  events: SaveJournalEvent[]
}

function read(): JournalFile {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { v: 1, events: [] }
    const parsed = JSON.parse(raw) as JournalFile
    return parsed?.v === 1 && Array.isArray(parsed.events) ? parsed : { v: 1, events: [] }
  } catch {
    return { v: 1, events: [] }
  }
}

function write(file: JournalFile): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, events: file.events.slice(-MAX_EVENTS) }))
  } catch {
    /* quota */
  }
}

export function appendSaveJournalEvent(event: SaveJournalEvent): void {
  const file = read()
  file.events.push(event)
  write(file)
}

export function peekSaveJournal(limit = 20): SaveJournalEvent[] {
  return read().events.slice(-limit)
}

export function clearSaveJournal(): void {
  localStorage.removeItem(KEY)
}
