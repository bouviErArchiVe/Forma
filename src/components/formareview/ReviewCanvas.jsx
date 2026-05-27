import { useCallback, useEffect, useRef, useState } from 'react'
import {
  screenToPage, pageToScreen, computeFitZoom, clampDocumentPan, zoomByFactor,
} from '@/lib/viewport'
import { drawMarkup, drawPinMarker } from '@/lib/formareview/render'
import { FRV_DARK } from '@/lib/formareview/constants'

export default function ReviewCanvas({
  page,
  pins = [],
  markups = [],
  tool,
  selectedPinId,
  onPinClick,
  onPlacePin,
  onStartDraft,
  onUpdateDraft,
  onCommitDraft,
  onAddText,
  draftRef,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const [viewport, setViewport] = useState({ zoom: 0.85, panX: 0, panY: 0 })
  const [viewSize, setViewSize] = useState({ w: 800, h: 600 })
  const [drawing, setDrawing] = useState(false)
  const [bgReady, setBgReady] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => {
      setViewSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!page) return
    const fit = computeFitZoom({
      viewW: viewSize.w, viewH: viewSize.h,
      pageW: page.width, pageH: page.height,
    })
    setViewport({ zoom: fit, panX: 0, panY: 0 })
  }, [page?.id, viewSize.w, viewSize.h])

  useEffect(() => {
    if (!page?.dataUrl) { setBgReady(true); return undefined }
    const img = new Image()
    img.onload = () => { imgRef.current = img; setBgReady(true) }
    img.onerror = () => setBgReady(true)
    img.src = page.dataUrl
    return () => { imgRef.current = null }
  }, [page?.dataUrl])

  const pageCoords = useCallback((clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect || !page) return null
    return screenToPage({
      sx: clientX - rect.left,
      sy: clientY - rect.top,
      viewW: viewSize.w,
      viewH: viewSize.h,
      pageW: page.width,
      pageH: page.height,
      zoom: viewport.zoom,
      panX: viewport.panX,
      panY: viewport.panY,
    })
  }, [page, viewSize, viewport])

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !page) return
    const ctx = canvas.getContext('2d')
    const scale = viewport.zoom
    const w = page.width * scale
    const h = page.height * scale
    canvas.width = viewSize.w
    canvas.height = viewSize.h
    ctx.clearRect(0, 0, viewSize.w, viewSize.h)

    const { sx: ox, sy: oy } = pageToScreen({
      px: 0, py: 0, viewW: viewSize.w, viewH: viewSize.h,
      pageW: page.width, pageH: page.height,
      zoom: viewport.zoom, panX: viewport.panX, panY: viewport.panY,
    })
    const topLeft = pageToScreen({
      px: 0, py: 0, viewW: viewSize.w, viewH: viewSize.h,
      pageW: page.width, pageH: page.height,
      zoom: viewport.zoom, panX: viewport.panX, panY: viewport.panY,
    })
    const bottomRight = pageToScreen({
      px: page.width, py: page.height,
      viewW: viewSize.w, viewH: viewSize.h,
      pageW: page.width, pageH: page.height,
      zoom: viewport.zoom, panX: viewport.panX, panY: viewport.panY,
    })
    const drawW = bottomRight.sx - topLeft.sx
    const drawH = bottomRight.sy - topLeft.sy

    ctx.save()
    if (imgRef.current) {
      ctx.drawImage(imgRef.current, topLeft.sx, topLeft.sy, drawW, drawH)
    } else {
      ctx.fillStyle = '#fff'
      ctx.fillRect(topLeft.sx, topLeft.sy, drawW, drawH)
    }

    ctx.translate(topLeft.sx, topLeft.sy)
    const localScale = drawW / page.width
    for (const m of markups) drawMarkup(ctx, m, localScale)

    if (draftRef?.current) {
      const d = draftRef.current
      if (d.type === 'highlight' && d.start && d.end) {
        const x = Math.min(d.start.x, d.end.x) * localScale
        const y = Math.min(d.start.y, d.end.y) * localScale
        const rw = Math.abs(d.end.x - d.start.x) * localScale
        const rh = Math.abs(d.end.y - d.start.y) * localScale
        ctx.fillStyle = 'rgba(244,224,77,0.35)'
        ctx.fillRect(x, y, rw, rh)
      } else if (d.type === 'arrow' && d.start && d.end) {
        drawMarkup(ctx, {
          type: 'arrow',
          data: { x1: d.start.x, y1: d.start.y, x2: d.end.x, y2: d.end.y, color: '#e85d5d', width: 3 },
        }, localScale)
      } else if (d.type === 'draw' && d.points?.length) {
        drawMarkup(ctx, { type: 'draw', data: { points: d.points, color: '#5d9ee8', width: 3 } }, localScale)
      }
    }

    pins.forEach((pin, i) => {
      drawPinMarker(ctx, pin, i, localScale, pin.id === selectedPinId)
    })
    ctx.restore()
  }, [page, markups, pins, selectedPinId, viewport, viewSize, draftRef, bgReady])

  useEffect(() => { paint() }, [paint])

  const handleWheel = (e) => {
    if (tool !== 'hand' && !e.ctrlKey) return
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
    setViewport((v) => zoomByFactor(v, factor, { x: e.clientX - rect.left, y: e.clientY - rect.top }, viewSize.w, viewSize.h))
  }

  const handlePointerDown = (e) => {
    if (!page) return
    const pt = pageCoords(e.clientX, e.clientY)
    if (!pt) return

    if (tool === 'hand') {
      setDrawing(true)
      containerRef.current?.setPointerCapture(e.pointerId)
      return
    }

    if (tool === 'pin') {
      onPlacePin?.(pt.x, pt.y)
      return
    }

    if (tool === 'text') {
      const text = window.prompt('Texte de l\'annotation :')
      if (text) onAddText?.(pt.x, pt.y, text)
      return
    }

    if (['highlight', 'arrow', 'draw'].includes(tool)) {
      setDrawing(true)
      onStartDraft?.(tool, pt)
      containerRef.current?.setPointerCapture(e.pointerId)
    }

    if (tool === 'select') {
      const hit = pins.find((pin) => {
        const dist = Math.hypot(pin.x - pt.x, pin.y - pt.y)
        return dist < 20 / viewport.zoom
      })
      if (hit) onPinClick?.(hit.id)
    }
  }

  const panStart = useRef(null)
  const handlePointerMove = (e) => {
    if (!drawing) return
    if (tool === 'hand') {
      if (!panStart.current) {
        panStart.current = { x: e.clientX, y: e.clientY, panX: viewport.panX, panY: viewport.panY }
        return
      }
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      const next = clampDocumentPan({
        panX: panStart.current.panX + dx,
        panY: panStart.current.panY + dy,
        zoom: viewport.zoom,
        viewW: viewSize.w, viewH: viewSize.h,
        pageW: page.width, pageH: page.height,
      })
      setViewport((v) => ({ ...v, ...next }))
      return
    }
    const pt = pageCoords(e.clientX, e.clientY)
    if (pt) onUpdateDraft?.(pt)
    paint()
  }

  const handlePointerUp = (e) => {
    if (tool === 'hand') {
      panStart.current = null
    } else if (['highlight', 'arrow', 'draw'].includes(tool)) {
      onCommitDraft?.()
    }
    setDrawing(false)
    try { containerRef.current?.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
    paint()
  }

  if (!page) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: FRV_DARK.muted }}>
        Importez un plan ou une image pour commencer la révision
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: '#0a0c10', cursor: tool === 'hand' ? 'grab' : tool === 'pin' ? 'crosshair' : 'default',
        touchAction: 'none',
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6,
        background: FRV_DARK.panel, borderRadius: 8, padding: 4, border: `1px solid ${FRV_DARK.border}`,
      }}>
        <ZoomBtn onClick={() => setViewport((v) => zoomByFactor(v, 1.15, null, viewSize.w, viewSize.h))}>+</ZoomBtn>
        <span style={{ color: FRV_DARK.muted, fontSize: 12, padding: '4px 6px', minWidth: 44, textAlign: 'center' }}>
          {Math.round(viewport.zoom * 100)}%
        </span>
        <ZoomBtn onClick={() => setViewport((v) => zoomByFactor(v, 1 / 1.15, null, viewSize.w, viewSize.h))}>−</ZoomBtn>
        <ZoomBtn onClick={() => {
          const fit = computeFitZoom({ viewW: viewSize.w, viewH: viewSize.h, pageW: page.width, pageH: page.height })
          setViewport({ zoom: fit, panX: 0, panY: 0 })
        }}>⊡</ZoomBtn>
      </div>
    </div>
  )
}

function ZoomBtn({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: 'transparent', border: 'none', color: FRV_DARK.ink,
      cursor: 'pointer', fontSize: 16, padding: '2px 8px', borderRadius: 4,
    }}>
      {children}
    </button>
  )
}
