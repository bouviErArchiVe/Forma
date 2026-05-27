import { useState } from 'react'
import DraggablePanel from '@/components/DraggablePanel'
import { TOKENS } from '@/theme/tokens'

export const EDITOR_TOOLS_LIST = [
  { g: 'Nav', items: [{ id: 'hand', l: 'Déplacer', i: '✋' }, { id: 'arrow', l: 'Sélection', i: '↖' }] },
  { g: 'Dessin', items: [{ id: 'pen', l: 'Crayon', i: '✏' }, { id: 'highlight', l: 'Surlig.', i: '▌' }, { id: 'eraser', l: 'Gomme', i: '◻' }] },
  { g: 'Formes', items: [{ id: 'line', l: 'Ligne', i: '/' }, { id: 'rect', l: 'Rect.', i: '□' }, { id: 'circle', l: 'Cercle', i: '○' }, { id: 'shape-arrow', l: 'Flèche', i: '→' }] },
  { g: 'Archi', items: [{ id: 'dimline', l: 'Cotation', i: '↔' }, { id: 'cloud', l: 'Bulle', i: '💬' }, { id: 'lasso', l: 'Lasso', i: '⬡' }, { id: 'lasso-rect', l: 'Lasso ▭', i: '⬜' }] },
  { g: 'Spécial', items: [{ id: 'text', l: 'Texte', i: 'T' }, { id: 'eyedropper', l: 'Pipette', i: '💉' }] },
]

export default function FloatingToolsToolbar({
  T,
  tool,
  setTool,
  color,
  sizeMm,
  eraserMm,
  unitSys,
  formatDimension,
  toolsList = EDITOR_TOOLS_LIST,
  onLayoutChange,
  open = true,
  onClose,
}) {
  const [dockMode, setDockMode] = useState('top')
  const isVertical = dockMode === 'left' || dockMode === 'right'

  const handleLayoutChange = (layout) => {
    const mode = layout?.mode || 'top'
    setDockMode(mode)
    onLayoutChange?.(mode)
  }

  return (
    <DraggablePanel
      T={T}
      id="editor-tools"
      title=""
      open={open}
      onClose={onClose}
      variant="toolbar"
      defaultSide="top"
      width={52}
      dockSizes={{ top: 44, bottom: 44, left: 52, right: 52 }}
      resizable={false}
      zIndexOffset={2}
      onLayoutChange={handleLayoutChange}
      headerExtra={!isVertical ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginLeft: 4 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: tool === 'eraser' ? '#eee' : color, border: `1px solid ${T.border}` }} />
          <span style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
            {formatDimension(tool === 'eraser' ? eraserMm : sizeMm, unitSys)}
          </span>
        </div>
      ) : undefined}
    >
      {toolsList.map((grp) => (
        <div
          key={grp.g}
          style={{
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            gap: 2,
            paddingRight: isVertical ? 0 : 6,
            marginRight: isVertical ? 0 : 3,
            paddingBottom: isVertical ? 4 : 0,
            marginBottom: isVertical ? 2 : 0,
            borderRight: isVertical ? 'none' : `1px solid ${T.border}`,
            borderBottom: isVertical ? `1px solid ${T.border}` : 'none',
            flexShrink: 0,
          }}
        >
          {grp.items.map((t) => (
            <button
              key={t.id}
              type="button"
              title={t.l}
              onClick={() => setTool(t.id)}
              className="forma-tool-btn"
              style={{
                height: isVertical ? 32 : 32,
                width: isVertical ? 36 : undefined,
                minWidth: isVertical ? 36 : 32,
                padding: isVertical ? 0 : '0 6px',
                borderRadius: TOKENS.radius.sm,
                border: `1px solid ${tool === t.id ? T.accent : T.border}`,
                background: tool === t.id ? `${T.accent}18` : T.bg,
                color: tool === t.id ? T.accent : T.muted,
                cursor: 'pointer',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span>{t.i}</span>
            </button>
          ))}
        </div>
      ))}
    </DraggablePanel>
  )
}
