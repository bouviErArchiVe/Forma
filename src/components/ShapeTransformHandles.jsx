import { useRef } from 'react'
import { TOKENS } from '@/theme/tokens'

function pageToScreen(px, py, canvasEl, pageW, pageH) {
  if (!canvasEl) return { x: 0, y: 0 }
  const r = canvasEl.getBoundingClientRect()
  return {
    x: r.left + (px / pageW) * r.width,
    y: r.top + (py / pageH) * r.height,
  }
}

const HANDLE = 10

export default function ShapeTransformHandles({
  T,
  bounds,
  rotation = 0,
  canvasEl,
  pageW,
  pageH,
  onResize,
  onRotate,
}) {
  const dragRef = useRef(null)

  if (!bounds || !canvasEl) return null

  const tl = pageToScreen(bounds.x1, bounds.y1, canvasEl, pageW, pageH)
  const br = pageToScreen(bounds.x2, bounds.y2, canvasEl, pageW, pageH)
  const rotPt = pageToScreen(bounds.cx, bounds.y1 - 24, canvasEl, pageW, pageH)

  const w = br.x - tl.x
  const h = br.y - tl.y

  const startDrag = (mode, e) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...bounds },
      origRot: rotation || 0,
    }
    const move = (ev) => {
      const d = dragRef.current
      if (!d) return
      if (d.mode === 'rotate') {
        const c = pageToScreen(d.orig.cx, d.orig.cy, canvasEl, pageW, pageH)
        const a0 = Math.atan2(d.startY - c.y, d.startX - c.x)
        const a1 = Math.atan2(ev.clientY - c.y, ev.clientX - c.x)
        const deg = d.origRot + ((a1 - a0) * 180) / Math.PI
        onRotate?.(Math.round(deg))
        return
      }
      const dx = ((ev.clientX - d.startX) / w) * d.orig.w
      const dy = ((ev.clientY - d.startY) / h) * d.orig.h
      let { x1, y1, x2, y2 } = d.orig
      if (d.mode.includes('e')) x2 = d.orig.x2 + dx
      if (d.mode.includes('s')) y2 = d.orig.y2 + dy
      if (d.mode.includes('w')) x1 = d.orig.x1 + dx
      if (d.mode.includes('n')) y1 = d.orig.y1 + dy
      if (Math.abs(x2 - x1) < 8 || Math.abs(y2 - y1) < 8) return
      onResize?.(
        Math.min(x1, x2),
        Math.min(y1, y2),
        Math.max(x1, x2),
        Math.max(y1, y2),
      )
    }
    const up = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const handles = [
    { id: 'nw', left: tl.x - HANDLE / 2, top: tl.y - HANDLE / 2 },
    { id: 'ne', left: br.x - HANDLE / 2, top: tl.y - HANDLE / 2 },
    { id: 'sw', left: tl.x - HANDLE / 2, top: br.y - HANDLE / 2 },
    { id: 'se', left: br.x - HANDLE / 2, top: br.y - HANDLE / 2 },
  ]

  const handleStyle = {
    position: 'fixed',
    width: HANDLE,
    height: HANDLE,
    borderRadius: 3,
    background: '#fff',
    border: `2px solid ${T.accent}`,
    boxShadow: '0 1px 4px rgba(0,0,0,.25)',
    cursor: 'nwse-resize',
    zIndex: TOKENS.zIndex.float + 5,
    touchAction: 'none',
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          left: tl.x,
          top: tl.y,
          width: w,
          height: h,
          border: `1.5px dashed ${T.accent}`,
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: TOKENS.zIndex.float + 4,
        }}
      />
      {handles.map((h) => (
        <div
          key={h.id}
          role="presentation"
          style={{ ...handleStyle, left: h.left, top: h.top, cursor: `${h.id}-resize` }}
          onPointerDown={(e) => startDrag(h.id, e)}
        />
      ))}
      <div
        role="presentation"
        title="Rotation"
        style={{
          ...handleStyle,
          left: rotPt.x - HANDLE / 2,
          top: rotPt.y - HANDLE / 2,
          borderRadius: '50%',
          cursor: 'grab',
          background: T.accent,
        }}
        onPointerDown={(e) => startDrag('rotate', e)}
      />
    </>
  )
}
