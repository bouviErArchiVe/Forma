import { useEffect, useRef, useState, useCallback } from 'react'
import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

const TOP_BAR = 46
const BOTTOM_BAR = 32
const SNAP = 28
const MIN_FLOAT_W = 180

function loadLayout(id, defaultSide = 'right', width = 260) {
  try {
    const raw = JSON.parse(localStorage.getItem(`forma_panel_${id}`) || 'null')
    if (raw) return { w: width, ...raw }
  } catch { /* ignore */ }
  return { mode: defaultSide, x: 16, y: TOP_BAR + 8, w: width }
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
        height: panelHeight || Math.min(h * 0.72, h - 24),
        zIndex: TOKENS.zIndex.float + 1,
      }
  }
}

function detectDock(clientX, clientY) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (clientX < SNAP) return 'left'
  if (clientX > vw - SNAP) return 'right'
  if (clientY < TOP_BAR + SNAP) return 'top'
  if (clientY > vh - BOTTOM_BAR - SNAP) return 'bottom'
  return 'float'
}

/** Panneau dockable / flottant réutilisable (SketchUp-like). */
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
  collapsed,
  onExpand,
  collapsedPreview,
  resizable = true,
  zIndexOffset = 0,
  dockOnRelease = false,
}) {
  const [layout, setLayout] = useState(() => loadLayout(id, defaultSide, width))
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef(null)
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  const persistLayout = useCallback((next, { save = true } = {}) => {
    setLayout(next)
    layoutRef.current = next
    if (save) saveLayout(id, next)
  }, [id])

  const startDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const panel = e.currentTarget.closest('[data-forma-panel]')
    const rect = panel?.getBoundingClientRect()
    if (!rect) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top }
    if (layoutRef.current.mode !== 'float') {
      persistLayout({ ...layoutRef.current, mode: 'float', x: rect.left, y: rect.top })
    }
    setDragging(true)
  }, [persistLayout])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const w = layoutRef.current.w || width
      const h = layoutRef.current.h || height || 320
      persistLayout({
        ...layoutRef.current,
        mode: 'float',
        x: clamp(e.clientX - dragRef.current.ox, 4, vw - w - 4),
        y: clamp(e.clientY - dragRef.current.oy, TOP_BAR + 2, vh - BOTTOM_BAR - Math.min(h, 80) - 4),
      }, { save: false })
    }
    const onUp = (e) => {
      setDragging(false)
      dragRef.current = null
      const cur = layoutRef.current
      if (dockOnRelease) {
        const dock = detectDock(e.clientX, e.clientY)
        if (dock === 'float') persistLayout({ ...cur, mode: 'float' })
        else persistLayout({ ...cur, mode: dock, w: width })
      } else {
        persistLayout({ ...cur, mode: 'float' })
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [dragging, width, height, persistLayout, dockOnRelease])

  const startResize = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const startW = layoutRef.current.w || width
    const startX = e.clientX
    const onMove = (ev) => {
      const vw = window.innerWidth
      const nextW = clamp(startW + (ev.clientX - startX), MIN_FLOAT_W, vw - 40)
      persistLayout({ ...layoutRef.current, w: nextW, mode: layoutRef.current.mode === 'float' ? 'float' : layoutRef.current.mode })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [width, persistLayout])

  if (!open) return null

  if (collapsed) {
    return (
      <div
        data-forma-panel
        style={{
          position: 'fixed',
          left: layout.x ?? 16,
          top: layout.y ?? TOP_BAR + 8,
          zIndex: TOKENS.zIndex.float + zIndexOffset,
          touchAction: 'none',
        }}
        onPointerDown={startDrag}
      >
        <div onClick={(e) => { e.stopPropagation(); onExpand?.() }} style={{ cursor: 'pointer' }}>
          {collapsedPreview}
        </div>
      </div>
    )
  }

  const isFloat = layout.mode === 'float'
  const panelW = layout.w || width
  const shell = dockStyle(layout.mode, panelW, height)
  shell.zIndex = (shell.zIndex || TOKENS.zIndex.float) + zIndexOffset
  if (isFloat) {
    shell.left = layout.x ?? 16
    shell.top = layout.y ?? TOP_BAR + 8
    if (layout.h) shell.height = layout.h
  }

  const dockBtn = (mode, label) => (
    <button
      key={mode}
      type="button"
      title={`Ancrer ${label}`}
      onClick={() => persistLayout({ ...layout, mode, w: panelW })}
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
          {dockBtn('top', '▔')}
          {dockBtn('bottom', '▁')}
          {dockBtn('float', '⧉')}
        </div>
        {headerExtra}
        {onClose && (
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
        )}
      </div>
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</div>
      {resizable && isFloat && (
        <div
          onPointerDown={startResize}
          title="Redimensionner"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'ew-resize',
            touchAction: 'none',
          }}
        />
      )}
    </div>
  )
}
