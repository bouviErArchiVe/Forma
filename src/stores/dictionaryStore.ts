/**
 * dictionaryStore — favoris & récents du dictionnaire (/dictionary).
 *
 * Persistance localStorage UNIQUEMENT (zustand/persist) — pas de Dexie, léger.
 *  - `favorites` : slugs d'entrées étoilées (ordre d'ajout).
 *  - `recents`   : ~20 derniers slugs ouverts (le plus récent en tête).
 *
 * Robuste à un localStorage vide ou corrompu : les valeurs lues sont
 * systématiquement assainies (tableaux de chaînes, dédoublonnés, bornés).
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Nombre maximum de récents conservés. */
export const RECENTS_LIMIT = 20

interface DictionaryState {
  favorites: string[]
  recents: string[]
  isFavorite: (slug: string) => boolean
  toggleFavorite: (slug: string) => void
  pushRecent: (slug: string) => void
  clearRecents: () => void
}

/** Assainit une valeur inconnue en tableau de slugs non vides, dédoublonné et borné. */
function sanitizeSlugs(value: unknown, limit?: number): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const slug = item.trim()
    if (!slug || seen.has(slug)) continue
    seen.add(slug)
    out.push(slug)
    if (limit !== undefined && out.length >= limit) break
  }
  return out
}

export const useDictionaryStore = create<DictionaryState>()(
  persist(
    (set, get) => ({
      favorites: [],
      recents: [],
      isFavorite: (slug) => get().favorites.includes(slug),
      toggleFavorite: (slug) =>
        set((s) => {
          const clean = slug.trim()
          if (!clean) return s
          return {
            favorites: s.favorites.includes(clean)
              ? s.favorites.filter((x) => x !== clean)
              : [...s.favorites, clean],
          }
        }),
      pushRecent: (slug) =>
        set((s) => {
          const clean = slug.trim()
          if (!clean) return s
          const next = [clean, ...s.recents.filter((x) => x !== clean)].slice(0, RECENTS_LIMIT)
          return { recents: next }
        }),
      clearRecents: () => set({ recents: [] }),
    }),
    {
      name: 'forma-dictionary',
      // Assainit l'état restauré (localStorage potentiellement corrompu).
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<DictionaryState>
        return {
          ...current,
          favorites: sanitizeSlugs(p.favorites),
          recents: sanitizeSlugs(p.recents, RECENTS_LIMIT),
        }
      },
    },
  ),
)
