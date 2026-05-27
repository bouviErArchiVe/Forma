import { PF_TOOLS, PF_TOOL_GROUPS } from '@/lib/proforma/tools'
import { PF_DARK } from '@/lib/proforma/constants'

export default function ProformaToolbar({ tool, setTool, onUndo, onRedo, canUndo, canRedo }) {
  const groups = PF_TOOL_GROUPS.filter((g) => g.id !== 'nav')

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
      overflowY: 'auto',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        <ToolBtn icon="↶" title="Annuler" disabled={!canUndo} onClick={onUndo} />
        <ToolBtn icon="↷" title="Rétablir" disabled={!canRedo} onClick={onRedo} />
      </div>

      <ToolBtn icon="✋" title="Déplacer" active={tool === 'hand'} onClick={() => setTool('hand')} />

      {groups.map((g) => (
        <div key={g.id} style={{ width: '100%' }}>
          <div style={{ fontSize: 8, color: PF_DARK.muted, textAlign: 'center', margin: '8px 0 4px', letterSpacing: 0.5 }}>
            {g.label.slice(0, 4).toUpperCase()}
          </div>
          {Object.values(PF_TOOLS)
            .filter((t) => t.group === g.id)
            .map((t) => (
              <ToolBtn
                key={t.id}
                icon={t.icon}
                title={t.label}
                active={tool === t.id}
                onClick={() => setTool(t.id)}
              />
            ))}
        </div>
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
