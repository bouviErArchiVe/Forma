import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FormulaHistoryEntry {
  id: string
  formulaId: string
  title: string
  mode: string
  values: Record<string, string>
  summary: string
  createdAt: number
}

export const MAX_FORMULA_HISTORY = 40

export interface FormulaHistoryInput {
  formulaId: string
  title: string
  mode: string
  values: Record<string, string>
  summary: string
}

interface FormulaHistoryState {
  entries: FormulaHistoryEntry[]
  addEntry: (input: FormulaHistoryInput) => void
  removeEntry: (id: string) => void
  clear: () => void
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const useFormulaHistoryStore = create<FormulaHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (input) =>
        set((s) => {
          const entry: FormulaHistoryEntry = {
            id: makeId(),
            createdAt: Date.now(),
            ...input,
          }
          return { entries: [entry, ...s.entries].slice(0, MAX_FORMULA_HISTORY) }
        }),
      removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'forma-formula-history' },
  ),
)
