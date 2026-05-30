import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FormulaPrefsState {
  favorites: string[]
  recent: string[]
  lengthUnit: 'mm' | 'cm' | 'm'
  toggleFavorite: (id: string) => void
  touchRecent: (id: string) => void
  setLengthUnit: (u: 'mm' | 'cm' | 'm') => void
}

export const useFormulaPrefsStore = create<FormulaPrefsState>()(
  persist(
    (set) => ({
      favorites: [],
      recent: [],
      lengthUnit: 'cm',
      toggleFavorite: (id) =>
        set((s) => ({
          favorites: s.favorites.includes(id)
            ? s.favorites.filter((x) => x !== id)
            : [...s.favorites, id],
        })),
      touchRecent: (id) =>
        set((s) => ({
          recent: [id, ...s.recent.filter((x) => x !== id)].slice(0, 20),
        })),
      setLengthUnit: (lengthUnit) => set({ lengthUnit }),
    }),
    { name: 'forma-formula-prefs' },
  ),
)
