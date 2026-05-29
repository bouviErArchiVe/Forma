const KEY = 'forma-recent-pages'
const MAX = 10

export interface RecentPageEntry {
  notebookId: string
  pageId: string
  notebookName: string
  pageIndex: number
  at: number
}

export function getRecentPages(): RecentPageEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as RecentPageEntry[]
  } catch {
    return []
  }
}

export function pushRecentPage(entry: Omit<RecentPageEntry, 'at'>): void {
  const list = getRecentPages().filter(
    (e) => !(e.notebookId === entry.notebookId && e.pageId === entry.pageId),
  )
  list.unshift({ ...entry, at: Date.now() })
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
}

export function pruneRecentPagesForNotebook(notebookId: string): void {
  const list = getRecentPages().filter((e) => e.notebookId !== notebookId)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function clearRecentPages(): void {
  localStorage.removeItem(KEY)
}
