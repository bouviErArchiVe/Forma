export default function FormulaCard({ T, formula, favorite, onOpen, onToggleFavorite }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(formula.id)}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(formula.id) }}
      style={{
        padding: '16px 16px 14px',
        borderRadius: 14,
        border: `1px solid ${T.border}`,
        background: T.surface,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
        transition: 'transform .15s, box-shadow .15s, border-color .15s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 24px ${T.accent}18`
        e.currentTarget.style.borderColor = `${T.accent}55`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.05)'
        e.currentTarget.style.borderColor = T.border
      }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(formula.id) }}
        title={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          color: favorite ? '#f5a623' : T.muted,
          padding: 4,
        }}
      >
        {favorite ? '★' : '☆'}
      </button>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{formula.icon}</div>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 6, paddingRight: 24 }}>
        {formula.title}
      </div>
      <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, marginBottom: 10, minHeight: 32 }}>
        {formula.description}
      </div>
      <div style={{
        fontSize: 10,
        fontFamily: 'monospace',
        color: T.accent,
        background: `${T.accent}10`,
        padding: '6px 8px',
        borderRadius: 8,
      }}>
        {formula.formulaText}
      </div>
    </div>
  )
}
