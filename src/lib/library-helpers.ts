/**
 * Helpers purs pour le filtrage/tri de la bibliothèque (LibraryPage).
 * Extraits pour testabilité — pas de dépendance Dexie/IndexedDB ici.
 */
import type { DocumentType, Notebook, SortBy, SortOrder } from '../types'

export type LibraryFilterTab = 'all' | 'favorites' | 'recent'
export type LibraryTypeFilter = 'all' | DocumentType

/** Trie une liste de carnets selon le critère et l'ordre donnés. */
export function sortNotebooksBy(
  notebooks: Notebook[],
  sortBy: SortBy,
  order: SortOrder,
): Notebook[] {
  return [...notebooks].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name, 'fr')
    else if (sortBy === 'created') cmp = a.createdAt - b.createdAt
    else cmp = a.updatedAt - b.updatedAt
    return order === 'asc' ? cmp : -cmp
  })
}

/** Filtre une liste de carnets par type de document (`'all'` = pas de filtre). */
export function filterByType(notebooks: Notebook[], typeFilter: LibraryTypeFilter): Notebook[] {
  if (typeFilter === 'all') return notebooks
  return notebooks.filter((nb) => nb.type === typeFilter)
}

/** Ne garde que les carnets marqués favoris. */
export function filterFavorites(notebooks: Notebook[]): Notebook[] {
  return notebooks.filter((nb) => nb.favorite === true)
}

/**
 * Construit la liste "Récents" : carnets correspondant aux `ids` fournis
 * (déjà ordonnés par récence par l'appelant), tronquée à `limit` éléments.
 */
export function buildRecentList(
  notebooksById: Map<string, Notebook>,
  recentIds: string[],
  limit = 20,
): Notebook[] {
  const result: Notebook[] = []
  for (const id of recentIds) {
    const nb = notebooksById.get(id)
    if (nb && !nb.deletedAt) result.push(nb)
    if (result.length >= limit) break
  }
  return result
}

/**
 * Pipeline complet appliqué par la bibliothèque pour un onglet donné :
 * sélection de l'onglet (favoris/récents/tous) + filtre type + tri.
 *
 * - `tab === 'favorites'` : filtre sur `favorite`, puis tri.
 * - `tab === 'recent'` : ordonne selon `recentIds` (le tri par date est ignoré
 *   car l'ordre "récent" est déjà celui de consultation), tronqué à `recentLimit`.
 * - `tab === 'all'` : filtre type + tri standard.
 */
export function applyLibraryFilters(
  notebooks: Notebook[],
  opts: {
    tab: LibraryFilterTab
    typeFilter?: LibraryTypeFilter
    sortBy?: SortBy
    sortOrder?: SortOrder
    recentIds?: string[]
    recentLimit?: number
  },
): Notebook[] {
  const { tab, typeFilter = 'all', sortBy = 'modified', sortOrder = 'desc', recentIds = [], recentLimit = 20 } = opts

  if (tab === 'favorites') {
    return sortNotebooksBy(filterByType(filterFavorites(notebooks), typeFilter), sortBy, sortOrder)
  }

  if (tab === 'recent') {
    const byId = new Map(notebooks.map((nb) => [nb.id, nb] as const))
    const recent = buildRecentList(byId, recentIds, recentLimit)
    return filterByType(recent, typeFilter)
  }

  return sortNotebooksBy(filterByType(notebooks, typeFilter), sortBy, sortOrder)
}
