import { useState, useRef, useEffect, useCallback } from 'react'
import { glassStyle } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

export const EDITOR_TOOLS_LIST = [
  { g: 'Nav', items: [{ id: 'hand', l: 'Déplacer', i: '✋' }, { id: 'arrow', l: 'Sélection', i: '↖' }] },
  { g: 'Dessin', items: [{ id: 'pen', l: 'Crayon', i: '✏' }, { id: 'highlight', l: 'Surlig.', i: '▌' }, { id: 'eraser', l: 'Gomme', i: '◻' }] },
  { g: 'Formes', items: [{ id: 'line', l: 'Ligne', i: '/' }, { id: 'rect', l: 'Rect.', i: '□' }, { id: 'circle', l: 'Cercle', i: '○' }, { id: 'shape-arrow', l: 'Flèche', i: '→' }] },
  { g: 'Archi', items: [{ id: 'dimline', l: 'Cotation', i: '↔' }, { id: 'cloud', l: 'Bulle', i: '💬' }, { id: 'lasso', l: 'Lasso', i: '⬡' }, { id: 'lasso-rect', l: 'Lasso ▭', i: '⬜' }] },
  { g: 'Spécial', items: [{ id: 'text', l: 'Texte', i: 'T' }, { id: 'eyedropper', l: 'Pipette', i: '💉' }] },
]

const STORAGE_KEY = 'forma_editor_toolbar'
const TOP_BAR = 46
const BOTTOM_BAR = 32
const SNAP = 56

const DOCK_LABELS = { float: '⧉', top: '▔', bottom: '▁', left: '◧', right: '◨' }

function loadLayout() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { dock: 'top', x: 80, y: TOP_BAR + 8 }
}

function saveLayout(layout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout))
  } catch {}
}

function detectDock(x, y) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (y < TOP_BAR + SNAP) return 'top'
  if (y > vh - BOTTOM_BAR - SNAP) return 'bottom'
  if (x < SNAP) return 'left'
  if (x > vw - SNAP) return 'right'
  return null
}

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
}) {
  const [layout, setLayout] = useState(loadLayout)
  const [dragging, setDragging] = useState(false)
  const [dockPreview, setDockPreview] = useState(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const toolbarRef = useRef(null)

  useEffect(() => {
    saveLayout(layout)
    onLayoutChange?.(layout.dock)
  }, [layout, onLayoutChange])

  const isVertical = layout.dock === 'left' || layout.dock === 'right'
  const isCompact = isVertical

  const startDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = toolbarRef.current?.getBoundingClientRect()
    if (!rect) return
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    if (layout.dock !== 'float') {
      setLayout({ dock: 'float', x: rect.left, y: rect.top })
    }
    setDragging(true)
  }, [layout.dock])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const x = e.clientX - dragOffset.current.x
      const y = e.clientY - dragOffset.current.y
      setLayout((cur) => ({ ...cur, dock: 'float', x, y }))
      setDockPreview(detectDock(e.clientX, e.clientY))
    }
    const onUp = (e) => {
      setDragging(false)
      const dock = detectDock(e.clientX, e.clientY)
      if (dock) {
        setLayout((cur) => ({ dock, x: cur.x, y: cur.y }))
      } else {
        setLayout({
          dock: 'float',
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y,
        })
      }
      setDockPreview(null)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  const cycleDock = () => {
    const order = ['top', 'bottom', 'left', 'right', 'float']
    const idx = order.indexOf(layout.dock)
    const next = order[(idx + 1) % order.length]
    if (next === 'float') {
      setLayout({ dock: 'float', x: window.innerWidth / 2 - 200, y: TOP_BAR + 12 })
    } else {
      setLayout({ dock: next, x: layout.x, y: layout.y })
    }
  }

  const dockStyles = () => {
    const base = {
      zIndex: TOKENS.zIndex.toolbar + 2,
      ...glassStyle(T, { variant: 'toolbar', blur: TOKENS.blur.md }),
      userSelect: 'none',
    }
    switch (layout.dock) {
      case 'top':
        return { ...base, position: 'fixed', top: TOP_BAR, left: 0, right: 0, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }
      case 'bottom':
        return { ...base, position: 'fixed', bottom: BOTTOM_BAR, left: 0, right: 0, borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }
      case 'left':
        return { ...base, position: 'fixed', top: TOP_BAR, bottom: BOTTOM_BAR, left: 0, width: 52, borderRadius: 0, borderLeft: 'none', borderTop: 'none', borderBottom: 'none' }
      case 'right':
        return { ...base, position: 'fixed', top: TOP_BAR, bottom: BOTTOM_BAR, right: 0, width: 52, borderRadius: 0, borderRight: 'none', borderTop: 'none', borderBottom: 'none' }
      default:
        return {
          ...base,
          position: 'fixed',
          left: layout.x,
          top: layout.y,
          borderRadius: TOKENS.radius.lg,
          boxShadow: dragging ? TOKENS.shadow.panel : TOKENS.shadow.toolbar,
        }
    }
  }

  const innerStyle = {
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    alignItems: 'center',
    gap: 4,
    padding: isVertical ? '8px 6px' : '6px 10px',
    overflowX: isVertical ? 'hidden' : 'auto',
    overflowY: isVertical ? 'auto' : 'hidden',
    maxHeight: isVertical ? '100%' : undefined,
    maxWidth: layout.dock === 'float' ? 'min(92vw, 820px)' : undefined,
  }

  return (
    <>
      {dockPreview && (
        <div aria-hidden style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: TOKENS.zIndex.toolbar + 1 }}>
          {dockPreview === 'top' && <div style={{ position: 'absolute', top: TOP_BAR, left: 0, right: 0, height: 4, background: T.accent, opacity: 0.7 }} />}
          {dockPreview === 'bottom' && <div style={{ position: 'absolute', bottom: BOTTOM_BAR, left: 0, right: 0, height: 4, background: T.accent, opacity: 0.7 }} />}
          {dockPreview === 'left' && <div style={{ position: 'absolute', top: TOP_BAR, bottom: BOTTOM_BAR, left: 0, width: 4, background: T.accent, opacity: 0.7 }} />}
          {dockPreview === 'right' && <div style={{ position: 'absolute', top: TOP_BAR, bottom: BOTTOM_BAR, right: 0, width: 4, background: T.accent, opacity: 0.7 }} />}
        </div>
      )}

      <div ref={toolbarRef} className="forma-animate-in" style={dockStyles()}>
        <div style={innerStyle}>
          <div
            onMouseDown={startDrag}
            title={layout.dock === 'float' ? 'Glisser pour déplacer' : 'Glisser pour détacher'}
            style={{ cursor: layout.dock === 'float' ? (dragging ? 'grabbing' : 'grab') : 'grab', color: T.muted, fontSize: 11, padding: isVertical ? '2px 0' : '0 4px', flexShrink: 0, lineHeight: 1 }}
          >
            ⠿
          </div>

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
                    height: isCompact ? 32 : 25,
                    width: isCompact ? 36 : undefined,
                    padding: isCompact ? 0 : '0 6px',
                    borderRadius: TOKENS.radius.sm,
                    border: `1px solid ${tool === t.id ? T.accent : T.border}`,
                    background: tool === t.id ? `${T.accent}18` : T.bg,
                    color: tool === t.id ? T.accent : T.muted,
                    cursor: 'pointer',
                    fontSize: isCompact ? 14 : 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: isCompact ? 0 : 3,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <span>{t.i}</span>
                  {!isCompact && <span style={{ fontSize: 8 }}>{t.l}</span>}
                </button>
              ))}
            </div>
          ))}

          {!isCompact && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: tool === 'eraser' ? '#eee' : color, border: `1px solid ${T.border}` }} />
              <span style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace' }}>
                {formatDimension(tool === 'eraser' ? eraserMm : sizeMm, unitSys)} · {tool}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={cycleDock}
            title={`Ancrage : ${layout.dock} (clic pour changer)`}
            style={{ marginLeft: isVertical ? 0 : 4, marginTop: isVertical ? 4 : 0, padding: '3px 6px', borderRadius: TOKENS.radius.sm, border: `1px solid ${T.border}`, background: `${T.accent}12`, color: T.accent, cursor: 'pointer', fontSize: 10, flexShrink: 0 }}
          >
            {DOCK_LABELS[layout.dock] || '⧉'}
          </button>
        </div>
      </div>
    </>
  )
}
