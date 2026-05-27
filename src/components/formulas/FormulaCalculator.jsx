import { useEffect, useMemo, useState } from 'react'
import { LENGTH_UNITS } from '@/lib/formulas/units'

function defaultValues(fields) {
  const v = {}
  fields.forEach((f) => {
    if (f.type === 'select' && f.options?.length) v[f.key] = f.options[0].value
    else v[f.key] = ''
  })
  return v
}

export default function FormulaCalculator({
  T,
  formula,
  lengthUnit,
  onLengthUnitChange,
  favorite,
  onToggleFavorite,
  onBack,
  onCopy,
  onSendToNotebook,
  onComputed,
}) {
  const [mode, setMode] = useState(formula.defaultMode || formula.modes?.[0]?.id || 'default')
  const fields = useMemo(() => formula.fieldsForMode(mode), [formula, mode])
  const [values, setValues] = useState(() => defaultValues(formula.fieldsForMode(formula.defaultMode || 'default')))

  useEffect(() => {
    setValues(defaultValues(fields))
  }, [formula.id, mode])

  const result = useMemo(() => {
    try {
      return formula.compute(mode, values, { lengthUnit })
    } catch (err) {
      return { error: err?.message || 'Erreur de calcul.' }
    }
  }, [formula, mode, values, lengthUnit])

  useEffect(() => {
    if (result && !result.error && result.summary) onComputed?.()
  }, [result?.summary, result?.error, onComputed])

  const hasLengthFields = fields.some((f) => f.unit === 'length')

  const reset = () => setValues(defaultValues(fields))

  const copyText = () => {
    if (!result || result.error) return
    const lines = [
      `${formula.title}`,
      formula.formulaText,
      '',
      ...(result.rows || []).map((r) => `${r.label}: ${r.value}`),
      '',
      result.summary,
    ]
    onCopy(lines.join('\n'))
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button type="button" onClick={onBack} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: T.ink }}>
          ← Retour
        </button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 32 }}>{formula.icon}</span>
            <div>
              <h1 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: T.ink }}>{formula.title}</h1>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: T.muted, maxWidth: 560 }}>{formula.description}</p>
            </div>
          </div>
        </div>
        <button type="button" onClick={() => onToggleFavorite(formula.id)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: favorite ? '#f5a623' : T.muted }}>
          {favorite ? '★ Favori' : '☆ Favori'}
        </button>
      </div>

      <div style={{ padding: '12px 14px', borderRadius: 12, background: `${T.accent}10`, border: `1px dashed ${T.accent}44`, marginBottom: 20, fontFamily: 'monospace', fontSize: 13, color: T.accent }}>
        {formula.formulaText}
      </div>

      {formula.modes?.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {formula.modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              style={{
                padding: '8px 14px',
                borderRadius: 20,
                border: `1px solid ${mode === m.id ? T.accent : T.border}`,
                background: mode === m.id ? `${T.accent}15` : T.bg,
                color: mode === m.id ? T.accent : T.muted,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {hasLengthFields && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>Unité longueur :</span>
          {LENGTH_UNITS.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => onLengthUnitChange(u.id)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                border: `1px solid ${lengthUnit === u.id ? T.accent : T.border}`,
                background: lengthUnit === u.id ? `${T.accent}12` : T.bg,
                color: lengthUnit === u.id ? T.accent : T.muted,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {u.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div style={{ padding: 18, borderRadius: 14, border: `1px solid ${T.border}`, background: T.surface }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 14 }}>VALEURS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fields.map((field) => (
              <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: T.ink }}>{field.label}</span>
                {field.type === 'select' ? (
                  <select
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    style={{ padding: '12px 10px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 14, outline: 'none' }}
                  >
                    {field.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    inputMode="decimal"
                    step={field.step ?? 'any'}
                    min={field.min}
                    placeholder={field.placeholder || ''}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                    style={{ padding: '12px 10px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 16, outline: 'none', minHeight: 44 }}
                  />
                )}
              </label>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" onClick={reset} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 12, cursor: 'pointer' }}>
              Réinitialiser
            </button>
          </div>
        </div>

        <div style={{ padding: 18, borderRadius: 14, border: `1px solid ${T.border}`, background: T.bg }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 14 }}>RÉSULTAT</div>
          {result?.error ? (
            <div style={{ color: '#e94560', fontSize: 13, padding: '12px 0' }}>{result.error}</div>
          ) : (
            <>
              {result?.verdict && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  marginBottom: 14,
                  background: `${result.verdict.color || T.accent}18`,
                  border: `1px solid ${result.verdict.color || T.accent}44`,
                  color: result.verdict.color || T.accent,
                  fontWeight: 700,
                  fontSize: 13,
                }}>
                  {result.verdict.label}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(result?.rows || []).map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, borderBottom: `1px solid ${T.border}`, paddingBottom: 8 }}>
                    <span style={{ color: T.muted }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.highlight || T.ink, textAlign: 'right' }}>{row.value}</span>
                  </div>
                ))}
              </div>
              {result?.summary && (
                <div style={{ marginTop: 16, fontSize: 12, color: T.ink, lineHeight: 1.6, padding: '10px 12px', borderRadius: 10, background: T.surface }}>
                  {result.summary}
                </div>
              )}
            </>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={!result || result.error}
              onClick={copyText}
              style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: T.accent, color: '#fff', fontSize: 12, fontWeight: 700, cursor: result?.error ? 'not-allowed' : 'pointer', opacity: result?.error ? 0.5 : 1 }}
            >
              Copier le résultat
            </button>
            <button
              type="button"
              disabled={!result || result.error}
              onClick={() => onSendToNotebook(formula, result)}
              style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${T.accent}`, background: `${T.accent}10`, color: T.accent, fontSize: 12, fontWeight: 700, cursor: result?.error ? 'not-allowed' : 'pointer', opacity: result?.error ? 0.5 : 1 }}
            >
              Envoyer vers carnet
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
