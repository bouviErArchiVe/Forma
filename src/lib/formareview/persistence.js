import { createSafePersistStorage } from '@/lib/storage'
import { createSession } from './model'

const KEY = 'forma-review'

function readAll() {
  try {
    const raw = createSafePersistStorage().getItem(KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function writeAll(list) {
  createSafePersistStorage().setItem(KEY, JSON.stringify(list))
}

export function listSessions() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getSession(id) {
  return readAll().find((s) => s.id === id) || null
}

export function saveSession(session) {
  const list = readAll()
  const idx = list.findIndex((s) => s.id === session.id)
  const next = { ...session, updatedAt: Date.now() }
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  writeAll(list)
  return next
}

export function createAndSaveSession(name, partial = {}) {
  return saveSession(createSession(name, partial))
}

export function deleteSession(id) {
  writeAll(readAll().filter((s) => s.id !== id))
}

let timer = null
export function autosaveSession(session, delay = 500) {
  return new Promise((resolve) => {
    clearTimeout(timer)
    timer = setTimeout(() => resolve(saveSession(session)), delay)
  })
}
