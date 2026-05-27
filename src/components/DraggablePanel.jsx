import { useEffect, useRef, useState, useCallback } from 'react'
import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'
import {
  subscribePanelDock,
  syncPanelDock,
  clearPanelDock,
  getPanelStackIndex,
  getPanelStackCount,
} from '@/lib/panelDockStack'

const TOP_BAR = 46
const BOTTOM_BAR = 32
const SNAP = 28
const MIN_FLOAT_W = 180

function defaultFloatPos(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return {
    x: 16 + (Math.abs(hash) % 140),
    y: TOP_BAR + 8 + (Math.abs(hash >> 4) % 100),
  }
}

function loadLayout(id, defaultSide = 'right', width = 260) {
  try {
    const raw = JSON.parse(localStorage.getItem(`forma_panel_${id}`) || 'null')
    if (raw) return { w: width, ...raw }
  } catch { /* ignore */ }
  const { x, y } = defaultFloatPos(id)
  return { mode: defaultSide, x, y, w: width }
}

function saveLayout(id, layout) {
  try {
    localStorage.setItem(`forma_panel_${id}`, JSON.stringify(layout))
  } catch { /* ignore */ }
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function dockStyle(mode, width, panelHeight, dockSizes, stackIdx = 0, stackCount = 1) {
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const h = vh - TOP_BAR - BOTTOM_BAR
  const topH = dockSizes?.top ?? Math.min(280, h * 0.45)
  const bottomH = dockSizes?.bottom ?? Math.min(280, h * 0.45)
  const sideW = dockSizes?.left ?? width
  const segH = h / stackCount
  const segW = vw / stackCount
  switch (mode) {
    case 'left':
      return {
        position: 'fixed',
        left: 0,
        top: TOP_BAR + stackIdx * segH,
        width: sideW,
        height: Math.max(segH - 2, 120),
        zIndex: TOKENS.zIndex.float,
      }
    case 'top':
      return {
        position: 'fixed',
        left: stackIdx * segW,
        top: TOP_BAR,
        width: Math.max(segW - 1, 160),
        height: topH,
        zIndex: TOKENS.zIndex.float,
      }
    case 'bottom':
      return {
        position: 'fixed',
        left: stackIdx * segW,
        bottom: BOTTOM_BAR,
        width: Math.max(segW - 1, 160),
        height: bottomH,
        zIndex: TOKENS.zIndex.float,
      }
    case 'right':
      return {
        position: 'fixed',
        right: 0,
        top: TOP_BAR + stackIdx * segH,
        width: dockSizes?.right ?? width,
        height: Math.max(segH - 2, 120),
        zIndex: TOKENS.zIndex.float,
      }
    default:
      return {
        position: 'fixed',
        width,
        height: panelHeight || Math.min(h * 0.72, h - 24),
        zIndex: TOKENS.zIndex.float + 1,
      }
  }
}

function collapsedBubbleStyle(mode, stackIdx, zIndexOffset, layout) {
  const base = {
    position: 'fixed',
    zIndex: TOKENS.zIndex.float + zIndexOffset + 2,
    touchAction: 'none',
  }
  const bubbleGap = 44
  switch (mode) {
    case 'left':
      return { ...base, left: 6, top: TOP_BAR + 8 + stackIdx * bubbleGap }
    case 'right': {
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
      return { ...base, left: vw - 42, top: TOP_BAR + 8 + stackIdx * bubbleGap }
    }
    case 'top':
      return { ...base, left: 8 + stackIdx * bubbleGap, top: TOP_BAR + 4 }
    case 'bottom': {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800
      return { ...base, left: 8 + stackIdx * bubbleGap, top: vh - BOTTOM_BAR - 42 }
    }
    default:
      return {
        ...base,
        left: layout.x ?? 16,
        top: layout.y ?? TOP_BAR + 8,
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
  dockOnRelease = true,
  variant = 'panel',
  dockSizes,
  onLayoutChange,
  hideClose = false,
}) {
  const [layout, setLayout] = useState(() => loadLayout(id, defaultSide, width))
  const [dragging, setDragging] = useState(false)
  const [dragZ, setDragZ] = useState(0)
  const [, setStackTick] = useState(0)
  const dragRef = useRef(null)
  const layoutRef = useRef(layout)
  layoutRef.current = layout

  useEffect(() => {
    syncPanelDock(id, layout.mode, open)
    return () => clearPanelDock(id)
  }, [id, layout.mode, open])

  useEffect(() => subscribePanelDock(() => setStackTick((t) => t + 1)), [])

  const stackIdx = getPanelStackIndex(id, layout.mode)
  const stackCount = getPanelStackCount(layout.mode)

  const persistLayout = useCallback((next, { save = true } = {}) => {
    setLayout(next)
    layoutRef.current = next
    if (save) {
      saveLayout(id, next)
      onLayoutChange?.(next)
    }
  }, [id, onLayoutChange])

  const startDrag = useCallback((e) => {
    if (e.target.closest('button, input, select, textarea, a, [data-no-drag]')) return
    e.preventDefault()
    e.stopPropagation()
    const panel = e.currentTarget.closest('[data-forma-panel]')
    const rect = panel?.getBoundingClientRect()
    if (!rect) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragRef.current = { ox: e.clientX - rect.left, oy: e.clientY - rect.top }
    setDragZ(Date.now())
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

  useEffect(() => {
    onLayoutChange?.(layoutRef.current)
  }, [onLayoutChange])

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
    const bubblePos = collapsedBubbleStyle(
      layout.mode === 'float' ? 'float' : layout.mode,
      stackIdx,
      zIndexOffset,
      layout,
    )
    return (
      <div
        data-forma-panel
        style={bubblePos}
        onPointerDown={startDrag}
      >
        <div onClick={(e) => { e.stopPropagation(); onExpand?.() }} style={{ cursor: 'pointer' }}>
          {collapsedPreview}
        </div>
      </div>
    )
  }

  const isFloat = layout.mode === 'float'
  const isToolbar = variant === 'toolbar'
  const isVertical = layout.mode === 'left' || layout.mode === 'right'
  const panelW = layout.w || width
  const shell = dockStyle(layout.mode, panelW, height, dockSizes, stackIdx, stackCount)
  shell.zIndex = (shell.zIndex || (isToolbar ? TOKENS.zIndex.toolbar : TOKENS.zIndex.float)) + zIndexOffset + (dragging ? dragZ % 1000 : 0)
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
      onClick={() => {
        const dockW = mode === 'left'
          ? (dockSizes?.left ?? width)
          : mode === 'right'
            ? (dockSizes?.right ?? width)
            : panelW
        persistLayout({ ...layout, mode, w: dockW })
      }}
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

  const panelMode = layout.mode === 'float' ? 'float' : layout.mode

  return (
    <div
      data-forma-panel
      className={`forma-panel-enter forma-panel-enter--${panelMode}`}
      style={{
        ...shell,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: isToolbar && !isFloat ? 'none' : `1px solid ${rgbaFromHex(T.border, 0.45)}`,
        boxShadow: isToolbar && !isFloat ? 'none' : (isToolbar ? TOKENS.shadow.toolbar : TOKENS.shadow.panel),
        borderRadius: isToolbar && !isFloat ? 0 : undefined,
        ...glassStyle(T, { variant: isToolbar ? 'toolbar' : 'panel', blur: isToolbar ? TOKENS.blur.md : TOKENS.blur.lg, opacity: isToolbar ? 0.94 : 0.96 }),
      }}
    >
      <div
        onPointerDown={startDrag}
        style={{
          cursor: dragging ? 'grabbing' : 'grab',
          padding: isToolbar ? (isVertical ? '8px 6px' : '6px 10px') : '8px 10px',
          borderBottom: isToolbar ? 'none' : `1px solid ${rgbaFromHex(T.border, 0.35)}`,
          display: 'flex',
          flexDirection: isToolbar && isVertical ? 'column' : 'row',
          alignItems: 'center',
          gap: isToolbar ? 4 : 6,
          touchAction: 'none',
          userSelect: 'none',
          flexShrink: 0,
          flex: isToolbar ? 1 : undefined,
          minHeight: 0,
          minWidth: 0,
          overflow: isToolbar ? 'auto' : undefined,
        }}
      >
        <span style={{ fontSize: 11, color: T.muted, flexShrink: 0 }}>⠿</span>
        {title ? (
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 11, color: T.accent, flexShrink: 0 }}>
            {title}
          </div>
        ) : null}
        {isToolbar ? (
          <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: isVertical ? 'column' : 'row', alignItems: 'center', gap: 4, overflow: 'auto' }}>
            {children}
          </div>
        ) : null}
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {dockBtn('left', '◧')}
          {dockBtn('right', '◨')}
          {dockBtn('top', '▔')}
          {dockBtn('bottom', '▁')}
          {dockBtn('float', '⧉')}
        </div>
        {headerExtra}
        {onClose && !hideClose && (
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
        )}
      </div>
      {!isToolbar && <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>{children}</div>}
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
