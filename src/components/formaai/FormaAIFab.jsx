import { FAI_DARK } from '@/lib/formaai/constants'

export default function FormaAIFab({ onSearch, onAI }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 3000,
      display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 8,
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <button
        type="button"
        title="Recherche globale (Ctrl+K)"
        onClick={onSearch}
        style={fabBtn}
      >
        <span style={{ fontSize: 16 }}>🔍</span>
        <span style={fabLabel}>Recherche</span>
      </button>
      <button
        type="button"
        title="FormaAI — aide (Alt+A)"
        onClick={onAI}
        style={{ ...fabBtn, background: FAI_DARK.accent, color: '#1a1e28' }}
      >
        <span style={{ fontSize: 16 }}>✦</span>
        <span style={fabLabel}>Aide IA</span>
      </button>
    </div>
  )
}

const fabBtn = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 14px', borderRadius: 12, border: 'none',
  background: FAI_DARK.panel, color: FAI_DARK.ink, cursor: 'pointer',
  fontSize: 13, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,.35)',
  whiteSpace: 'nowrap',
}

const fabLabel = { fontSize: 12, fontWeight: 700 }
