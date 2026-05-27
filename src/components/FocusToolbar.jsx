import { useState, useEffect, useRef, useCallback } from 'react'
import { glassStyle } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

const FOCUS_TOOLS = [
  { id: 'arrow', l: 'Flèche', i: '↖' },
  { id: 'pen', l: 'Crayon', i: '✏' },
  { id: 'highlight', l: 'Surlig.', i: '▌' },
  { id: 'eraser', l: 'Gomme', i: '◻' },
  { id: 'line', l: 'Ligne', i: '/' },
  { id: 'rect', l: 'Rect.', i: '□' },
  { id: 'lasso', l: 'Lasso', i: '⬡' },
  { id: 'text', l: 'Texte', i: 'T' },
]

const QUICK_COLORS = ['#1c1c24', '#c8622a', '#2196f3', '#e94560', '#4a7c59', '#ffff00', '#000', '#fff']
const QUICK_SIZES = [0.18, 0.5, 1.0, 2.0]

export default function FocusToolbar({
  T,
  title,
  page,
  pagesCount,
  tool,
  setTool,
  color,
  setColor,
  sizeMm,
  setSizeMm,
  eraserMm,
  unitSys,
  formatDimension,
  zoom,
  zoomBy,
  viewW = 0,
  viewH = 0,
  saveStatus,
  timerSec,
  timerRunning,
  timerMode,
  onUndo,
  onExit,
}) {
  const [visible, setVisible] = useState(true)
  const [showColors, setShowColors] = useState(false)
  const idleRef = useRef(null)
  const isEraser = tool === 'eraser'

  const bump = useCallback(() => {
    setVisible(true)
    clearTimeout(idleRef.current)
    idleRef.current = setTimeout(() => setVisible(false), 3200)
  }, [])

  useEffect(() => {
    bump()
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel']
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }))
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump))
      clearTimeout(idleRef.current)
    }
  }, [bump])

  const fmtTimer = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <>
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 12,
          background:
            'radial-gradient(ellipse 85% 78% at 50% 48%, transparent 42%, rgba(0,0,0,.28) 100%)',
          transition: 'opacity .4s ease',
          opacity: visible ? 0.85 : 0.55,
        }}
      />

      <div
        className="forma-animate-in"
        style={{
          position: 'fixed',
          top: 14,
          left: '50%',
          transform: `translateX(-50%) translateY(${visible ? 0 : -72}px)`,
          zIndex: TOKENS.zIndex.modal,
          opacity: visible ? 1 : 0,
          transition: 'transform .35s cubic-bezier(.34,1.2,.64,1), opacity .28s ease',
          pointerEvents: visible ? 'auto' : 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 14px',
          ...glassStyle(T, { variant: 'float', blur: TOKENS.blur.lg }),
        }}
      >
        <span
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 700,
            fontSize: 11,
            color: T.ink,
            maxWidth: 220,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        <div className="forma-glass-divider" style={{ height: 14, alignSelf: 'center' }} />
        <span style={{ fontSize: 9, color: T.muted, fontFamily: 'monospace' }}>
          p.{page}/{pagesCount || 1}
        </span>
        {saveStatus === 'saving' && <span style={{ fontSize: 9, color: '#f5a623' }}>⏳</span>}
        {saveStatus === 'saved' && <span style={{ fontSize: 9, color: '#4ade80' }}>✓</span>}
        {timerRunning && (
          <>
            <div className="forma-glass-divider" style={{ height: 14, alignSelf: 'center' }} />
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                fontFamily: 'monospace',
                color: timerMode === 'work' ? T.accent : '#4ade80',
              }}
            >
              ⏱ {fmtTimer(timerSec)}
            </span>
          </>
        )}
      </div>

      <div
        className="forma-animate-in"
        style={{
          position: 'fixed',
          bottom: 18,
          left: '50%',
          transform: `translateX(-50%) translateY(${visible ? 0 : 88}px)`,
          zIndex: TOKENS.zIndex.modal,
          opacity: visible ? 1 : 0,
          transition: 'transform .35s cubic-bezier(.34,1.2,.64,1), opacity .28s ease',
          pointerEvents: visible ? 'auto' : 'none',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
          maxWidth: 'min(96vw, 720px)',
          padding: '8px 12px',
          ...glassStyle(T, { variant: 'float', blur: TOKENS.blur.lg }),
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {FOCUS_TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.l}
            className="forma-tool-btn"
            onClick={() => setTool(t.id)}
            style={{
              padding: '6px 9px',
              borderRadius: TOKENS.radius.sm,
              border: `1px solid ${tool === t.id ? T.accent : 'transparent'}`,
              background: tool === t.id ? `${T.accent}22` : 'transparent',
              color: tool === t.id ? T.accent : T.muted,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            {t.i}
          </button>
        ))}

        <div className="forma-glass-divider" style={{ height: 22 }} />

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Couleur"
            onClick={() => setShowColors((v) => !v)}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: isEraser ? '#eee' : color,
              border: `2px solid ${showColors ? T.accent : 'rgba(255,255,255,.35)'}`,
              cursor: 'pointer',
              boxShadow: `0 0 0 1px ${T.border}`,
            }}
          />
          {showColors && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 4,
                padding: 6,
                borderRadius: TOKENS.radius.md,
                ...glassStyle(T, { variant: 'panel' }),
              }}
            >
              {QUICK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c)
                    setShowColors(false)
                  }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: c,
                    border: `2px solid ${c === color ? T.accent : 'transparent'}`,
                    cursor: 'pointer',
                    outline: c === '#fff' ? `1px solid ${T.border}` : 'none',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 2 }}>
          {QUICK_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              title={`${s} mm`}
              onClick={() => setSizeMm(s)}
              style={{
                padding: '3px 5px',
                borderRadius: 5,
                border: `1px solid ${sizeMm === s && !isEraser ? T.accent : T.border}`,
                background: sizeMm === s && !isEraser ? `${T.accent}18` : 'transparent',
                color: sizeMm === s && !isEraser ? T.accent : T.muted,
                cursor: 'pointer',
                fontSize: 8,
                fontFamily: 'monospace',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <span
          style={{
            fontSize: 8,
            color: T.muted,
            fontFamily: 'monospace',
            minWidth: 36,
            textAlign: 'center',
          }}
        >
          {formatDimension(isEraser ? eraserMm : sizeMm, unitSys)}
        </span>

        <div className="forma-glass-divider" style={{ height: 22 }} />

        <button type="button" onClick={() => zoomBy(1 / 1.1, { x: viewW / 2, y: viewH / 2 })} style={iconBtn(T)} title="Zoom −">
          −
        </button>
        <span style={{ fontSize: 9, color: T.muted, minWidth: 32, textAlign: 'center', fontFamily: 'monospace' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" onClick={() => zoomBy(1.1, { x: viewW / 2, y: viewH / 2 })} style={iconBtn(T)} title="Zoom +">
          +
        </button>

        <div className="forma-glass-divider" style={{ height: 22 }} />

        <button type="button" onClick={onUndo} style={iconBtn(T)} title="Annuler">
          ↩
        </button>

        <button
          type="button"
          onClick={onExit}
          title="Quitter focus (Échap ou F)"
          style={{
            padding: '5px 10px',
            borderRadius: TOKENS.radius.sm,
            background: 'rgba(168,85,247,.18)',
            border: '1px solid #a855f7',
            color: '#a855f7',
            cursor: 'pointer',
            fontSize: 9,
            fontWeight: 700,
            marginLeft: 2,
          }}
        >
          ⛶ Exit
        </button>
      </div>
    </>
  )
}

function iconBtn(T) {
  return {
    padding: '5px 8px',
    borderRadius: TOKENS.radius.sm,
    background: 'transparent',
    border: `1px solid ${T.border}55`,
    color: T.muted,
    cursor: 'pointer',
    fontSize: 12,
  }
}
