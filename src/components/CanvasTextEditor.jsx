import { useEffect, useRef, useState } from 'react'
import { TOKENS } from '@/theme/tokens'
import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { canvasFontCss, preloadCanvasFont } from '@/lib/fontUtils'
import TextFontPicker from '@/components/TextFontPicker'

export default function CanvasTextEditor({ T, edit, onCommit, onCancel, onFontChange }) {
  const ref = useRef(null)
  const [font, setFont] = useState(edit?.fontFamily || 'Patrick Hand')

  useEffect(() => {
    if (!edit) return
    const next = edit.fontFamily || 'Patrick Hand'
    setFont(next)
    preloadCanvasFont(next)
    const t = setTimeout(() => {
      ref.current?.focus()
      ref.current?.select()
    }, 30)
    return () => clearTimeout(t)
  }, [edit?.key, edit?.fontFamily])

  if (!edit?.screen) return null

  const fs = Math.max((edit.size || 0.5) * 3, 14)

  const commit = () => {
    const text = (ref.current?.value || '').trim()
    if (!text) {
      onCancel?.()
      return
    }
    onCommit?.({ ...edit, text, fontFamily: font })
  }

  const handleFont = (id) => {
    setFont(id)
    onFontChange?.(id)
    preloadCanvasFont(id)
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: edit.screen.x,
        top: edit.screen.y - fs,
        zIndex: TOKENS.zIndex.modal + 2,
        minWidth: 200,
        maxWidth: 'min(360px, 92vw)',
        ...glassStyle(T, { variant: 'float' }),
        padding: 8,
        boxShadow: TOKENS.shadow.panel,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: T.muted, marginBottom: 4 }}>POLICE</div>
        <TextFontPicker T={T} value={font} onChange={handleFont} compact />
      </div>
      <textarea
        ref={ref}
        defaultValue={edit.text || ''}
        placeholder="Saisir le texte…"
        rows={Math.min(6, Math.max(2, Math.ceil((edit.text || '').length / 28) + 1))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            commit()
          }
          if (e.key === 'Escape') onCancel?.()
        }}
        style={{
          width: '100%',
          minHeight: fs * 1.6,
          border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
          borderRadius: TOKENS.radius.sm,
          background: rgbaFromHex(T.bg, 0.55),
          color: edit.color || T.ink,
          fontSize: fs,
          fontFamily: canvasFontCss(font),
          lineHeight: 1.35,
          padding: '6px 8px',
          outline: 'none',
          resize: 'both',
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', gap: 6, marginTop: 6, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} className="forma-btn-glass" style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 9, cursor: 'pointer' }}>
          Annuler
        </button>
        <button type="button" onClick={commit} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: T.accent, color: '#fff', fontSize: 9, fontWeight: 700, cursor: 'pointer' }}>
          Valider
        </button>
      </div>
    </div>
  )
}
