import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

const QUICK_TOOLS = [
  { id: 'hand', i: '✋', l: 'Déplacer' },
  { id: 'pen', i: '✏', l: 'Crayon' },
  { id: 'highlight', i: '▌', l: 'Surlign.' },
  { id: 'eraser', i: '◻', l: 'Gomme' },
  { id: 'line', i: '/', l: 'Ligne' },
  { id: 'text', i: 'T', l: 'Texte' },
]

/** Barre d'outils fixe en bas — iPad / tablette */
export default function EditorBottomToolbar({
  T,
  tool,
  setTool,
  color,
  readOnly = false,
  onOpenSidebar,
  formatDimension,
  sizeMm,
  eraserMm,
  unitSys,
}) {
  const sizeLabel = formatDimension?.(tool === 'eraser' ? eraserMm : sizeMm, unitSys) || ''

  return (
    <div
      className="forma-ipad-bottom-toolbar"
      style={{
        ...glassStyle(T, { variant: 'toolbar', blur: TOKENS.blur.lg, opacity: 0.94 }),
        borderTop: `1px solid ${rgbaFromHex(T.border, 0.4)}`,
      }}
    >
      <div className="forma-ipad-bottom-toolbar__scroll">
        {QUICK_TOOLS.map((t) => {
          const active = tool === t.id
          const disabled = readOnly && t.id !== 'hand'
          return (
            <button
              key={t.id}
              type="button"
              title={t.l}
              disabled={disabled}
              onClick={() => setTool(t.id)}
              className="forma-tool-btn forma-ipad-bottom-toolbar__btn"
              style={{
                border: `1px solid ${active ? T.accent : rgbaFromHex(T.border, 0.45)}`,
                background: active ? `${T.accent}20` : rgbaFromHex(T.bg, 0.35),
                color: active ? T.accent : T.ink,
                opacity: disabled ? 0.45 : 1,
              }}
            >
              <span className="forma-ipad-bottom-toolbar__icon">{t.i}</span>
              <span className="forma-ipad-bottom-toolbar__label">{t.l}</span>
            </button>
          )
        })}
      </div>
      <div className="forma-ipad-bottom-toolbar__meta">
        <div
          title={sizeLabel}
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: tool === 'eraser' ? '#eee' : color,
            border: `2px solid ${T.border}`,
            flexShrink: 0,
          }}
        />
        {sizeLabel && (
          <span style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {sizeLabel}
          </span>
        )}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="forma-btn-glass forma-ipad-bottom-toolbar__more"
          title="Tous les outils"
          style={{
            border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
            background: rgbaFromHex(T.bg, 0.35),
            color: T.accent,
          }}
        >
          ☰
        </button>
      </div>
    </div>
  )
}
