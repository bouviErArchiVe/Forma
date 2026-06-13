/**
 * État UI de la bibliothèque de blocs (persisté localStorage) :
 * système d'unités courant, favoris et récents (ids de blocs).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DrawingBlockUnitSystem } from '../lib/blocks/types'

const RECENTS_MAX = 12

interface BlockLibraryState {
  unit: DrawingBlockUnitSystem
  favorites: string[]
  recents: string[]
  setUnit: (unit: DrawingBlockUnitSystem) => void
  toggleFavorite: (blockId: string) => void
  pushRecent: (blockId: string) => void
}

export const useBlockLibraryStore = create<BlockLibraryState>()(
  persist(
    (set) => ({
      unit: 'metric',
      favorites: [],
      recents: [],
      setUnit: (unit) => set({ unit }),
      toggleFavorite: (blockId) =>
        set((s) => ({
          favorites: s.favorites.includes(blockId)
            ? s.favorites.filter((id) => id !== blockId)
            : [...s.favorites, blockId],
        })),
      pushRecent: (blockId) =>
        set((s) => ({
          recents: [blockId, ...s.recents.filter((id) => id !== blockId)].slice(0, RECENTS_MAX),
        })),
    }),
    { name: 'forma-block-library' },
  ),
)
