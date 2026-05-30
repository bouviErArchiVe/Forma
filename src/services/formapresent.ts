import { db } from '../db'
import { cloneDeck, createDeck } from '../lib/formapresent/model'
import { buildTemplate } from '../lib/formapresent/templates'
import type { FormaDeck, FormaPresentTemplateId } from '../types'

export async function listDecks(): Promise<FormaDeck[]> {
  return db.formaDecks.orderBy('updatedAt').reverse().toArray()
}

export async function getDeck(id: string): Promise<FormaDeck | undefined> {
  return db.formaDecks.get(id)
}

export async function saveDeck(deck: FormaDeck): Promise<FormaDeck> {
  const next = { ...deck, updatedAt: Date.now() }
  await db.formaDecks.put(next)
  return next
}

export async function createDeckFromTemplate(
  templateId: FormaPresentTemplateId,
  title?: string,
): Promise<FormaDeck> {
  const deck = buildTemplate(templateId, title?.trim() || 'Présentation')
  await db.formaDecks.add(deck)
  return deck
}

export async function deleteDeck(id: string): Promise<void> {
  await db.formaDecks.delete(id)
}

export async function duplicateDeck(id: string): Promise<FormaDeck | null> {
  const src = await getDeck(id)
  if (!src) return null
  const copy = cloneDeck(src)
  await db.formaDecks.add(copy)
  return copy
}

export async function searchDecks(query: string): Promise<FormaDeck[]> {
  const q = query.trim().toLowerCase()
  const all = await listDecks()
  if (!q) return all
  return all.filter((d) => {
    if (d.title.toLowerCase().includes(q)) return true
    return d.slides.some(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.notes.toLowerCase().includes(q) ||
        s.elements.some((el) => (el.content || el.label || '').toLowerCase().includes(q)),
    )
  })
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function autosaveDeck(deck: FormaDeck, delay = 500): Promise<FormaDeck> {
  return new Promise((resolve) => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void saveDeck(deck).then(resolve)
    }, delay)
  })
}

export { createDeck, buildTemplate }
