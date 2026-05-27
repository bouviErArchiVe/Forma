import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'
import { TYPE } from '@/lib/design'

export default function EditorSidebar({
  T,
  open,
  onOpen,
  onClose,
  tool,
  setTool,
  toolsList = [],
  page,
  pagesCount,
  goToPage,
  onAddPage,
  readOnly = false,
}) {
  return (
    <>
      <div
        className={`forma-sidebar-backdrop ${open ? 'forma-sidebar-backdrop--open' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={`forma-editor-sidebar ${open ? 'forma-editor-sidebar--open' : ''}`}
        style={{
          ...glassStyle(T, { variant: 'panel', blur: TOKENS.blur.lg, opacity: 0.94 }),
          borderRight: `1px solid ${rgbaFromHex(T.border, 0.4)}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ ...TYPE.display, fontSize: 15 }}>Outils & pages</div>
          <button
            type="button"
            onClick={onClose}
            className="forma-btn-glass"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, padding: '2px 8px' }}
          >
            ×
          </button>
        </div>

        <div style={{ ...TYPE.micro, color: T.muted, marginBottom: 8 }}>OUTILS · swipe ↔ sur le canvas</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 18 }}>
          {toolsList.flatMap((grp) => grp.items.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.l}
              disabled={readOnly && t.id !== 'hand'}
              onClick={() => setTool(t.id)}
              className="forma-tool-btn"
              style={{
                padding: '10px 4px',
                borderRadius: TOKENS.radius.sm,
                border: `1px solid ${tool === t.id ? T.accent : rgbaFromHex(T.border, 0.45)}`,
                background: tool === t.id ? `${T.accent}18` : rgbaFromHex(T.bg, 0.35),
                color: tool === t.id ? T.accent : T.ink,
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                opacity: readOnly && t.id !== 'hand' ? 0.45 : 1,
              }}
            >
              <span>{t.i}</span>
              <span style={{ fontSize: 8, fontWeight: 700, color: T.muted, lineHeight: 1 }}>{t.l.split('.')[0]}</span>
            </button>
          )))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ ...TYPE.micro, color: T.muted }}>PAGES ({page}/{pagesCount})</div>
          {!readOnly && (
            <button
              type="button"
              onClick={onAddPage}
              style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
            >
              + Ajouter
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, overflowY: 'auto', maxHeight: 'calc(100% - 280px)' }}>
          {Array.from({ length: pagesCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { goToPage(n); onClose() }}
              style={{
                padding: '12px 0',
                borderRadius: TOKENS.radius.sm,
                border: `1px solid ${page === n ? T.accent : rgbaFromHex(T.border, 0.4)}`,
                background: page === n ? `${T.accent}15` : rgbaFromHex(T.bg, 0.3),
                color: page === n ? T.accent : T.ink,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: page === n ? 800 : 600,
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </aside>
      {!open && (
        <button
          type="button"
          className="forma-editor-sidebar-tab"
          onClick={onOpen}
          style={{
            position: 'fixed',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: TOKENS.zIndex.float - 2,
            padding: '12px 6px 12px 4px',
            borderRadius: '0 12px 12px 0',
            border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
            borderLeft: 'none',
            background: rgbaFromHex(T.surface, 0.92),
            color: T.accent,
            cursor: 'pointer',
            fontSize: 16,
            boxShadow: TOKENS.shadow.md,
          }}
          title="Ouvrir le panneau"
        >
          ☰
        </button>
      )}
    </>
  )
}
