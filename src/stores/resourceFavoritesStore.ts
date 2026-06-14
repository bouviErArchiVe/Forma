/**
 * Favoris des ressources architecture (matériaux, et plus tard normes/détails),
 * persistés en localStorage. Clés génériques `${kind}:${id}` (ex. `material:bois-spf`)
 * pour pouvoir couvrir plusieurs types de ressources sans migration Dexie.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ResourceKind = 'material' | 'norme' | 'detail'

function key(kind: ResourceKind, id: string): string {
  return `${kind}:${id}`
}

interface ResourceFavoritesState {
  favorites: string[]
  toggle: (kind: ResourceKind, id: string) => void
  has: (kind: ResourceKind, id: string) => boolean
}

export const useResourceFavoritesStore = create<ResourceFavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggle: (kind, id) =>
        set((s) => {
          const k = key(kind, id)
          return {
            favorites: s.favorites.includes(k)
              ? s.favorites.filter((x) => x !== k)
              : [...s.favorites, k],
          }
        }),
      has: (kind, id) => get().favorites.includes(key(kind, id)),
    }),
    { name: 'forma-resource-favorites' },
  ),
)
