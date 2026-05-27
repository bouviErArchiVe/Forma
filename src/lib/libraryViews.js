import { estimateNotebookBytes } from '@/lib/folders/stats'

export const LIBRARY_VIEWS = [
  { id: 'grid', label: 'Grille', icon: '⊞' },
  { id: 'list', label: 'Liste', icon: '☰' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
]

export const LIBRARY_SORTS = [
  { id: 'updated', label: 'Dernière modif.' },
  { id: 'created', label: 'Date création' },
  { id: 'name', label: 'Nom A→Z' },
  { id: 'subject', label: 'Matière' },
  { id: 'size', label: 'Taille' },
]

export function sortNotebooks(notebooks, sortId, subjects = []) {
  const list = [...(notebooks || [])]
  const subjectLabel = (id) => subjects.find((s) => s.id === id)?.l || id || ''

  switch (sortId) {
    case 'created':
      return list.sort(
        (a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0),
      )
    case 'name':
      return list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' }))
    case 'size':
      return list.sort((a, b) => estimateNotebookBytes(b) - estimateNotebookBytes(a))
    case 'subject':
      return list.sort((a, b) => {
        const cmp = subjectLabel(a.subject).localeCompare(subjectLabel(b.subject), 'fr', { sensitivity: 'base' })
        return cmp || (a.title || '').localeCompare(b.title || '', 'fr', { sensitivity: 'base' })
      })
    default:
      return list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
  }
}

export function groupNotebooksByMonth(notebooks) {
  const groups = new Map()
  ;(notebooks || []).forEach((nb) => {
    const d = new Date(nb.updated_at || nb.created_at || Date.now())
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (!groups.has(key)) groups.set(key, { key, label, items: [] })
    groups.get(key).items.push(nb)
  })
  return [...groups.values()].sort((a, b) => b.key.localeCompare(a.key))
}

export function formatNotebookDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
