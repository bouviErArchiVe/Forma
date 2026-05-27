import { useEffect, useRef, useState, useCallback } from 'react'
import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

const TOP_BAR = 46
const BOTTOM_BAR = 32
const SNAP = 48

function loadLayout(id, defaultSide = 'right') {
  try {
    const raw = JSON.parse(localStorage.getItem(`forma_panel_${id}`) || 'null')
    if (raw) return raw
  } catch { /* ignore */ }
  return { mode: defaultSide, x: 16, y: TOP_BAR + 8, w: 260 }
}

function saveLayout(id, layout) {
  try {
    localStorage.setItem(`forma_panel_${id}`, JSON.stringify(layout))
  } catch { /* ignore */ }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function dockStyle(mode, width, panelHeight) {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const h = vh - TOP_BAR - BOTTOM_BAR
  switch (mode) {
    case 'left':
      return { position: 'fixed', left: 0, top: TOP_BAR, width, height: h, zIndex: TOKENS.zIndex.float }
    case 'top':
      return { position: 'fixed', left: 0, top: TOP_BAR, right: 0, height: Math.min(280, h * 0.45), zIndex: TOKENS.zIndex.float }
    case 'bottom':
      return { position: 'fixed', left: 0, bottom: BOTTOM_BAR, right: 0, height: Math.min(280, h * 0.45), zIndex: TOKENS.zIndex.float }
    case 'right':
      return { position: 'fixed', right: 0, top: TOP_BAR, width, height: h, zIndex: TOKENS.zIndex.float }
    default:
      return {
        position: 'fixed',
        width,
        height: panelHeight || Math.min(h * 0.7, h - 16),
        zIndex: TOKENS.zIndex.float + 1,
      }
  }
}

export default function DraggablePanel({
  T,
  id,
  title,
  open,
  onClose,
  width = 260,
  height,
  defaultSide = 'right',
  children,
  headerExtra,
}) {
  const [layout, setLayout] = useState(() => loadLayout(id, defaultSide))
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)

  useEffect(() => {
    if (open) saveLayout(id, layout)
  }, [id, layout, open])

  const startDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.closest('[data-forma-panel]')?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top }
    setLayout((l) => ({ ...l, mode: 'float', x: rect.left, y: rect.top }))
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = layout.w || width
      setLayout((cur) => ({
        ...cur,
        mode: 'float',
        x: clamp(e.clientX - dragRef.current.ox, 4, vw - w - 4),
        y: clamp(e.clientY - dragRef.current.oy, TOP_BAR, vh - BOTTOM_BAR - 120),
      }))
    }
    const onUp = (e) => {
      setDragging(false)
      dragRef.current = null
      const vw = window.innerWidth
      const vh = window.innerHeight
      let mode = 'float'
      if (e.clientX < SNAP) mode = 'left'
      else if (e.clientX > vw - SNAP) mode = 'right'
      else if (e.clientY < TOP_BAR + SNAP) mode = 'top'
      else if (e.clientY > vh - BOTTOM_BAR - SNAP) mode = 'bottom'
      setLayout((cur) => ({ ...cur, mode, w: width }))
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, width, layout.w])

  if (!open) return null

  const isFloat = layout.mode === 'float'
  const shell = dockStyle(layout.mode, layout.w || width, height)
  if (isFloat) {
    shell.left = layout.x ?? 16
    shell.top = layout.y ?? TOP_BAR + 8
  }

  const dockBtn = (mode, label) => (
    <button
      key={mode}
      type="button"
      title={`Ancrer ${label}`}
      onClick={() => setLayout((l) => ({ ...l, mode, w: width }))}
      style={{
        background: layout.mode === mode ? `${T.accent}22` : 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: layout.mode === mode ? T.accent : T.muted,
        fontSize: 10,
        padding: '2px 4px',
        borderRadius: 4,
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      data-forma-panel
      className="forma-animate-in"
      style={{
        ...shell,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
        boxShadow: TOKENS.shadow.panel,
        ...glassStyle(T, { variant: 'panel', blur: TOKENS.blur.lg, opacity: 0.96 }),
      }}
    >
      <div
        onPointerDown={startDrag}
        style={{
          cursor: dragging ? 'grabbing' : 'grab',
          padding: '8px 10px',
          borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          touchAction: 'none',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: T.muted }}>⠿</span>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11, color: T.accent, flex: 1 }}>
          {title}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {dockBtn('left', '◧')}
          {dockBtn('right', '◨')}
          {dockBtn('float', '⧉')}
        </div>
        {headerExtra}
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</div>
    </div>
  )
}
