import { useState } from 'react'
import {
  PAGE_FORMATS,
  PAGE_FORMAT_GROUPS,
  CUSTOM_SIZE_UNITS,
  formatsByGroup,
  formatPreviewSize,
  clampCustomMm,
  getFormatById,
} from '@/lib/pageFormats'

function FormatTile({ T, fmt, active, onSelect, compact }) {
  const { w, h } = formatPreviewSize(fmt.wMm, fmt.hMm, compact ? 22 : 28, compact ? 32 : 40)
  const infinite = !!fmt.infinite

  return (
    <button
      type="button"
      title={fmt.desc}
      onClick={() => onSelect(fmt.id)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: compact ? 3 : 4,
        padding: compact ? '5px 4px' : '6px 5px',
        borderRadius: 8,
        border: `1.5px solid ${active ? T.accent : T.border}`,
        background: active ? `${T.accent}12` : T.bg,
        cursor: 'pointer',
        minWidth: compact ? 52 : 58,
        flex: '1 1 52px',
      }}
    >
      <div
        style={{
          width: infinite ? 24 : w,
          height: infinite ? 24 : h,
          borderRadius: infinite ? '50%' : 2,
          border: `1.5px solid ${active ? T.accent : T.muted}`,
          background: active ? `${T.accent}18` : T.surface || T.bg,
          boxShadow: active ? `0 2px 8px ${T.accent}22` : 'none',
          position: 'relative',
        }}
      >
        {infinite && (
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: T.accent }}>∞</span>
        )}
      </div>
      <span style={{ fontSize: compact ? 8 : 9, fontWeight: active ? 800 : 600, color: active ? T.accent : T.ink, lineHeight: 1.1, textAlign: 'center' }}>
        {fmt.l}
      </span>
      {!compact && (
        <span style={{ fontSize: 7, color: T.muted, lineHeight: 1.1, textAlign: 'center' }}>{fmt.desc}</span>
      )}
    </button>
  )
}

export default function PageFormatPicker({
  T,
  format,
  customMm = { w: 210, h: 297 },
  onChange,
  compact = false,
}) {
  const [customUnit, setCustomUnit] = useState('mm')
  const unit = CUSTOM_SIZE_UNITS.find((u) => u.id === customUnit) || CUSTOM_SIZE_UNITS[0]
  const isCustom = format === 'custom'

  const selectFormat = (fmtId) => {
    onChange?.({
      format: fmtId,
      infinite: fmtId === 'infinite',
    })
  }

  const updateCustomDim = (key, raw) => {
    const mm = unit.toMm(Math.max(0, parseFloat(raw) || 0))
    const next = clampCustomMm(
      key === 'w' ? mm : customMm.w,
      key === 'h' ? mm : customMm.h,
    )
    onChange?.({ format: 'custom', customMm: next, infinite: false })
  }

  const displayW = +unit.fromMm(customMm.w || 210).toFixed(customUnit === 'in' ? 2 : customUnit === 'cm' ? 1 : 0)
  const displayH = +unit.fromMm(customMm.h || 297).toFixed(customUnit === 'in' ? 2 : customUnit === 'cm' ? 1 : 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8 }}>
      {PAGE_FORMAT_GROUPS.map((group) => {
        const items = formatsByGroup(group.id)
        if (!items.length) return null
        return (
          <div key={group.id}>
            <div style={{ fontSize: 8, color: T.muted, fontWeight: 700, padding: compact ? '0 2px 4px' : '0 6px 5px', letterSpacing: 0.4 }}>
              {group.label}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: compact ? 4 : 5, padding: compact ? 0 : '0 4px' }}>
              {items.map((fmt) => (
                <FormatTile
                  key={fmt.id}
                  T={T}
                  fmt={fmt}
                  active={format === fmt.id}
                  onSelect={selectFormat}
                  compact={compact}
                />
              ))}
            </div>
          </div>
        )
      })}

      {isCustom && (
        <div style={{ padding: compact ? '4px 2px 0' : '4px 6px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 8, color: T.muted, fontWeight: 700 }}>Unité</span>
            <select
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              style={{
                flex: 1,
                fontSize: 9,
                padding: '4px 6px',
                borderRadius: 6,
                border: `1px solid ${T.border}`,
                background: T.bg,
                color: T.ink,
              }}
            >
              {CUSTOM_SIZE_UNITS.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['w', 'Largeur'], ['h', 'Hauteur']].map(([key, label]) => (
              <label key={key} style={{ flex: 1, fontSize: 8, color: T.muted }}>
                {label} ({unit.label})
                <input
                  type="number"
                  min={customUnit === 'in' ? 2 : 5}
                  step={customUnit === 'in' ? 0.1 : 1}
                  value={key === 'w' ? displayW : displayH}
                  onChange={(e) => updateCustomDim(key, e.target.value)}
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
                    boxSizing: 'border-box',
                  }}
                />
              </label>
            ))}
          </div>
          <div style={{ fontSize: 8, color: T.muted, fontFamily: 'monospace' }}>
            → {customMm.w}×{customMm.h} mm
          </div>
        </div>
      )}

      {!isCustom && format && (
        <div style={{ fontSize: 8, color: T.muted, padding: compact ? '2px 2px 0' : '2px 6px 0' }}>
          {getFormatById(format)?.desc}
        </div>
      )}
    </div>
  )
}
