import { db } from '../db'
import { cloneDocument, createDocument as buildDocument } from '../lib/docs/model'
import type { FormaDocTemplateId, FormaDocument } from '../types'

/** sessionStorage : ouvrir ce document au prochain chargement de FormaDoc (ex. insertion depuis Formules). */
export const FORMA_DOC_OPEN_ID_KEY = 'forma-doc-open-id'

export async function listDocuments(): Promise<FormaDocument[]> {
  return db.formaDocuments.orderBy('updatedAt').reverse().toArray()
}

export async function getDocument(id: string): Promise<FormaDocument | undefined> {
  return db.formaDocuments.get(id)
}

export async function saveDocument(doc: FormaDocument): Promise<FormaDocument> {
  const next = { ...doc, updatedAt: Date.now() }
  await db.formaDocuments.put(next)
  return next
}

export async function createDocument(
  name: string,
  templateId: FormaDocTemplateId = 'blank',
): Promise<FormaDocument> {
  const doc = buildDocument(name.trim() || 'Nouveau document', templateId)
  await db.formaDocuments.add(doc)
  return doc
}

export async function deleteDocument(id: string): Promise<void> {
  await db.formaDocuments.delete(id)
}

export async function duplicateDocument(id: string): Promise<FormaDocument | null> {
  const src = await getDocument(id)
  if (!src) return null
  const copy = cloneDocument(src)
  await db.formaDocuments.add(copy)
  return copy
}

export async function searchDocuments(query: string): Promise<FormaDocument[]> {
  const q = query.trim().toLowerCase()
  const all = await listDocuments()
  if (!q) return all
  return all.filter((d) => {
    if (d.name.toLowerCase().includes(q)) return true
    return d.pages.some((p) => (p.html || '').toLowerCase().includes(q))
  })
}

export type DocumentSortBy = 'updated' | 'name'
export type DocumentSortDir = 'asc' | 'desc'

export function sortDocuments(
  list: FormaDocument[],
  by: DocumentSortBy = 'updated',
  dir: DocumentSortDir = 'desc',
): FormaDocument[] {
  const copy = [...list]
  copy.sort((a, b) => {
    if (by === 'name') {
      const cmp = a.name.localeCompare(b.name, 'fr')
      return dir === 'asc' ? cmp : -cmp
    }
    const va = a.updatedAt
    const vb = b.updatedAt
    return dir === 'asc' ? va - vb : vb - va
  })
  return copy
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function autosaveDocument(doc: FormaDocument, delay = 500): Promise<FormaDocument> {
  return new Promise((resolve) => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void saveDocument(doc).then(resolve)
    }, delay)
  })
}
