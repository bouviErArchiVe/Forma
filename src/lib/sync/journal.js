/** FormaSync — journal de récupération après crash (write-ahead log) */

import { SYNC_KEYS } from './constants'
import { safeJsonParse, safeGetLocalStorage, safeSetLocalStorage } from '@/lib/storage'

function readJournal() {
  return safeJsonParse(safeGetLocalStorage(SYNC_KEYS.journal, '[]'), [])
}

function writeJournal(entries) {
  safeSetLocalStorage(SYNC_KEYS.journal, JSON.stringify(entries.slice(-50)))
}

function uid() {
  return `jr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function appendJournalEntry({ resourceType, resourceId, label, payloadHash }) {
  const entry = {
    id: uid(),
    resourceType,
    resourceId,
    label: label || resourceId,
    payloadHash,
    status: 'pending',
    createdAt: Date.now(),
  }
  const entries = readJournal()
  entries.push(entry)
  writeJournal(entries)
  return entry.id
}

export function commitJournalEntry(journalId) {
  const entries = readJournal()
  const idx = entries.findIndex((e) => e.id === journalId)
  if (idx >= 0) {
    entries[idx].status = 'committed'
    entries[idx].committedAt = Date.now()
  }
  writeJournal(entries.filter((e) => e.status === 'pending' || Date.now() - (e.committedAt || e.createdAt) < 86400000))
}

export function getPendingRecovery() {
  return readJournal().filter((e) => e.status === 'pending')
}

export function dismissRecovery(journalId) {
  writeJournal(readJournal().filter((e) => e.id !== journalId))
}

export function clearOldJournal(maxAgeMs = 7 * 86400000) {
  const cutoff = Date.now() - maxAgeMs
  writeJournal(readJournal().filter((e) => e.createdAt > cutoff))
}

export function markRecoveryRestored(journalId) {
  const entries = readJournal()
  const idx = entries.findIndex((e) => e.id === journalId)
  if (idx >= 0) {
    entries[idx].status = 'restored'
    entries[idx].restoredAt = Date.now()
  }
  writeJournal(entries)
}
