import GlassPanel from '@/components/ui/GlassPanel'
import GlassButton from '@/components/ui/GlassButton'
import { TOKENS } from '@/theme/tokens'
import { rgbaFromHex } from '@/theme/glass'

export default function FloatingSelectionToolbar({
  T,
  bounds,
  count,
  showShapeOpts,
  rotation,
  onDelete,
  onDuplicate,
  onColor,
  onSize,
  onOpacity,
  onFill,
  onFillOpacity,
  onRotation,
  onClose,
}) {
  if (!bounds || !count) return null

  const top = Math.max(8, bounds.y1 - (showShapeOpts ? 88 : 52))
  const left = Math.min(Math.max(8, bounds.x1), 794 - 300)

  return (
    <GlassPanel
      T={T}
      variant="float"
      animate
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left,
        top,
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        gap: TOKENS.spacing.sm,
        padding: `${TOKENS.spacing.sm}px ${TOKENS.spacing.md}px`,
        minWidth: 240,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.muted, letterSpacing: 0.6 }}>
          {count} élément{count > 1 ? 's' : ''} · glisser pour déplacer
        </div>
        <button
          type="button"
          onClick={onClose}
          className="forma-btn-glass"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 14, padding: '2px 4px' }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        <GlassButton T={T} onClick={onDuplicate}>⧉ Dupliquer</GlassButton>
        <GlassButton T={T} danger onClick={onDelete}>🗑 Suppr.</GlassButton>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="color"
          defaultValue={T.accent}
          onChange={(e) => onColor(e.target.value)}
          title="Couleur trait"
          style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
        />
        {showShapeOpts && (
          <input
            type="color"
            defaultValue={T.accent}
            onChange={(e) => onFill(e.target.value)}
            title="Couleur remplissage"
            style={{ width: 28, height: 28, border: `2px dashed ${T.border}`, borderRadius: 6, background: 'none', cursor: 'pointer', padding: 0 }}
          />
        )}
        <select
          defaultValue="2"
          onChange={(e) => onSize(parseFloat(e.target.value))}
          title="Épaisseur"
          style={{
            flex: 1,
            minWidth: 72,
            padding: '5px 6px',
            borderRadius: TOKENS.radius.sm,
            border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
            background: rgbaFromHex(T.bg, 0.4),
            color: T.ink,
            fontSize: 10,
          }}
        >
          {[0.5, 1, 2, 3, 5, 8, 12].map((s) => (
            <option key={s} value={s}>{s} mm</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label style={{ fontSize: 8, color: T.muted, minWidth: 44 }}>Opacité</label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          defaultValue="1"
          onChange={(e) => onOpacity(parseFloat(e.target.value))}
          title="Opacité trait"
          style={{ flex: 1, accentColor: T.accent }}
        />
        {showShapeOpts && (
          <>
            <label style={{ fontSize: 8, color: T.muted, minWidth: 32 }}>Fill</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              defaultValue="0.25"
              onChange={(e) => onFillOpacity(parseFloat(e.target.value))}
              title="Opacité remplissage"
              style={{ flex: 1, accentColor: T.accent }}
            />
          </>
        )}
      </div>

      {showShapeOpts && count === 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 8, color: T.muted, minWidth: 44 }}>Rotation</label>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={rotation ?? 0}
            onChange={(e) => onRotation(parseInt(e.target.value, 10))}
            style={{ flex: 1, accentColor: T.accent }}
          />
          <span style={{ fontSize: 9, color: T.muted, minWidth: 28, fontFamily: 'monospace' }}>{rotation ?? 0}°</span>
        </div>
      )}
    </GlassPanel>
  )
}
