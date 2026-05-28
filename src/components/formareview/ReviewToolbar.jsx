import { REVIEW_TOOLS, MARKUP_COLORS, FRV_DARK } from '@/lib/formareview/constants'

function ColorDots({ color, onColorChange }) {
  return (
    <>
      <span style={{ fontSize: 11, color: FRV_DARK.muted, marginLeft: 4 }}>Couleur</span>
      {MARKUP_COLORS.slice(0, 5).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onColorChange(c)}
          style={{
            width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
            border: color === c ? '2px solid #fff' : '2px solid transparent',
            flexShrink: 0,
          }}
        />
      ))}
    </>
  )
}

export default function ReviewToolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  role,
  onRoleChange,
  variant = 'top',
  onOpenSidebar,
  onOpenThread,
  threadCount = 0,
}) {
  if (variant === 'bottom') {
    return (
      <div className="forma-review-bottom-toolbar" style={{ background: FRV_DARK.panel, borderTop: `1px solid ${FRV_DARK.border}` }}>
        <button
          type="button"
          className="forma-review-bottom-toolbar__btn"
          onClick={onOpenSidebar}
          title="Pages"
          style={{ background: FRV_DARK.surface, color: FRV_DARK.ink, border: `1px solid ${FRV_DARK.border}` }}
        >
          <span>☰</span>
          <span style={{ fontSize: 8, fontWeight: 700 }}>Pages</span>
        </button>
        {Object.values(REVIEW_TOOLS).map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.label}
            onClick={() => onToolChange(t.id)}
            className="forma-review-bottom-toolbar__btn"
            style={{
              background: tool === t.id ? FRV_DARK.accent : FRV_DARK.surface,
              color: tool === t.id ? '#1a1e28' : FRV_DARK.ink,
              border: `1px solid ${tool === t.id ? FRV_DARK.accent2 : FRV_DARK.border}`,
            }}
          >
            <span>{t.icon}</span>
            <span style={{ fontSize: 8, fontWeight: 700 }}>{t.label.split(' ')[0]}</span>
          </button>
        ))}
        {MARKUP_COLORS.slice(0, 5).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onColorChange(c)}
            title="Couleur"
            className="forma-review-bottom-toolbar__btn"
            style={{
              background: c,
              border: color === c ? '2px solid #fff' : '2px solid transparent',
              minWidth: 36,
            }}
          />
        ))}
        <button
          type="button"
          className="forma-review-bottom-toolbar__btn"
          onClick={onOpenThread}
          title="Commentaires"
          style={{ background: FRV_DARK.surface, color: FRV_DARK.ink, border: `1px solid ${FRV_DARK.border}` }}
        >
          <span>💬</span>
          <span style={{ fontSize: 8, fontWeight: 700 }}>{threadCount || 'Fil'}</span>
        </button>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
      background: FRV_DARK.panel, borderBottom: `1px solid ${FRV_DARK.border}`,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: 11, color: FRV_DARK.muted, marginRight: 4 }}>Outils</span>
      {Object.values(REVIEW_TOOLS).map((t) => (
        <button
          key={t.id}
          type="button"
          title={t.label}
          onClick={() => onToolChange(t.id)}
          className="forma-tool-btn"
          style={{
            background: tool === t.id ? FRV_DARK.accent : FRV_DARK.surface,
            color: tool === t.id ? '#1a1e28' : FRV_DARK.ink,
            border: `1px solid ${tool === t.id ? FRV_DARK.accent2 : FRV_DARK.border}`,
            borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <span>{t.icon}</span>
          <span style={{ fontSize: 11 }}>{t.label}</span>
        </button>
      ))}

      <div style={{ width: 1, height: 24, background: FRV_DARK.border, margin: '0 4px' }} />

      <ColorDots color={color} onColorChange={onColorChange} />

      <div style={{ width: 1, height: 24, background: FRV_DARK.border, margin: '0 4px' }} />

      <span style={{ fontSize: 11, color: FRV_DARK.muted }}>Rôle</span>
      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        style={{
          background: FRV_DARK.surface, color: FRV_DARK.ink, border: `1px solid ${FRV_DARK.border}`,
          borderRadius: 6, padding: '4px 8px', fontSize: 12,
        }}
      >
        <option value="prof">Professeur</option>
        <option value="student">Étudiant</option>
        <option value="team">Équipe</option>
        <option value="jury">Jury</option>
      </select>
    </div>
  )
}
