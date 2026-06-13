import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DocumentType, SortBy, SortOrder, ViewMode } from '../types'

export type LibraryTypeFilter = 'all' | DocumentType
/** 'all' | 'none' (sans matière) | id d'un document matière. */
export type LibrarySubjectFilterValue = 'all' | 'none' | string

interface LibraryState {
  currentFolderId: string | null
  viewMode: ViewMode
  sortBy: SortBy
  sortOrder: SortOrder
  searchQuery: string
  selectionMode: boolean
  selectedIds: Set<string>
  typeFilter: LibraryTypeFilter
  subjectFilter: LibrarySubjectFilterValue
  setFolder: (id: string | null) => void
  setViewMode: (mode: ViewMode) => void
  setSort: (by: SortBy, order?: SortOrder) => void
  setSearch: (q: string) => void
  toggleSelection: (id: string) => void
  clearSelection: () => void
  setSelectionMode: (on: boolean) => void
  selectAll: (ids: string[]) => void
  setTypeFilter: (filter: LibraryTypeFilter) => void
  setSubjectFilter: (filter: LibrarySubjectFilterValue) => void
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      currentFolderId: null,
      viewMode: 'grid',
      sortBy: 'modified',
      sortOrder: 'desc',
      searchQuery: '',
      selectionMode: false,
      selectedIds: new Set(),
      typeFilter: 'all',
      subjectFilter: 'all',
      setFolder: (currentFolderId) => set({ currentFolderId }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSort: (sortBy, sortOrder) =>
        set((s) => ({
          sortBy,
          sortOrder: sortOrder ?? s.sortOrder,
        })),
      setSearch: (searchQuery) => set({ searchQuery }),
      toggleSelection: (id) =>
        set((s) => {
          const next = new Set(s.selectedIds)
          if (next.has(id)) next.delete(id)
          else next.add(id)
          return { selectedIds: next }
        }),
      clearSelection: () => set({ selectedIds: new Set(), selectionMode: false }),
      setSelectionMode: (selectionMode) =>
        set({ selectionMode, selectedIds: selectionMode ? new Set() : new Set() }),
      selectAll: (ids) => set({ selectedIds: new Set(ids) }),
      setTypeFilter: (typeFilter) => set({ typeFilter }),
      setSubjectFilter: (subjectFilter) => set({ subjectFilter }),
    }),
    {
      name: 'forma-library-prefs',
      partialize: (s) => ({
        currentFolderId: s.currentFolderId,
        viewMode: s.viewMode,
        sortBy: s.sortBy,
        sortOrder: s.sortOrder,
        typeFilter: s.typeFilter,
        subjectFilter: s.subjectFilter,
        searchQuery: s.searchQuery,
      }),
    },
  ),
)
