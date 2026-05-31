import { useEffect, useMemo, useRef, useState } from 'react'
import { GlassButton } from '../ui/GlassButton'
import { GlassPanel } from '../ui/GlassPanel'
import type { FormulaDef, FormulaResult } from '../../lib/formulas/types'

const LENGTH_UNITS = [
  { id: 'mm', label: 'mm' },
  { id: 'cm', label: 'cm' },
  { id: 'm', label: 'm' },
]

function defaultValues(fields: ReturnType<FormulaDef['fieldsForMode']>) {
  const v: Record<string, string> = {}
  fields.forEach((f) => {
    if (f.type === 'select' && f.options?.length) v[f.key] = f.options[0].value
    else v[f.key] = ''
  })
  return v
}

interface FormulaCalculatorProps {
  formula: FormulaDef
  lengthUnit: string
  onLengthUnitChange: (u: 'mm' | 'cm' | 'm') => void
  favorite?: boolean
  onToggleFavorite: () => void
  onBack: () => void
  onCopy: (text: string) => void
  initialMode?: string
  initialValues?: Record<string, string>
  onSaveCalculation?: (payload: { mode: string; values: Record<string, string>; result: FormulaResult }) => void
}

export function FormulaCalculator({
  formula,
  lengthUnit,
  onLengthUnitChange,
  favorite,
  onToggleFavorite,
  onBack,
  onCopy,
  initialMode,
  initialValues,
  onSaveCalculation,
}: FormulaCalculatorProps) {
  const [mode, setMode] = useState(initialMode || formula.defaultMode || formula.modes?.[0]?.id || 'default')
  const fields = useMemo(() => formula.fieldsForMode(mode), [formula, mode])
  const [values, setValues] = useState(() => ({
    ...defaultValues(formula.fieldsForMode(initialMode || formula.defaultMode || 'default')),
    ...(initialValues || {}),
  }))
  // Preserve restored inputs on the first effect run; subsequent mode switches reset normally.
  const skipResetRef = useRef(Boolean(initialValues))

  useEffect(() => {
    if (skipResetRef.current) {
      skipResetRef.current = false
      return
    }
    setValues(defaultValues(fields))
  }, [formula.id, mode, fields])

  const result = useMemo(() => {
    try {
      return formula.compute(mode, values, { lengthUnit })
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Erreur de calcul.' }
    }
  }, [formula, mode, values, lengthUnit])

  const hasLengthFields = fields.some((f) => f.unit === 'length')

  const copyText = () => {
    if (!result || result.error) return
    const lines = [
      formula.title,
      formula.formulaText,
      '',
      ...(result.rows || []).map((r) => `${r.label}: ${r.value}`),
      '',
      result.summary,
    ]
    onCopy(lines.join('\n'))
  }

  const saveCalc = () => {
    if (!result || result.error || !onSaveCalculation) return
    onSaveCalculation({ mode, values, result })
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <GlassButton size="sm" onClick={onBack}>
          ← Retour
        </GlassButton>
        <div className="flex-1 min-w-[200px] flex gap-3 items-start">
          <span className="text-3xl">{formula.icon}</span>
          <div>
            <h1 className="text-xl font-bold">{formula.title}</h1>
            <p className="text-sm text-forma-muted mt-1">{formula.description}</p>
          </div>
        </div>
        <button type="button" onClick={onToggleFavorite} className="text-sm px-2 py-1 border rounded-lg">
          {favorite ? '★ Favori' : '☆ Favori'}
        </button>
      </div>

      <div className="font-mono text-sm text-forma-accent p-3 rounded-xl border border-dashed border-forma-accent/30 bg-forma-accent/5 mb-4">
        {formula.formulaText}
      </div>

      {formula.modes && formula.modes.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {formula.modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`text-xs px-3 py-1.5 rounded-full border ${
                mode === m.id ? 'bg-forma-accent text-white border-forma-accent' : 'border-forma-border'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {hasLengthFields && (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          <span className="text-xs text-forma-muted">Unité longueur :</span>
          {LENGTH_UNITS.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onLengthUnitChange(u.id as 'mm' | 'cm' | 'm')}
              className={`text-xs px-2 py-1 rounded-lg border ${
                lengthUnit === u.id ? 'border-forma-accent bg-forma-accent/10' : ''
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <GlassPanel variant="surface" className="p-4">
          <h3 className="text-xs font-bold text-forma-muted uppercase mb-3">Valeurs</h3>
          <div className="space-y-3">
            {fields.map((field) => (
              <label key={field.key} className="block text-sm">
                <span className="text-forma-muted text-xs">{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="w-full mt-1 border rounded-lg px-2 py-2 text-sm"
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    step={field.step ?? 0.01}
                    min={field.min}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    className="w-full mt-1 border rounded-lg px-2 py-2 text-sm"
                  />
                )}
              </label>
            ))}
          </div>
          <GlassButton size="sm" className="mt-3" onClick={() => setValues(defaultValues(fields))}>
            Réinitialiser
          </GlassButton>
        </GlassPanel>

        <GlassPanel variant="surface" className="p-4">
          <h3 className="text-xs font-bold text-forma-muted uppercase mb-3">Résultat</h3>
          {result?.error ? (
            <p className="text-red-600 text-sm">{result.error}</p>
          ) : (
            <>
              <ul className="space-y-2 text-sm mb-3">
                {result?.rows?.map((row, i) => (
                  <li key={i} className="flex justify-between gap-2 border-b border-forma-border/30 pb-1">
                    <span className="text-forma-muted">{row.label}</span>
                    <span style={row.highlight ? { color: row.highlight } : undefined}>{row.value}</span>
                  </li>
                ))}
              </ul>
              {result?.summary && (
                <p className="text-sm font-medium text-forma-accent">{result.summary}</p>
              )}
            </>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <GlassButton size="sm" disabled={!!result?.error} onClick={copyText}>
              Copier le résultat
            </GlassButton>
            {onSaveCalculation && (
              <GlassButton size="sm" disabled={!!result?.error} onClick={saveCalc}>
                Conserver le calcul
              </GlassButton>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
