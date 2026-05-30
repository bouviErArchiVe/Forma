import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ToolsPanelTab = 'calc' | 'translate' | 'dico' | null

interface ToolsState {
  openPanel: ToolsPanelTab
  calcOpen: boolean
  setOpenPanel: (tab: ToolsPanelTab) => void
  toggleCalc: () => void
  closeAll: () => void
}

export const useToolsStore = create<ToolsState>()(
  persist(
    (set) => ({
      openPanel: null,
      calcOpen: false,
      setOpenPanel: (openPanel) => set({ openPanel, calcOpen: openPanel === 'calc' }),
      toggleCalc: () =>
        set((s) => ({
          calcOpen: !s.calcOpen,
          openPanel: s.calcOpen ? null : 'calc',
        })),
      closeAll: () => set({ openPanel: null, calcOpen: false }),
    }),
    { name: 'forma-tools-prefs', partialize: (s) => ({ calcOpen: s.calcOpen }) },
  ),
)
