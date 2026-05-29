import type { Notebook } from '../types'
import type { Subject } from './subjects'

export interface NotebookMonthGroup {
  key: string
  label: string
  items: Notebook[]
}

export interface LibraryDashboardStats {
  totalNotebooks: number
  favorites: number
  pdfs: number
  whiteboards: number
  recentCount: number
  bySubject: { subject: Subject; count: number }[]
  recentActivity: Notebook[]
}

export function estimateNotebookBytes(pageCount: number): number {
  return Math.max(pageCount, 1) * 48_000
}

export function groupNotebooksByMonth(notebooks: Notebook[]): NotebookMonthGroup[] {
  const groups = new Map<string, NotebookMonthGroup>()
  for (const nb of notebooks) {
    const d = new Date(nb.updatedAt || nb.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!groups.has(key)) groups.set(key, { key, label, items: [] })
    groups.get(key)!.items.push(nb)
  }
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key))
}

export function computeDashboardStats(
  notebooks: Notebook[],
  subjects: Subject[],
  recentIds: string[],
): LibraryDashboardStats {
  const bySubjectMap = new Map<string, number>()
  for (const nb of notebooks) {
    if (nb.subjectId) {
      bySubjectMap.set(nb.subjectId, (bySubjectMap.get(nb.subjectId) ?? 0) + 1)
    }
  }
  const bySubject = subjects
    .map((subject) => ({ subject, count: bySubjectMap.get(subject.id) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)

  const recentSet = new Set(recentIds)
  const recentActivity = [...notebooks]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8)

  return {
    totalNotebooks: notebooks.length,
    favorites: notebooks.filter((n) => n.favorite).length,
    pdfs: notebooks.filter((n) => n.type === 'pdf').length,
    whiteboards: notebooks.filter((n) => n.type === 'whiteboard').length,
    recentCount: notebooks.filter((n) => recentSet.has(n.id)).length,
    bySubject,
    recentActivity,
  }
}

export function filterNotebooksBySubject(
  notebooks: Notebook[],
  subjectId: string | null,
): Notebook[] {
  if (!subjectId) return notebooks
  return notebooks.filter((nb) => nb.subjectId === subjectId)
}
