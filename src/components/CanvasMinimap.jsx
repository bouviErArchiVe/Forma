import { useRef, useEffect, useCallback, useMemo } from 'react'
import GlassPanel from '@/components/ui/GlassPanel'
import { TOKENS } from '@/theme/tokens'
import {
  getViewportInPage,
  panForPagePoint,
  minimapLayout,
  pagePointFromMinimap,
} from '@/lib/minimap'

import { getPlacedSize } from '@/lib/placedElements'

export default function CanvasMinimap({
  T,
  pageW,
  pageH,
  viewW,
  viewH,
  zoom,
  panX,
  panY,
  onPanChange,
  getStrokes,
  placed = [],
  importedImages = [],
  revision = 0,
  paperColor,
}) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const layout = useMemo(() => minimapLayout(pageW, pageH), [pageW, pageH])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { w, h, scaleX, scaleY } = layout
    canvas.width = w
    canvas.height = h
    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = paperColor || T.paper || '#fff'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = T.border || '#ccc'
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1)

    const strokes = getStrokes?.() || []
    strokes.forEach((s) => {
      if (!s?.pts?.length || s.pts.length < 2 || s.tool === 'eraser') return
      ctx.beginPath()
      ctx.strokeStyle = s.color || '#333'
      ctx.lineWidth = Math.max(0.4, (s.size || 2) * scaleX * 0.25)
      ctx.globalAlpha = 0.85
      ctx.moveTo(s.pts[0].x * scaleX, s.pts[0].y * scaleY)
      for (let i = 1; i < s.pts.length; i++) {
        ctx.lineTo(s.pts[i].x * scaleX, s.pts[i].y * scaleY)
      }
      ctx.stroke()
    })
    ctx.globalAlpha = 1

    importedImages.forEach((img) => {
      ctx.fillStyle = 'rgba(33,150,243,.35)'
      ctx.fillRect(img.x * scaleX, img.y * scaleY, img.w * scaleX, img.h * scaleY)
    })

    placed.forEach((item) => {
      const { w: ew, h: eh } = getPlacedSize(item)
      ctx.fillStyle = `${T.accent || '#c8622a'}55`
      ctx.strokeStyle = T.accent || '#c8622a'
      ctx.lineWidth = 0.75
      ctx.fillRect(item.x * scaleX, item.y * scaleY, ew * scaleX, eh * scaleY)
      ctx.strokeRect(item.x * scaleX + 0.5, item.y * scaleY + 0.5, ew * scaleX - 1, eh * scaleY - 1)
    })

    if (viewW && viewH) {
      const vp = getViewportInPage({ pageW, pageH, viewW, viewH, zoom, panX, panY })
      const rx = vp.x1 * scaleX
      const ry = vp.y1 * scaleY
      const rw = vp.w * scaleX
      const rh = vp.h * scaleY
      ctx.fillStyle = `${T.accent || '#c8622a'}22`
      ctx.fillRect(rx, ry, rw, rh)
      ctx.strokeStyle = T.accent || '#c8622a'
      ctx.lineWidth = 1.5
      ctx.strokeRect(rx + 0.75, ry + 0.75, Math.max(2, rw - 1.5), Math.max(2, rh - 1.5))
    }
  }, [T, pageW, pageH, viewW, viewH, zoom, panX, panY, getStrokes, placed, importedImages, revision, paperColor, layout])

  useEffect(() => {
    draw()
  }, [draw])

  const navigateFromLocal = useCallback(
    (localX, localY) => {
      const { scaleX, scaleY } = layout
      const pt = pagePointFromMinimap(localX, localY, scaleX, scaleY)
      const next = panForPagePoint({ pageX: pt.x, pageY: pt.y, pageW, pageH, zoom })
      onPanChange?.(next.panX, next.panY)
    },
    [layout, pageW, pageH, zoom, onPanChange]
  )

  const onPointerDown = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const lx = e.clientX - rect.left
    const ly = e.clientY - rect.top
    dragRef.current = { active: true }
    navigateFromLocal(lx, ly)
  }

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current?.active) return
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      navigateFromLocal(e.clientX - rect.left, e.clientY - rect.top)
    }
    const onUp = () => {
      if (dragRef.current) dragRef.current.active = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [navigateFromLocal])

  return (
    <GlassPanel
      T={T}
      variant="float"
      animate
      style={{
        position: 'absolute',
        right: TOKENS.spacing.md,
        bottom: TOKENS.spacing.md,
        zIndex: 35,
        padding: TOKENS.spacing.sm,
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ fontSize: 8, fontWeight: 700, color: T.muted, marginBottom: 4, letterSpacing: 0.4 }}>
        NAVIGATION
      </div>
      <canvas
        ref={canvasRef}
        width={layout.w}
        height={layout.h}
        style={{
          display: 'block',
          width: layout.w,
          height: layout.h,
          borderRadius: TOKENS.radius.sm,
          cursor: 'crosshair',
        }}
        onMouseDown={onPointerDown}
      />
    </GlassPanel>
  )
}
