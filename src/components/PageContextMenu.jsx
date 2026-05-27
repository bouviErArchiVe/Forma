import { useEffect, useRef, useState } from 'react'
import { TOKENS } from '@/theme/tokens'
import { glassStyle } from '@/theme/glass'
import { PAGE_FORMATS, flipPageOrientation, orientationFromFormat } from '@/lib/pageFormats'
import {
  GRID_STYLES,
  PAGE_COLORS,
  GRID_COLORS,
  pageDisplayName,
} from '@/lib/pageSettings'

function SwatchRow({ items, value, onChange, T, type = 'solid' }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item) => {
        const active = value === item.c
        return (
          <button
            key={item.id}
            type="button"
            title={item.l}
            onClick={() => onChange(item.c)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: type === 'solid' ? item.c : '#fff',
              border: `2px solid ${active ? T.accent : T.border}`,
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              outline: item.c === '#ffffff' ? `1px solid ${T.border}` : 'none',
              padding: 0,
            }}
          >
            {type === 'grid' && (
              <svg width={28} height={28} style={{ position: 'absolute', inset: 0 }}>
                {[5, 12, 19, 26].map((n) => (
                  <g key={n}>
                    <line x1={n} y1={0} x2={n} y2={28} stroke={item.c} strokeWidth={1} />
                    <line x1={0} y1={n} x2={28} y2={n} stroke={item.c} strokeWidth={1} />
                  </g>
                ))}
              </svg>
            )}
          </button>
        )
      })}
      <button
        type="button"
        title="Par défaut"
        onClick={() => onChange(null)}
        style={{
          width: 28,
          height: 28,
          borderRadius: 7,
          border: `2px dashed ${value == null ? T.accent : T.border}`,
          background: T.bg,
          color: T.muted,
          fontSize: 10,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ∅
      </button>
    </div>
  )
}

export default function PageContextMenu({
  T,
  pageNum,
  x,
  y,
  meta,
  onClose,
  onApply,
  onDuplicate,
  onDelete,
  canDelete,
}) {
  const ref = useRef(null)
  const [nameDraft, setNameDraft] = useState(meta?.name || '')

  useEffect(() => {
    setNameDraft(meta?.name || '')
  }, [meta?.name, pageNum])

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [onClose])

  if (!meta) return null

  const orientation = orientationFromFormat(meta.format, customMm)
  const isCustom = meta.format === 'custom'
  const customMm = meta.customMm || { w: 210, h: 297 }

  const apply = (partial) => onApply?.(partial)

  const commitName = () => {
    const trimmed = nameDraft.trim()
    if (trimmed !== (meta.name || '')) apply({ name: trimmed })
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: Math.min(x, window.innerWidth - 300),
        top: Math.min(y, window.innerHeight - 520),
        zIndex: TOKENS.zIndex.modal,
        width: 288,
        maxHeight: 'min(520px, 88vh)',
        overflowY: 'auto',
        borderRadius: TOKENS.radius.md,
        padding: 8,
        ...glassStyle(T, { variant: 'panel' }),
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, padding: '2px 6px 8px' }}>
        {pageDisplayName(pageNum, meta)}
      </div>

      <div style={{ fontSize: 8, color: T.muted, padding: '0 6px 4px', fontWeight: 700 }}>NOM</div>
      <input
        value={nameDraft}
        onChange={(e) => setNameDraft(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => { if (e.key === 'Enter') { commitName(); e.target.blur() } }}
        placeholder={`Page ${pageNum}`}
        style={{
          width: 'calc(100% - 12px)',
          margin: '0 6px 10px',
          fontSize: 10,
          padding: '5px 8px',
          borderRadius: 7,
          border: `1px solid ${T.border}`,
          background: T.bg,
          color: T.ink,
          outline: 'none',
        }}
      />

      <div style={{ fontSize: 8, color: T.muted, padding: '0 6px 4px', fontWeight: 700 }}>FORMAT</div>
      <select
        value={meta.format}
        onChange={(e) => apply({ format: e.target.value })}
        style={{
          width: 'calc(100% - 12px)',
          margin: '0 6px 8px',
          fontSize: 9,
          padding: '5px 7px',
          borderRadius: 7,
          border: `1px solid ${T.border}`,
          background: T.bg,
          color: T.ink,
        }}
      >
        {PAGE_FORMATS.map((f) => (
          <option key={f.id} value={f.id}>{f.l} — {f.desc}</option>
        ))}
      </select>

      {isCustom && (
        <div style={{ display: 'flex', gap: 6, margin: '0 6px 8px' }}>
          {['w', 'h'].map((k) => (
            <label key={k} style={{ flex: 1, fontSize: 8, color: T.muted }}>
              {k === 'w' ? 'Largeur (mm)' : 'Hauteur (mm)'}
              <input
                type="number"
                min={50}
                max={2000}
                value={customMm[k]}
                onChange={(e) => {
                  const v = Math.max(50, Math.min(2000, parseInt(e.target.value, 10) || 50))
                  apply({ customMm: { ...customMm, [k]: v } })
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  marginTop: 3,
                  fontSize: 9,
                  padding: '4px 6px',
                  borderRadius: 6,
                  border: `1px solid ${T.border}`,
                  background: T.bg,
                  color: T.ink,
                }}
              />
            </label>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 5, margin: '0 6px 10px' }}>
        {[
          { id: 'portrait', label: 'Portrait', active: orientation === 'portrait' },
          { id: 'landscape', label: 'Paysage', active: orientation === 'landscape' },
        ].map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={o.active}
            onClick={() => apply(flipPageOrientation(meta.format, customMm))}
            style={{
              flex: 1,
              padding: '5px 0',
              borderRadius: 7,
              border: `1px solid ${o.active ? T.accent : T.border}`,
              background: o.active ? `${T.accent}18` : T.bg,
              color: o.active ? T.accent : T.ink,
              fontSize: 9,
              cursor: o.active ? 'default' : 'pointer',
              opacity: o.active ? 1 : 0.9,
            }}
          >
            {o.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => apply({ infinite: !meta.infinite })}
          title="Canvas infini pour cette page"
          style={{
            padding: '5px 8px',
            borderRadius: 7,
            border: `1px solid ${meta.infinite ? '#00ffcc' : T.border}`,
            background: meta.infinite ? 'rgba(0,255,204,.12)' : T.bg,
            color: meta.infinite ? '#00ffcc' : T.muted,
            fontSize: 9,
            cursor: 'pointer',
          }}
        >
          ∞
        </button>
      </div>

      <div style={{ fontSize: 8, color: T.muted, padding: '0 6px 4px', fontWeight: 700 }}>GRILLE / PAPIER</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '0 6px 10px' }}>
        {GRID_STYLES.map((g) => (
          <button
            key={g.id}
            type="button"
            title={g.desc}
            onClick={() => apply({ gridStyle: g.id })}
            style={{
              padding: '4px 7px',
              borderRadius: 6,
              border: `1px solid ${meta.gridStyle === g.id ? T.accent : T.border}`,
              background: meta.gridStyle === g.id ? `${T.accent}18` : T.bg,
              color: meta.gridStyle === g.id ? T.accent : T.ink,
              fontSize: 8,
              cursor: 'pointer',
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 8, color: T.muted, padding: '0 6px 4px', fontWeight: 700 }}>FOND</div>
      <div style={{ margin: '0 6px 10px' }}>
        <SwatchRow
          T={T}
          items={PAGE_COLORS}
          value={meta.pageColor}
          onChange={(c) => apply({ pageColor: c })}
        />
      </div>

      <div style={{ fontSize: 8, color: T.muted, padding: '0 6px 4px', fontWeight: 700 }}>COULEUR GRILLE</div>
      <div style={{ margin: '0 6px 12px' }}>
        <SwatchRow
          T={T}
          type="grid"
          items={GRID_COLORS}
          value={meta.gridColor}
          onChange={(c) => apply({ gridColor: c })}
        />
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, margin: '4px 0 6px' }} />

      {[
        { label: '⊕ Dupliquer', fn: onDuplicate },
        ...(canDelete ? [{ label: '🗑 Supprimer', fn: onDelete, danger: true }] : []),
      ].map((it) => (
        <button
          key={it.label}
          type="button"
          onClick={() => { it.fn?.(); onClose() }}
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
