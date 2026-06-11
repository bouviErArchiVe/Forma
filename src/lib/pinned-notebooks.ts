import { db } from '../db'

export async function getPinnedNotebookIds(): Promise<Set<string>> {
  const rows = await db.settings.filter((s) => s.key.startsWith('pin-')).toArray()
  return new Set(rows.map((r) => r.key.slice(4)))
}
