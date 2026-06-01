import type { FormulaHistoryEntry } from '../../stores/formulaHistoryStore'

const STORAGE_KEY = 'forma-formula-history'

interface PersistedFormulaHistory {
  state?: { entries?: FormulaHistoryEntry[] }
}

/** Lit l'historique Formules persisté (Zustand/localStorage), sans initialiser le store. */
export function readPersistedFormulaHistory(): FormulaHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as PersistedFormulaHistory
    return Array.isArray(parsed.state?.entries) ? parsed.state!.entries! : []
  } catch {
    return []
  }
}
