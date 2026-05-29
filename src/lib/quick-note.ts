import { db } from '../db'
import { createNotebook, getNotebook } from '../services/library'

const QUICK_NOTE_KEY = 'forma-quick-note-id'

export async function openQuickNote(folderId: string | null): Promise<string> {
  const stored = localStorage.getItem(QUICK_NOTE_KEY)
  if (stored) {
    const nb = await getNotebook(stored)
    if (nb && !nb.deletedAt) {
      await db.notebooks.update(stored, { updatedAt: Date.now() })
      return stored
    }
  }
  const nb = await createNotebook({
    name: 'Note rapide',
    coverColor: '#eab308',
    paperTemplate: 'lined',
    orientation: 'portrait',
    folderId,
  })
  localStorage.setItem(QUICK_NOTE_KEY, nb.id)
  return nb.id
}
