import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TabsState {
  openIds: string[]
  activeId: string | null
  openTab: (id: string) => void
  closeTab: (id: string) => string | null
  closeAllTabs: () => void
  closeOtherTabs: (keepId: string) => void
  setActive: (id: string) => void
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      openIds: [],
      activeId: null,
      openTab: (id) =>
        set((s) => ({
          openIds: s.openIds.includes(id) ? s.openIds : [...s.openIds, id],
          activeId: id,
        })),
      closeTab: (id) => {
        const { openIds, activeId } = get()
        const next = openIds.filter((x) => x !== id)
        let newActive = activeId
        if (activeId === id) {
          const idx = openIds.indexOf(id)
          newActive = next[Math.min(idx, next.length - 1)] ?? null
        }
        set({ openIds: next, activeId: newActive })
        return newActive
      },
      setActive: (id) => set({ activeId: id }),
      closeAllTabs: () => set({ openIds: [], activeId: null }),
      closeOtherTabs: (keepId) =>
        set((s) => ({
          openIds: s.openIds.filter((x) => x === keepId),
          activeId: keepId,
        })),
    }),
    { name: 'forma-tabs', partialize: (s) => ({ openIds: s.openIds, activeId: s.activeId }) },
  ),
)
