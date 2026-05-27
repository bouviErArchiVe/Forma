import { PF_DARK } from '@/lib/proforma/constants'

const V1_TOOLS = [
  { id: 'hand', icon: '✋', label: 'Main' },
  { id: 'pen', icon: '✏', label: 'Crayon' },
  { id: 'eraser', icon: '⌫', label: 'Gomme' },
]

/** Proforma V1 — barre d'outils minimale */
export default function ProformaToolbar({ tool, setTool, onUndo, onRedo, canUndo, canRedo }) {
  return (
    <div className="proforma-toolbar" style={{
      width: 56,
      background: PF_DARK.panel,
      borderRight: `1px solid ${PF_DARK.border}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 0',
      gap: 4,
      flexShrink: 0,
    }}>
      <ToolBtn icon="↶" title="Annuler" disabled={!canUndo} onClick={onUndo} />
      <ToolBtn icon="↷" title="Rétablir" disabled={!canRedo} onClick={onRedo} />
      <div style={{ height: 1, width: 32, background: PF_DARK.border, margin: '8px 0' }} />
      {V1_TOOLS.map((t) => (
        <ToolBtn
          key={t.id}
          icon={t.icon}
          title={t.label}
          active={tool === t.id}
          onClick={() => setTool(t.id)}
        />
      ))}
    </div>
  )
}

function ToolBtn({ icon, title, active, disabled, onClick }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 40,
        height: 36,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 8,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 16,
        background: active ? `${PF_DARK.accent}33` : 'transparent',
        color: active ? PF_DARK.accent : disabled ? PF_DARK.muted : PF_DARK.ink,
        outline: active ? `1px solid ${PF_DARK.accent}` : 'none',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {icon}
    </button>
  )
}
