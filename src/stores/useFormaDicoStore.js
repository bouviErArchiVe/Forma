import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafePersistStorage } from '@/lib/storage'
import { FD_MAX_FAVORITES, FD_MAX_HISTORY } from '@/lib/formadico/constants'

const useFormaDicoStore = create(
  persist(
    (set, get) => ({
      lang: 'fr',
      schoolMode: false,
      favorites: [],
      history: [],

      setLang: (lang) => set({ lang: lang === 'en' ? 'en' : 'fr' }),
      setSchoolMode: (schoolMode) => set({ schoolMode: !!schoolMode }),

      pushHistory: (word, lang) => {
        const w = String(word || '').trim().toLowerCase()
        if (!w) return
        set((s) => ({
          history: [{ word: w, lang: lang || s.lang, at: Date.now() }, ...s.history.filter((h) => h.word !== w)].slice(0, FD_MAX_HISTORY),
        }))
      },

      toggleFavorite: (word, lang) => {
        const w = String(word || '').trim().toLowerCase()
        if (!w) return
        const l = lang || get().lang
        const exists = get().favorites.some((f) => f.word === w && f.lang === l)
        set((s) => ({
          favorites: exists
            ? s.favorites.filter((f) => !(f.word === w && f.lang === l))
            : [{ word: w, lang: l, at: Date.now() }, ...s.favorites].slice(0, FD_MAX_FAVORITES),
        }))
      },

      isFavorite: (word, lang) => {
        const w = String(word || '').trim().toLowerCase()
        return get().favorites.some((f) => f.word === w && f.lang === (lang || get().lang))
      },

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'forma-dico-store',
      storage: createJSONStorage(createSafePersistStorage),
      partialize: (s) => ({
        lang: s.lang,
        schoolMode: s.schoolMode,
        favorites: s.favorites,
        history: s.history,
      }),
    },
  ),
)

export default useFormaDicoStore
