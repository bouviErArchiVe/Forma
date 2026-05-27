import { useEffect, useRef } from 'react'
import { TOKENS } from '@/theme/tokens'
import { glassStyle } from '@/theme/glass'

export default function PageContextMenu({
  T,
  pageNum,
  x,
  y,
  pageFormats,
  currentFormat,
  onClose,
  onSetFormat,
  onDuplicate,
  onDelete,
  onOpenSettings,
  canDelete,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [onClose])

  const items = [
    { label: '🎨 Fond / grille', fn: onOpenSettings },
    { label: '⊕ Dupliquer', fn: onDuplicate },
    ...(canDelete ? [{ label: '🗑 Supprimer', fn: onDelete, danger: true }] : []),
  ]

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: Math.min(x, window.innerWidth - 200),
        top: Math.min(y, window.innerHeight - 280),
        zIndex: TOKENS.zIndex.modal,
        width: 196,
        borderRadius: TOKENS.radius.md,
        padding: 6,
        ...glassStyle(T, { variant: 'panel' }),
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: T.accent, padding: '4px 8px 8px' }}>
        Page {pageNum}
      </div>
      <div style={{ fontSize: 8, color: T.muted, padding: '0 8px 6px' }}>FORMAT</div>
      <select
        value={currentFormat}
        onChange={(e) => onSetFormat(e.target.value)}
        style={{ width: 'calc(100% - 16px)', margin: '0 8px 8px', fontSize: 9, padding: '4px 6px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink }}
      >
        {pageFormats.map((f) => (
          <option key={f.id} value={f.id}>{f.l}</option>
        ))}
      </select>
      {items.map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={() => { it.fn(); onClose() }}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            padding: '7px 10px',
            border: 'none',
            borderRadius: TOKENS.radius.sm,
            background: 'transparent',
            color: it.danger ? '#e94560' : T.ink,
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  )
}
