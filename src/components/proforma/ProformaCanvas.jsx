import { useCallback, useEffect, useRef, useState } from 'react'
import { useCanvasViewport } from '@/hooks/useCanvasViewport'
import { PF_ZOOM_MIN, PF_ZOOM_MAX, PF_ZOOM_DEFAULT, PF_DARK } from '@/lib/proforma/constants'
import { renderDocument, drawGrid, drawStroke } from '@/lib/proforma/render'
import { pageToScreen } from '@/lib/viewport'

export default function ProformaCanvas({
  doc,
  editor,
  panToolActive,
  viewportState,
  onViewSize,
}) {
  const viewportRef = useRef(null)
  const canvasRef = useRef(null)
  const docCacheRef = useRef({ key: '', canvas: null })
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 })

  const allowPan = panToolActive || editor.tool === 'hand'

  const viewport = useCanvasViewport({
    viewW: viewSize.w,
    viewH: viewSize.h,
    enabled: true,
    allowPan,
    initialZoom: doc?.zoom ?? PF_ZOOM_DEFAULT,
    minZoom: PF_ZOOM_MIN,
    maxZoom: PF_ZOOM_MAX,
    documentPage: doc ? { w: doc.width, h: doc.height } : null,
  })

  useEffect(() => {
    onViewSize?.(viewSize)
  }, [viewSize, onViewSize])

  useEffect(() => {
    viewportState?.({
      zoom: viewport.zoom,
      panX: viewport.panX,
      panY: viewport.panY,
      zoomBy: viewport.zoomBy,
      resetViewport: viewport.resetViewport,
    })
  }, [viewport.zoom, viewport.panX, viewport.panY, viewport.zoomBy, viewport.resetViewport, viewportState])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => {
      setViewSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return undefined
    const onWheel = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const sx = e.clientX - r.left
      const sy = e.clientY - r.top
      if (e.ctrlKey || e.metaKey || !allowPan) {
        const factor = Math.exp(-e.deltaY * 0.0022)
        viewport.zoomBy(factor, { x: sx, y: sy })
        return
      }
      viewport.setPan(viewport.panX - e.deltaX, viewport.panY - e.deltaY)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [viewport, allowPan])

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !doc) return
    const dpr = window.devicePixelRatio || 1
    const { w, h } = viewSize
    if (!w || !h) return

    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = PF_DARK.bg
    ctx.fillRect(0, 0, w, h)

    ctx.save()
    ctx.translate(w / 2 + viewport.panX, h / 2 + viewport.panY)
    ctx.scale(viewport.zoom, viewport.zoom)
    ctx.rotate(((doc.viewRotation || 0) * Math.PI) / 180)
    ctx.translate(-doc.width / 2, -doc.height / 2)

    const cacheKey = `${doc.updatedAt || 0}-${doc.strokes?.length || 0}-${doc.showGrid}-${doc.width}-${doc.height}-${doc.viewRotation || 0}-${doc.bgColor}`
    let off = docCacheRef.current.key === cacheKey ? docCacheRef.current.canvas : null
    if (!off) {
      off = document.createElement('canvas')
      off.width = doc.width
      off.height = doc.height
      const octx = off.getContext('2d')
      renderDocument(octx, doc)
      if (doc.showGrid) drawGrid(octx, doc)
      docCacheRef.current = { key: cacheKey, canvas: off }
    }
    ctx.drawImage(off, 0, 0)

    const live = editor.getLiveStroke?.()
    if (live?.pts?.length) drawStroke(ctx, live)

    ctx.restore()
  }, [doc, viewSize, viewport, editor])

  useEffect(() => {
    paint()
  }, [paint, doc?.updatedAt, doc?.strokes?.length, viewport.zoom, viewport.panX, viewport.panY])

  useEffect(() => {
    if (!editor.subscribePaint) return undefined
    return editor.subscribePaint(paint)
  }, [editor, paint])

  const eraserActive = editor.tool === 'eraser'
  let eraserScreen = null
  if (eraserActive && editor.cursorPage && viewSize.w) {
    eraserScreen = pageToScreen({
      px: editor.cursorPage.x,
      py: editor.cursorPage.y,
      viewW: viewSize.w,
      viewH: viewSize.h,
      pageW: doc.width,
      pageH: doc.height,
      zoom: viewport.zoom,
      panX: viewport.panX,
      panY: viewport.panY,
    })
  }

  const isPanMode = allowPan

  return (
    <div
      id="proforma-viewport"
      ref={viewportRef}
      className="proforma-viewport"
      data-pan-tool={isPanMode ? '1' : '0'}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: PF_DARK.bg,
        cursor: isPanMode ? (viewport.panActive ? 'grabbing' : 'grab') : 'crosshair',
        touchAction: 'none',
      }}
      {...viewport.canvasHandlers}
      onPointerDown={(e) => {
        if (isPanMode) {
          viewport.canvasHandlers.onPointerDownCapture?.(e)
          return
        }
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        editor.onPointerDown(e)
      }}
      onPointerMove={(e) => {
        if (isPanMode) {
          viewport.canvasHandlers.onPointerMove?.(e)
          return
        }
        editor.onPointerMove(e)
      }}
      onPointerUp={(e) => {
        if (isPanMode) {
          viewport.canvasHandlers.onPointerUp?.(e)
          return
        }
        editor.onPointerUp(e)
        try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }} />
      {eraserActive && eraserScreen && (
        <div
          style={{
            position: 'absolute',
            left: eraserScreen.sx,
            top: eraserScreen.sy,
            width: (editor.brush.size || 18) * viewport.zoom,
            height: (editor.brush.size || 18) * viewport.zoom,
            marginLeft: -((editor.brush.size || 18) * viewport.zoom) / 2,
            marginTop: -((editor.brush.size || 18) * viewport.zoom) / 2,
            borderRadius: '50%',
            border: `2px solid ${PF_DARK.eraser}`,
            pointerEvents: 'none',
            boxShadow: `0 0 0 1px ${PF_DARK.bg}`,
          }}
        />
      )}
    </div>
  )
}
