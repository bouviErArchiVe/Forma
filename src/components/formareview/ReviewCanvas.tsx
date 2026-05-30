import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormaReviewMarkup, FormaReviewPage, FormaReviewPin, FormaReviewTool } from '../../types'
import { drawMarkup, drawPinMarker } from '../../lib/formareview/render'
import {
  clampDocumentPan,
  computeFitZoom,
  pageToScreen,
  screenToPage,
  zoomByFactor,
} from '../../lib/formareview/viewport'

interface ReviewCanvasProps {
  page: FormaReviewPage | null
  pins: FormaReviewPin[]
  markups: FormaReviewMarkup[]
  tool: FormaReviewTool
  color: string
  selectedPinId: string | null
  onPinClick: (id: string) => void
  onPlacePin: (x: number, y: number) => void
  onStartDraft: (type: string, start: { x: number; y: number }) => void
  onUpdateDraft: (point: { x: number; y: number }) => void
  onCommitDraft: () => void
  onAddText: (x: number, y: number, text: string) => void
  onEraseAt: (pageId: string, x: number, y: number) => void
  draftRef: React.MutableRefObject<{
    type: string
    start: { x: number; y: number }
    end?: { x: number; y: number }
    points?: { x: number; y: number }[]
  } | null>
}

export function ReviewCanvas({
  page,
  pins,
  markups,
  tool,
  color,
  selectedPinId,
  onPinClick,
  onPlacePin,
  onStartDraft,
  onUpdateDraft,
  onCommitDraft,
  onAddText,
  onEraseAt,
  draftRef,
}: ReviewCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [viewport, setViewport] = useState({ zoom: 0.85, panX: 0, panY: 0 })
  const [viewSize, setViewSize] = useState({ w: 800, h: 600 })
  const [drawing, setDrawing] = useState(false)
  const [bgReady, setBgReady] = useState(false)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const activePointer = useRef<number | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setViewSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!page) return
    const fit = computeFitZoom({
      viewW: viewSize.w,
      viewH: viewSize.h,
      pageW: page.width,
      pageH: page.height,
    })
    setViewport({ zoom: fit, panX: 0, panY: 0 })
  }, [page?.id, viewSize.w, viewSize.h, page])

  useEffect(() => {
    if (!page?.dataUrl) {
      setBgReady(true)
      return
    }
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setBgReady(true)
    }
    img.onerror = () => setBgReady(true)
    img.src = page.dataUrl
    return () => {
      imgRef.current = null
    }
  }, [page?.dataUrl])

  const pageCoords = useCallback(
    (clientX: number, clientY: number) => {
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
    },
    [page, viewSize, viewport],
  )

  const paint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !page) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = viewSize.w
    canvas.height = viewSize.h
    ctx.clearRect(0, 0, viewSize.w, viewSize.h)

    const topLeft = pageToScreen({
      px: 0,
      py: 0,
      viewW: viewSize.w,
      viewH: viewSize.h,
      pageW: page.width,
      pageH: page.height,
      zoom: viewport.zoom,
      panX: viewport.panX,
      panY: viewport.panY,
    })
    const bottomRight = pageToScreen({
      px: page.width,
      py: page.height,
      viewW: viewSize.w,
      viewH: viewSize.h,
      pageW: page.width,
      pageH: page.height,
      zoom: viewport.zoom,
      panX: viewport.panX,
      panY: viewport.panY,
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

    const d = draftRef.current
    if (d) {
      if (d.type === 'highlight' && d.start && d.end) {
        const x = Math.min(d.start.x, d.end.x) * localScale
        const y = Math.min(d.start.y, d.end.y) * localScale
        const rw = Math.abs(d.end.x - d.start.x) * localScale
        const rh = Math.abs(d.end.y - d.start.y) * localScale
        ctx.fillStyle = 'rgba(244,224,77,0.35)'
        ctx.fillRect(x, y, rw, rh)
      } else if (['arrow', 'rect', 'circle'].includes(d.type) && d.start && d.end) {
        if (d.type === 'arrow') {
          drawMarkup(
            ctx,
            {
              id: 'draft',
              pageId: page.id,
              type: 'arrow',
              data: {
                x1: d.start.x,
                y1: d.start.y,
                x2: d.end.x,
                y2: d.end.y,
                color: color || '#e85d5d',
                width: 3,
              },
              authorId: 'local',
              authorName: '',
              role: 'prof',
              createdAt: 0,
            },
            localScale,
          )
        } else {
          drawMarkup(
            ctx,
            {
              id: 'draft',
              pageId: page.id,
              type: d.type as FormaReviewMarkup['type'],
              data: {
                x: Math.min(d.start.x, d.end.x),
                y: Math.min(d.start.y, d.end.y),
                w: Math.abs(d.end.x - d.start.x),
                h: Math.abs(d.end.y - d.start.y),
                color: color || '#e85d5d',
                width: 3,
              },
              authorId: 'local',
              authorName: '',
              role: 'prof',
              createdAt: 0,
            },
            localScale,
          )
        }
      } else if (d.type === 'draw' && d.points?.length) {
        drawMarkup(
          ctx,
          {
            id: 'draft',
            pageId: page.id,
            type: 'draw',
            data: { points: d.points, color: color || '#5d9ee8', width: 3 },
            authorId: 'local',
            authorName: '',
            role: 'prof',
            createdAt: 0,
          },
          localScale,
        )
      }
    }

    pins.forEach((pin, i) => {
      drawPinMarker(ctx, pin, i, localScale, pin.id === selectedPinId)
    })
    ctx.restore()
  }, [page, markups, pins, selectedPinId, viewport, viewSize, draftRef, bgReady, color])

  useEffect(() => {
    paint()
  }, [paint])

  const beginPan = (e: React.PointerEvent) => {
    panStart.current = { x: e.clientX, y: e.clientY, panX: viewport.panX, panY: viewport.panY }
    activePointer.current = e.pointerId
    setDrawing(true)
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  const handleWheel = (e: React.WheelEvent) => {
    if (tool !== 'hand' && !e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08
    setViewport((v) =>
      zoomByFactor(v, factor, { x: e.clientX - rect.left, y: e.clientY - rect.top }, viewSize.w, viewSize.h),
    )
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!page) return
    if (tool === 'hand') {
      beginPan(e)
      return
    }
    const pt = pageCoords(e.clientX, e.clientY)
    if (!pt) return

    if (tool === 'pin') {
      onPlacePin(pt.x, pt.y)
      return
    }

    if (tool === 'text') {
      const text = window.prompt("Texte de l'annotation :")
      if (text) onAddText(pt.x, pt.y, text)
      return
    }

    if (tool === 'eraser') {
      setDrawing(true)
      activePointer.current = e.pointerId
      onEraseAt(page.id, pt.x, pt.y)
      containerRef.current?.setPointerCapture(e.pointerId)
      return
    }

    if (['highlight', 'arrow', 'draw', 'rect', 'circle'].includes(tool)) {
      setDrawing(true)
      activePointer.current = e.pointerId
      onStartDraft(tool, pt)
      containerRef.current?.setPointerCapture(e.pointerId)
      return
    }

    if (tool === 'select') {
      const hit = pins.find((pin) => Math.hypot(pin.x - pt.x, pin.y - pt.y) < 20 / viewport.zoom)
      if (hit) onPinClick(hit.id)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawing || activePointer.current !== e.pointerId) return

    if (panStart.current && page) {
      const dx = e.clientX - panStart.current.x
      const dy = e.clientY - panStart.current.y
      const next = clampDocumentPan({
        panX: panStart.current.panX + dx,
        panY: panStart.current.panY + dy,
        zoom: viewport.zoom,
        viewW: viewSize.w,
        viewH: viewSize.h,
        pageW: page.width,
        pageH: page.height,
      })
      setViewport((v) => ({ ...v, ...next }))
      return
    }

    const pt = pageCoords(e.clientX, e.clientY)
    if (!pt) return

    if (tool === 'eraser' && page) {
      onEraseAt(page.id, pt.x, pt.y)
      paint()
      return
    }

    if (['highlight', 'arrow', 'draw', 'rect', 'circle'].includes(tool)) {
      onUpdateDraft(pt)
      paint()
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointer.current !== e.pointerId) return
    if (panStart.current) {
      panStart.current = null
    } else if (['highlight', 'arrow', 'draw', 'rect', 'circle'].includes(tool)) {
      onCommitDraft()
    }
    activePointer.current = null
    setDrawing(false)
    try {
      containerRef.current?.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    paint()
  }

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-forma-muted">
        Importez un plan ou une image pour commencer la révision
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-[#0a0c10] touch-none"
      style={{
        cursor:
          tool === 'hand' ? 'grab' : tool === 'pin' ? 'crosshair' : 'default',
      }}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      <div className="absolute bottom-3 right-3 flex gap-1.5 bg-forma-panel rounded-lg p-1 border border-forma-border">
        <ZoomBtn onClick={() => setViewport((v) => zoomByFactor(v, 1.15, null, viewSize.w, viewSize.h))}>
          +
        </ZoomBtn>
        <span className="text-forma-muted text-xs px-1.5 min-w-[44px] text-center pt-1">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <ZoomBtn onClick={() => setViewport((v) => zoomByFactor(v, 1 / 1.15, null, viewSize.w, viewSize.h))}>
          −
        </ZoomBtn>
        <ZoomBtn
          onClick={() => {
            const fit = computeFitZoom({
              viewW: viewSize.w,
              viewH: viewSize.h,
              pageW: page.width,
              pageH: page.height,
            })
            setViewport({ zoom: fit, panX: 0, panY: 0 })
          }}
        >
          ⊡
        </ZoomBtn>
      </div>
    </div>
  )
}

function ZoomBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-transparent border-none text-forma-ink cursor-pointer text-base px-2 rounded"
    >
      {children}
    </button>
  )
}
