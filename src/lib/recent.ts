const KEY = 'forma-recent'
const MAX = 12

export function getRecentIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function pushRecent(notebookId: string): void {
  const ids = getRecentIds().filter((id) => id !== notebookId)
  ids.unshift(notebookId)
  localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX)))
}

export function clearRecentIds(): void {
  localStorage.removeItem(KEY)
}
