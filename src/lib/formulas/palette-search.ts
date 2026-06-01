import { filterFormulas } from './catalog'
import { readPersistedFormulaHistory } from './history-read'
import { setFormulaRestoreIntent } from './nav'

export interface FormulaPaletteHit {
  id: string
  label: string
  hint: string
  formulaId: string
  mode?: string
  values?: Record<string, string>
}

/** Recherche synchrone catalogue + historique pour la palette Ctrl+K. */
export function searchFormulasForPalette(query: string, limit = 10): FormulaPaletteHit[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const hits: FormulaPaletteHit[] = []

  for (const f of filterFormulas({ categoryId: 'all', search: q })) {
    hits.push({
      id: `formula:${f.id}`,
      label: f.title,
      hint: f.formulaText,
      formulaId: f.id,
    })
    if (hits.length >= limit) return hits
  }

  for (const entry of readPersistedFormulaHistory()) {
    if (hits.length >= limit) break
    const hay = [entry.title, entry.summary, ...Object.values(entry.values)].join(' ').toLowerCase()
    if (!hay.includes(q)) continue
    hits.push({
      id: `formula-history:${entry.id}`,
      label: `${entry.title} (calcul)`,
      hint: entry.summary,
      formulaId: entry.formulaId,
      mode: entry.mode,
      values: entry.values,
    })
  }

  return hits
}

export function prepareFormulaPaletteNavigation(hit: FormulaPaletteHit): void {
  setFormulaRestoreIntent({
    formulaId: hit.formulaId,
    mode: hit.mode,
    values: hit.values,
  })
}
