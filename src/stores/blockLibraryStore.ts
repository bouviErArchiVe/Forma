/**
 * État UI de la bibliothèque de blocs (persisté localStorage) :
 * système d'unités courant, favoris, récents, et blocs personnalisés
 * (métadonnées ; l'image source est dans Dexie `assets`).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DrawingBlock, DrawingBlockUnitSystem } from '../lib/blocks/types'

const RECENTS_MAX = 16

/** Métadonnées d'un bloc personnalisé (l'asset source vit dans Dexie). */
export interface CustomBlockMeta extends DrawingBlock {
  custom: true
  assetId: string
  createdAt: number
}

interface BlockLibraryState {
  unit: DrawingBlockUnitSystem
  favorites: string[]
  recents: string[]
  customBlocks: CustomBlockMeta[]
  setUnit: (unit: DrawingBlockUnitSystem) => void
  toggleFavorite: (blockId: string) => void
  pushRecent: (blockId: string) => void
  addCustomBlock: (block: CustomBlockMeta) => void
  removeCustomBlock: (blockId: string) => void
}

export const useBlockLibraryStore = create<BlockLibraryState>()(
  persist(
    (set) => ({
      unit: 'metric',
      favorites: [],
      recents: [],
      customBlocks: [],
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
      addCustomBlock: (block) =>
        set((s) => ({ customBlocks: [block, ...s.customBlocks] })),
      removeCustomBlock: (blockId) =>
        set((s) => ({
          customBlocks: s.customBlocks.filter((b) => b.id !== blockId),
          favorites: s.favorites.filter((id) => id !== blockId),
          recents: s.recents.filter((id) => id !== blockId),
        })),
    }),
    { name: 'forma-block-library' },
  ),
)
