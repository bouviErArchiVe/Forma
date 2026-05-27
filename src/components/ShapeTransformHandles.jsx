import { useRef } from 'react'
import { TOKENS } from '@/theme/tokens'
import { snapRotation } from '@/lib/placedElements'

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
  showSideHandles = true,
}) {
  const dragRef = useRef(null)

  if (!bounds || !canvasEl) return null

  const tl = pageToScreen(bounds.x1, bounds.y1, canvasEl, pageW, pageH)
  const br = pageToScreen(bounds.x2, bounds.y2, canvasEl, pageW, pageH)
  const center = pageToScreen(bounds.cx, bounds.cy, canvasEl, pageW, pageH)

  const w = br.x - tl.x
  const h = br.y - tl.y
  const rot = rotation || 0

  const startDrag = (mode, e) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...bounds },
      origRot: rot,
    }
    const move = (ev) => {
      const d = dragRef.current
      if (!d) return

      if (d.mode === 'rotate') {
        const c = pageToScreen(d.orig.cx, d.orig.cy, canvasEl, pageW, pageH)
        const a0 = Math.atan2(d.startY - c.y, d.startX - c.x)
        const a1 = Math.atan2(ev.clientY - c.y, ev.clientX - c.x)
        const deg = d.origRot + ((a1 - a0) * 180) / Math.PI
        onRotate?.(snapRotation(deg, ev.shiftKey))
        return
      }

      let dx = ((ev.clientX - d.startX) / w) * d.orig.w
      let dy = ((ev.clientY - d.startY) / h) * d.orig.h

      if (rot) {
        const rad = (-rot * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const ldx = dx * cos - dy * sin
        const ldy = dx * sin + dy * cos
        dx = ldx
        dy = ldy
      }

      let { x1, y1, x2, y2 } = d.orig
      if (d.mode.includes('e')) x2 = d.orig.x2 + dx
      if (d.mode.includes('s')) y2 = d.orig.y2 + dy
      if (d.mode.includes('w')) x1 = d.orig.x1 + dx
      if (d.mode.includes('n')) y1 = d.orig.y1 + dy

      if (ev.shiftKey) {
        const rw = Math.abs(x2 - x1)
        const rh = Math.abs(y2 - y1)
        const ratio = d.orig.w / Math.max(d.orig.h, 0.001)
        if (rw / Math.max(rh, 0.001) > ratio) {
          const signX = x2 >= x1 ? 1 : -1
          const signY = y2 >= y1 ? 1 : -1
          x2 = x1 + signX * rh * ratio
        } else {
          const signX = x2 >= x1 ? 1 : -1
          const signY = y2 >= y1 ? 1 : -1
          y2 = y1 + signY * (rw / ratio)
        }
      }

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

  const cornerHandles = [
    { id: 'nw', left: '0%', top: '0%', cursor: 'nwse-resize' },
    { id: 'ne', left: '100%', top: '0%', cursor: 'nesw-resize' },
    { id: 'sw', left: '0%', top: '100%', cursor: 'nesw-resize' },
    { id: 'se', left: '100%', top: '100%', cursor: 'nwse-resize' },
  ]

  const sideHandles = showSideHandles
    ? [
        { id: 'n', left: '50%', top: '0%', cursor: 'ns-resize' },
        { id: 'e', left: '100%', top: '50%', cursor: 'ew-resize' },
        { id: 's', left: '50%', top: '100%', cursor: 'ns-resize' },
        { id: 'w', left: '0%', top: '50%', cursor: 'ew-resize' },
      ]
    : []

  const handleStyle = {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    marginLeft: -HANDLE / 2,
    marginTop: -HANDLE / 2,
    borderRadius: 3,
    background: '#fff',
    border: `2px solid ${T.accent}`,
    boxShadow: '0 1px 4px rgba(0,0,0,.25)',
    touchAction: 'none',
    pointerEvents: 'auto',
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: center.x,
        top: center.y,
        width: w,
        height: h,
        transform: `translate(-50%, -50%) rotate(${rot}deg)`,
        transformOrigin: 'center center',
        pointerEvents: 'none',
        zIndex: TOKENS.zIndex.float + 4,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: `1.5px dashed ${T.accent}`,
          borderRadius: 4,
          pointerEvents: 'none',
        }}
      />
      {[...cornerHandles, ...sideHandles].map((h) => (
        <div
          key={h.id}
          role="presentation"
          style={{
            ...handleStyle,
            left: h.left,
            top: h.top,
            cursor: h.cursor,
          }}
          onPointerDown={(e) => startDrag(h.id, e)}
        />
      ))}
      <div
        role="presentation"
        title="Rotation (Shift = snap 45°)"
        style={{
          ...handleStyle,
          left: '50%',
          top: -28,
          borderRadius: '50%',
          cursor: 'grab',
          background: T.accent,
        }}
        onPointerDown={(e) => startDrag('rotate', e)}
      />
    </div>
  )
}
