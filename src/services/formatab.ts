import { db } from '../db'
import { cloneSheet, createSheet } from '../lib/spreadsheet/model'
import type { FormaSheet } from '../types'

export async function listSheets(): Promise<FormaSheet[]> {
  return db.formaSheets.orderBy('updatedAt').reverse().toArray()
}

export async function getSheet(id: string): Promise<FormaSheet | undefined> {
  return db.formaSheets.get(id)
}

export async function saveSheet(sheet: FormaSheet): Promise<FormaSheet> {
  const next = { ...sheet, updatedAt: Date.now() }
  await db.formaSheets.put(next)
  return next
}

export async function createSheetRecord(name = 'Nouveau tableau'): Promise<FormaSheet> {
  const sheet = createSheet(name.trim() || 'Nouveau tableau')
  await db.formaSheets.add(sheet)
  return sheet
}

export async function deleteSheet(id: string): Promise<void> {
  await db.formaSheets.delete(id)
}

export async function duplicateSheet(id: string): Promise<FormaSheet | null> {
  const src = await getSheet(id)
  if (!src) return null
  const copy = cloneSheet(src)
  await db.formaSheets.add(copy)
  return copy
}

export async function searchSheets(query: string): Promise<FormaSheet[]> {
  const q = query.trim().toLowerCase()
  const all = await listSheets()
  if (!q) return all
  return all.filter((s) => {
    if (s.name.toLowerCase().includes(q)) return true
    return Object.values(s.cells).some((c) => (c.raw || '').toLowerCase().includes(q))
  })
}

export type SheetSortBy = 'updated' | 'name'
export type SheetSortDir = 'asc' | 'desc'

export function sortSheets(
  list: FormaSheet[],
  by: SheetSortBy = 'updated',
  dir: SheetSortDir = 'desc',
): FormaSheet[] {
  const copy = [...list]
  copy.sort((a, b) => {
    if (by === 'name') {
      const cmp = a.name.localeCompare(b.name, 'fr')
      return dir === 'asc' ? cmp : -cmp
    }
    return dir === 'asc' ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt
  })
  return copy
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function autosaveSheet(sheet: FormaSheet, delay = 400): Promise<FormaSheet> {
  return new Promise((resolve) => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void saveSheet(sheet).then(resolve)
    }, delay)
  })
}
