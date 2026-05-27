import { FAI_DARK } from '@/lib/formaai/constants'

export default function FormaAIFab({ onSearch, onAI }) {
  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20, zIndex: 3000,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <button
        type="button"
        title="Recherche globale (Ctrl+K)"
        onClick={onSearch}
        style={fabStyle}
      >
        🔍
      </button>
      <button
        type="button"
        title="FormaAI (Alt+A)"
        onClick={onAI}
        style={{ ...fabStyle, background: FAI_DARK.accent, color: '#1a1e28' }}
      >
        ✦
      </button>
    </div>
  )
}

const fabStyle = {
  width: 44, height: 44, borderRadius: '50%', border: 'none',
  background: FAI_DARK.panel, color: FAI_DARK.ink, cursor: 'pointer',
  fontSize: 18, boxShadow: '0 4px 16px rgba(0,0,0,.35)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}
