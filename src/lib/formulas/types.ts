export interface FormulaField {
  key: string
  label: string
  type?: string
  placeholder?: string
  step?: number
  min?: number
  unit?: string
  options?: { value: string; label: string }[]
}

export interface FormulaResultRow {
  label: string
  value: string
  highlight?: string
}

export interface FormulaVerdict {
  id: string
  label: string
  color: string
}

/**
 * Résultat renvoyé par une fonction `compute`.
 * Couvre deux formes : le résultat structuré (rows/summary/verdict) utilisé par
 * la plupart des calculs, et le résultat simple (ok/label/value) des maths de base.
 */
export interface FormulaResult {
  error?: string
  summary?: string
  rows?: FormulaResultRow[]
  verdict?: FormulaVerdict
  ok?: boolean
  label?: string
  value?: number
  unit?: string
  detail?: string
}

export type FormulaValues = Record<string, string>

export interface FormulaDef {
  id: string
  categoryId: string
  title: string
  icon: string
  description: string
  formulaText: string
  tags?: string[]
  modes?: { id: string; label: string }[]
  defaultMode?: string
  fieldsForMode: (mode: string) => FormulaField[]
  compute: (mode: string, values: FormulaValues, opts?: { lengthUnit?: string }) => FormulaResult
}
