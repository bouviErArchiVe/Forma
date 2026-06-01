import { readPersistedFormulaHistory } from './history-read'

/** sessionStorage : rouvrir une formule (et valeurs) au prochain chargement de /formulas. */
export const FORMA_FORMULA_RESTORE_KEY = 'forma-formula-restore'

export interface FormulaRestoreIntent {
  formulaId: string
  mode?: string
  values?: Record<string, string>
}

export function setFormulaRestoreIntent(intent: FormulaRestoreIntent): void {
  sessionStorage.setItem(FORMA_FORMULA_RESTORE_KEY, JSON.stringify(intent))
}

export function consumeFormulaRestoreIntent(): FormulaRestoreIntent | null {
  const raw = sessionStorage.getItem(FORMA_FORMULA_RESTORE_KEY)
  if (!raw) return null
  sessionStorage.removeItem(FORMA_FORMULA_RESTORE_KEY)
  try {
    const parsed = JSON.parse(raw) as FormulaRestoreIntent
    if (parsed?.formulaId) return parsed
  } catch {
    /* ignore */
  }
  return null
}

/** Prépare la navigation FormaAI → Formules (catalogue ou calcul conservé). */
export function prepareFormulaNavigationFromSearch(item: {
  type: string
  meta?: Record<string, unknown>
}): void {
  if (item.type === 'formula-history') {
    const historyId = item.meta?.historyId as string | undefined
    const entry = historyId ? readPersistedFormulaHistory().find((e) => e.id === historyId) : undefined
    if (entry) {
      setFormulaRestoreIntent({
        formulaId: entry.formulaId,
        mode: entry.mode,
        values: entry.values,
      })
      return
    }
    const formulaId = item.meta?.formulaId as string | undefined
    if (formulaId) setFormulaRestoreIntent({ formulaId })
    return
  }

  if (item.type === 'formula') {
    const formulaId = item.meta?.formulaId as string | undefined
    if (formulaId) setFormulaRestoreIntent({ formulaId })
  }
}
