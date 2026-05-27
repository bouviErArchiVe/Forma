import { createSafePersistStorage } from '@/lib/storage'
import { createDeck } from './model'

const KEY = 'forma-present'

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

export function listDecks() {
  return readAll().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function getDeck(id) {
  return readAll().find((d) => d.id === id) || null
}

export function saveDeck(deck) {
  const list = readAll()
  const idx = list.findIndex((d) => d.id === deck.id)
  const next = { ...deck, updatedAt: Date.now() }
  if (idx >= 0) list[idx] = next
  else list.unshift(next)
  writeAll(list)
  return next
}

export function createAndSaveDeck(deck) {
  return saveDeck(deck)
}

export function deleteDeck(id) {
  writeAll(readAll().filter((d) => d.id !== id))
}

let timer = null
export function autosaveDeck(deck, delay = 500) {
  return new Promise((resolve) => {
    clearTimeout(timer)
    timer = setTimeout(() => resolve(saveDeck(deck)), delay)
  })
}
