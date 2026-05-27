import { FPR_DARK, ANIMATIONS } from '@/lib/formapresent/constants'

export default function PresentToolbar({
  onAddText, onAddImage, onAddVideo, onImportForma,
  onAlign, onToggleGrid, onToggleGuides, onToggleSnap,
  settings, selectedElement, onUpdateElement, onDeleteElement, onPresent,
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', flexWrap: 'wrap',
      background: FPR_DARK.panel, borderBottom: `1px solid ${FPR_DARK.border}`,
    }}>
      <ToolBtn onClick={onAddText} label="Texte" icon="T" />
      <ToolBtn onClick={onAddImage} label="Image" icon="🖼" />
      <ToolBtn onClick={onAddVideo} label="Vidéo" icon="▶" />
      <ToolBtn onClick={onImportForma} label="Forma" icon="🔗" />

      <Sep />

      <span style={{ fontSize: 10, color: FPR_DARK.muted }}>Aligner</span>
      {['left', 'center', 'right', 'top', 'middle', 'bottom'].map((a) => (
        <MiniBtn key={a} onClick={() => onAlign(a)} disabled={!selectedElement} title={a}>
          {a.slice(0, 1).toUpperCase()}
        </MiniBtn>
      ))}

      <Sep />

      <MiniBtn onClick={onToggleGrid} active={settings?.showGrid} title="Grille">#</MiniBtn>
      <MiniBtn onClick={onToggleGuides} active={settings?.showGuides} title="Guides">⊞</MiniBtn>
      <MiniBtn onClick={onToggleSnap} active={settings?.snapToGrid} title="Magnétisme">⊡</MiniBtn>

      {selectedElement && (
        <>
          <Sep />
          <select
            value={selectedElement.animation || 'none'}
            onChange={(e) => onUpdateElement?.({ animation: e.target.value })}
            style={selectStyle}
            title="Animation"
          >
            {Object.values(ANIMATIONS).map((a) => (
              <option key={a.id} value={a.id}>{a.label}</option>
            ))}
          </select>
          <MiniBtn onClick={onDeleteElement} title="Supprimer">🗑</MiniBtn>
        </>
      )}

      <div style={{ flex: 1 }} />

      <button type="button" onClick={onPresent} style={{
        padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
        background: FPR_DARK.accent, color: '#fff', fontWeight: 600, fontSize: 13,
      }}>
        ▶ Présenter
      </button>
    </div>
  )
}

function ToolBtn({ onClick, label, icon }) {
  return (
    <button type="button" onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
      borderRadius: 8, border: `1px solid ${FPR_DARK.border}`, background: FPR_DARK.surface,
      color: FPR_DARK.ink, cursor: 'pointer', fontSize: 12,
    }}>
      <span>{icon}</span> {label}
    </button>
  )
}

function MiniBtn({ children, onClick, active, disabled, title }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} style={{
      padding: '4px 8px', borderRadius: 6, border: `1px solid ${active ? FPR_DARK.accent : FPR_DARK.border}`,
      background: active ? `${FPR_DARK.accent}44` : FPR_DARK.surface,
      color: disabled ? FPR_DARK.muted : FPR_DARK.ink, cursor: disabled ? 'default' : 'pointer', fontSize: 11,
      opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  )
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: FPR_DARK.border, margin: '0 4px' }} />
}

const selectStyle = {
  fontSize: 11, background: FPR_DARK.surface, color: FPR_DARK.ink,
  border: `1px solid ${FPR_DARK.border}`, borderRadius: 6, padding: '4px 6px',
}
