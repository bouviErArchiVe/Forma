import { useState, useCallback, useEffect } from 'react'
import { runAIAction } from '@/lib/formaai/provider'
import { AI_ACTIONS, FAI_DARK } from '@/lib/formaai/constants'

export default function FormaAIPanel({ open, onClose, initialText = '' }) {
  const [text, setText] = useState(initialText)
  const [result, setResult] = useState('')
  const [busy, setBusy] = useState(false)
  const [activeAction, setActiveAction] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open && initialText) setText(initialText)
  }, [open, initialText])

  const run = useCallback(async (actionId) => {
    if (!text.trim()) { setError('Saisissez ou collez du texte.'); return }
    setBusy(true)
    setError('')
    setActiveAction(actionId)
    try {
      const out = await runAIAction(actionId, text)
      setResult(out)
    } catch (err) {
      setError(err.message || 'Erreur IA')
    } finally {
      setBusy(false)
    }
  }, [text])

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, width: 'min(380px, calc(100vw - 32px))',
      maxHeight: 'min(520px, calc(100vh - 32px))', zIndex: 3500,
      background: FAI_DARK.panel, borderRadius: 14, border: `1px solid ${FAI_DARK.border}`,
      boxShadow: '0 12px 48px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column',
      color: FAI_DARK.ink,
    }}>
      <div style={{
        padding: '12px 14px', borderBottom: `1px solid ${FAI_DARK.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>✦</span>
        <strong style={{ flex: 1, fontSize: 14 }}>FormaAI</strong>
        <span style={{ fontSize: 10, color: FAI_DARK.muted }}>discret · rapide</span>
        <button type="button" onClick={onClose} style={iconBtn}>✕</button>
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {Object.values(AI_ACTIONS).map((a) => (
          <button
            key={a.id}
            type="button"
            title={a.hint}
            disabled={busy}
            onClick={() => run(a.id)}
            style={{
              padding: '5px 8px', borderRadius: 6, fontSize: 11, cursor: busy ? 'wait' : 'pointer',
              border: `1px solid ${activeAction === a.id ? FAI_DARK.accent : FAI_DARK.border}`,
              background: activeAction === a.id ? `${FAI_DARK.accent}33` : FAI_DARK.surface,
              color: FAI_DARK.ink,
            }}
          >
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 12px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Collez du texte, notes, tableau, contenu de slide…"
          rows={4}
          style={taStyle}
        />
        {busy && <div style={{ fontSize: 12, color: FAI_DARK.accent2 }}>Traitement…</div>}
        {error && <div style={{ fontSize: 12, color: '#e94560' }}>{error}</div>}
        {result && (
          <div style={{
            flex: 1, overflow: 'auto', padding: 10, borderRadius: 8,
            background: FAI_DARK.bg, border: `1px solid ${FAI_DARK.border}`,
            fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap',
          }}>
            {result}
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px', borderTop: `1px solid ${FAI_DARK.border}`, display: 'flex', gap: 8 }}>
        {result && (
          <button type="button" onClick={() => navigator.clipboard?.writeText(result)} style={btnSm}>
            Copier
          </button>
        )}
        <button type="button" onClick={() => { setResult(''); setError('') }} style={btnSm}>Effacer</button>
      </div>
    </div>
  )
}

const taStyle = {
  width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: 72,
  background: FAI_DARK.bg, color: FAI_DARK.ink, border: `1px solid ${FAI_DARK.border}`,
  borderRadius: 8, padding: 8, fontSize: 12, fontFamily: 'inherit',
}
const iconBtn = { background: 'none', border: 'none', color: FAI_DARK.muted, cursor: 'pointer', fontSize: 14 }
const btnSm = {
  padding: '5px 10px', borderRadius: 6, border: `1px solid ${FAI_DARK.border}`,
  background: FAI_DARK.surface, color: FAI_DARK.ink, cursor: 'pointer', fontSize: 11,
}
