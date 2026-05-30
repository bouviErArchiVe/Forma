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
  compute: (mode: string, values: Record<string, string>, opts?: { lengthUnit?: string }) => {
    error?: string
    summary?: string
    rows?: { label: string; value: string; highlight?: string }[]
  }
}
