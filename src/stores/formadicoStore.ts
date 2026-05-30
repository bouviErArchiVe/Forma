import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FD_MAX_FAVORITES, FD_MAX_HISTORY } from '../lib/formadico/constants'

interface FormaDicoState {
  lang: string
  schoolMode: boolean
  favorites: string[]
  history: { word: string; lang: string; at: number }[]
  pendingWord: string | null
  setLang: (lang: string) => void
  setSchoolMode: (on: boolean) => void
  toggleFavorite: (word: string) => void
  isFavorite: (word: string) => boolean
  pushHistory: (word: string, lang: string) => void
  clearHistory: () => void
  setPendingWord: (word: string | null) => void
  consumePendingWord: () => string | null
}

export const useFormaDicoStore = create<FormaDicoState>()(
  persist(
    (set, get) => ({
      lang: 'fr',
      schoolMode: false,
      favorites: [],
      history: [],
      pendingWord: null,
      setLang: (lang) => set({ lang }),
      setSchoolMode: (schoolMode) => set({ schoolMode }),
      toggleFavorite: (word) =>
        set((s) => {
          const w = word.toLowerCase()
          const has = s.favorites.includes(w)
          let next = has ? s.favorites.filter((x) => x !== w) : [...s.favorites, w]
          if (next.length > FD_MAX_FAVORITES) next = next.slice(-FD_MAX_FAVORITES)
          return { favorites: next }
        }),
      isFavorite: (word) => get().favorites.includes(word.toLowerCase()),
      pushHistory: (word, lang) =>
        set((s) => {
          const entry = { word, lang, at: Date.now() }
          const next = [entry, ...s.history.filter((h) => h.word !== word || h.lang !== lang)].slice(
            0,
            FD_MAX_HISTORY,
          )
          return { history: next }
        }),
      clearHistory: () => set({ history: [] }),
      setPendingWord: (pendingWord) => set({ pendingWord }),
      consumePendingWord: () => {
        const w = get().pendingWord
        set({ pendingWord: null })
        return w
      },
    }),
    { name: 'forma-dico-prefs' },
  ),
)
