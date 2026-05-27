import { useCallback, useRef, useState } from 'react'
import { screenToPage } from '@/lib/viewport'
import { autosaveProformaDoc } from '@/lib/proforma/persistence'
import { pushHistory, undoHistory, redoHistory } from '@/lib/proforma/history'
import { PF_DEFAULT_COLOR } from '@/lib/proforma/tools'

function newStrokeId() {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function smoothPts(pts, amount = 0.32) {
  if (!pts?.length || pts.length < 3) return pts
  const sm = [pts[0]]
  for (let i = 1; i < pts.length; i += 1) {
    const prev = sm[sm.length - 1]
    const cur = pts[i]
    sm.push({
      x: prev.x + (cur.x - prev.x) * (1 - amount),
      y: prev.y + (cur.y - prev.y) * (1 - amount),
      p: cur.p,
    })
  }
  return sm
}

/** Proforma V1 — crayon, gomme trait, main ; pas de commit React à chaque point */
export function useProformaEditor(doc, setDoc, { viewportRef, viewSize, onAutosave } = {}) {
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState(PF_DEFAULT_COLOR)
  const [brush, setBrush] = useState({ size: 2.5 })
  const [history, setHistory] = useState({ past: [], future: [] })
  const [cursorPage, setCursorPage] = useState(null)

  const drawing = useRef(null)
  const paintCb = useRef(null)
  const rafId = useRef(null)

  const requestPaint = useCallback(() => {
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null
      paintCb.current?.()
    })
  }, [])

  const subscribePaint = useCallback((fn) => {
    paintCb.current = fn
    return () => {
      if (paintCb.current === fn) paintCb.current = null
    }
  }, [])

  const pageFromEvent = useCallback((e) => {
    if (!doc || !viewSize?.w || !viewSize?.h) return null
    const vp = viewportRef?.current || { zoom: 1, panX: 0, panY: 0 }
    const rect = e.currentTarget.getBoundingClientRect()
    return screenToPage({
      sx: e.clientX - rect.left,
      sy: e.clientY - rect.top,
      viewW: viewSize.w,
      viewH: viewSize.h,
      pageW: doc.width,
      pageH: doc.height,
      zoom: vp.zoom ?? 1,
      panX: vp.panX ?? 0,
      panY: vp.panY ?? 0,
    })
  }, [doc, viewSize, viewportRef])

  const commitDoc = useCallback((updater, { recordHistory = true } = {}) => {
    setDoc((prev) => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (recordHistory) setHistory((h) => pushHistory(h, prev))
      autosaveProformaDoc(next).then((saved) => onAutosave?.(saved))
      return { ...next, updatedAt: Date.now() }
    })
  }, [setDoc, onAutosave])

  const undo = useCallback(() => {
    setDoc((prev) => {
      if (!prev) return prev
      const { history: h, doc: next, changed } = undoHistory(history, prev)
      if (changed) {
        setHistory(h)
        autosaveProformaDoc(next).then((saved) => onAutosave?.(saved))
        return next
      }
      return prev
    })
  }, [history, setDoc, onAutosave])

  const redo = useCallback(() => {
    setDoc((prev) => {
      if (!prev) return prev
      const { history: h, doc: next, changed } = redoHistory(history, prev)
      if (changed) {
        setHistory(h)
        autosaveProformaDoc(next).then((saved) => onAutosave?.(saved))
        return next
      }
      return prev
    })
  }, [history, setDoc, onAutosave])

  const onPointerDown = useCallback((e) => {
    if (!doc || e.button !== 0 || tool === 'hand') return
    const pt = pageFromEvent(e)
    if (!pt) return
    setCursorPage(pt)

    if (tool === 'eraser') {
      drawing.current = {
        mode: 'eraser',
        id: newStrokeId(),
        layerId: doc.activeLayerId,
        tool: 'eraser',
        color: '#000000',
        size: brush.size || 18,
        opacity: 1,
        pts: [{ x: pt.x, y: pt.y }],
      }
      return
    }

    if (tool === 'pen') {
      drawing.current = {
        mode: 'pen',
        id: newStrokeId(),
        layerId: doc.activeLayerId,
        tool: 'pen',
        color,
        size: brush.size || 2.5,
        opacity: 1,
        hardness: 0.9,
        smoothing: 0.35,
        pts: [{ x: pt.x, y: pt.y, p: e.pressure || 0.5 }],
      }
    }
  }, [doc, tool, pageFromEvent, color, brush.size])

  const onPointerMove = useCallback((e) => {
    if (tool === 'hand') return
    const pt = pageFromEvent(e)
    if (pt) setCursorPage(pt)

    const d = drawing.current
    if (!d || !pt) return

    const last = d.pts[d.pts.length - 1]
    if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < 1.5) return

    d.pts.push({ x: pt.x, y: pt.y, p: e.pressure || 0.5 })
    requestPaint()
  }, [pageFromEvent, tool, requestPaint])

  const onPointerUp = useCallback(() => {
    const d = drawing.current
    drawing.current = null
    if (!d || d.pts.length < 2) {
      requestPaint()
      return
    }

    const stroke = {
      ...d,
      pts: d.mode === 'pen' ? smoothPts(d.pts) : d.pts,
    }

    commitDoc((prev) => ({
      ...prev,
      strokes: [...(prev.strokes || []), stroke],
    }), { recordHistory: true })
    requestPaint()
  }, [commitDoc, requestPaint])

  const getLiveStroke = useCallback(() => drawing.current, [])

  return {
    tool,
    setTool,
    color,
    setColor,
    brush,
    setBrush,
    cursorPage,
    history,
    undo,
    redo,
    canUndo: (history.past?.length || 0) > 0,
    canRedo: (history.future?.length || 0) > 0,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    getLiveStroke,
    subscribePaint,
    commitDoc,
  }
}
