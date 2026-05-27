export default function FormulaCategoryMenu({ T, categories, activeId, onSelect, collapsed }) {
  return (
    <nav style={{
      width: collapsed ? 52 : 220,
      flexShrink: 0,
      borderRight: `1px solid ${T.border}`,
      background: T.surface,
      padding: collapsed ? '12px 6px' : '12px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      transition: 'width .2s',
      overflowY: 'auto',
    }}>
      {categories.map((cat) => {
        const active = activeId === cat.id
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            title={cat.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: collapsed ? '10px 8px' : '10px 12px',
              borderRadius: 10,
              border: `1px solid ${active ? T.accent : 'transparent'}`,
              background: active ? `${T.accent}14` : 'transparent',
              color: active ? T.accent : T.ink,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: active ? 700 : 500,
              textAlign: 'left',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{cat.icon}</span>
            {!collapsed && <span>{cat.label}</span>}
          </button>
        )
      })}
    </nav>
  )
}
