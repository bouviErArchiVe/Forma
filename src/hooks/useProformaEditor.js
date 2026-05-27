import { useCallback, useRef, useState } from 'react'
import { screenToPage } from '@/lib/viewport'
import { autosaveProformaDoc } from '@/lib/proforma/persistence'
import { pushHistory, undoHistory, redoHistory } from '@/lib/proforma/history'
import { eraseAtPoint, eraseInRect } from '@/lib/proforma/eraser'
import { snapDocPoint } from '@/lib/proforma/snap'
import {
  getToolDef, isDrawTool, isEraserTool, isShapeTool, isSelectTool,
  toolBrushSettings, PF_DEFAULT_TOOL, PF_DEFAULT_COLOR,
} from '@/lib/proforma/tools'

function newStrokeId() {
  return `st_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function useProformaEditor(doc, setDoc, { viewportRef, viewSize, onAutosave } = {}) {
  const [tool, setTool] = useState(PF_DEFAULT_TOOL)
  const [color, setColor] = useState(PF_DEFAULT_COLOR)
  const [brush, setBrush] = useState(toolBrushSettings(PF_DEFAULT_TOOL))
  const [history, setHistory] = useState({ past: [], future: [] })
  const [cursorPage, setCursorPage] = useState(null)

  const drawing = useRef(null)
  const zoneErase = useRef(null)
  const selectRect = useRef(null)

  const pageFromEvent = useCallback((e) => {
    if (!doc || !viewSize?.w || !viewSize?.h) return null
    const vp = viewportRef?.current || { zoom: 1, panX: 0, panY: 0 }
    const rect = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const pt = screenToPage({
      sx, sy,
      viewW: viewSize.w,
      viewH: viewSize.h,
      pageW: doc.width,
      pageH: doc.height,
      zoom: vp.zoom ?? 1,
      panX: vp.panX ?? 0,
      panY: vp.panY ?? 0,
    })
    return snapDocPoint(pt.x, pt.y, doc)
  }, [doc, viewSize, viewportRef])

  const commitDoc = useCallback((updater, { recordHistory = true } = {}) => {
    setDoc((prev) => {
      if (!prev) return prev
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (recordHistory) {
        setHistory((h) => pushHistory(h, prev))
      }
      autosaveProformaDoc(next).then((saved) => onAutosave?.(saved))
      return next
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

  const activeLayer = doc?.layers?.find((l) => l.id === doc.activeLayerId)
  const layerLocked = activeLayer?.locked

  const startStroke = useCallback((pt, pressure = 0.5) => {
    if (!doc || layerLocked) return null
    const def = getToolDef(tool)
    const settings = toolBrushSettings(tool, brush)
    const base = {
      id: newStrokeId(),
      layerId: doc.activeLayerId,
      tool,
      color,
      size: settings.size,
      opacity: settings.opacity,
      hardness: settings.hardness,
      smoothing: settings.smoothing,
      spacing: settings.spacing,
      flow: settings.flow,
      pressure: settings.pressure,
      pts: [{ x: pt.x, y: pt.y, p: pressure }],
    }
    if (isShapeTool(tool)) {
      return { ...base, shapeType: def.shapeType, pts: [pt, { ...pt }] }
    }
    return base
  }, [doc, layerLocked, tool, color, brush])

  const onPointerDown = useCallback((e) => {
    if (!doc || e.button !== 0) return
    const pt = pageFromEvent(e)
    if (!pt) return
    setCursorPage(pt)

    if (isSelectTool(tool)) {
      selectRect.current = { start: pt, current: pt }
      return
    }

    if (isEraserTool(tool)) {
      const def = getToolDef(tool)
      if (def.eraserMode === 'zone') {
        zoneErase.current = { start: pt, current: pt }
        return
      }
      commitDoc((prev) => {
        const { strokes } = eraseAtPoint(prev.strokes, pt, {
          mode: def.eraserMode || 'precision',
          radius: brush.size || def.size || 12,
          layerId: prev.activeLayerId,
        })
        return { ...prev, strokes }
      }, { recordHistory: true })
      drawing.current = { mode: 'erase', tool }
      return
    }

    if (isDrawTool(tool) || tool === 'text') {
      if (tool === 'text') {
        const text = window.prompt('Texte :', '')
        if (text?.trim()) {
          commitDoc((prev) => ({
            ...prev,
            strokes: [...prev.strokes, {
              id: newStrokeId(),
              layerId: prev.activeLayerId,
              tool: 'text',
              shapeType: 'text',
              text: text.trim(),
              color,
              size: brush.size || 4,
              opacity: 1,
              pts: [pt],
            }],
          }), { recordHistory: true })
        }
        return
      }
      drawing.current = startStroke(pt, e.pressure || 0.5)
    }
  }, [doc, tool, pageFromEvent, commitDoc, startStroke, color, brush])

  const onPointerMove = useCallback((e) => {
    const pt = pageFromEvent(e)
    if (pt) setCursorPage(pt)

    if (selectRect.current && pt) {
      selectRect.current = { ...selectRect.current, current: pt }
      return
    }

    if (zoneErase.current && pt) {
      zoneErase.current = { ...zoneErase.current, current: pt }
      return
    }

    const d = drawing.current
    if (!d || !pt) return

    if (d.mode === 'erase') {
      const def = getToolDef(tool)
      commitDoc((prev) => {
        const { strokes } = eraseAtPoint(prev.strokes, pt, {
          mode: def.eraserMode || 'auto',
          radius: brush.size || def.size || 12,
          layerId: prev.activeLayerId,
        })
        return { ...prev, strokes }
      }, { recordHistory: false })
      return
    }

    if (d.pts) {
      if (isShapeTool(tool)) {
        drawing.current = { ...d, pts: [d.pts[0], pt] }
      } else {
        drawing.current = { ...d, pts: [...d.pts, { x: pt.x, y: pt.y, p: e.pressure || 0.5 }] }
      }
    }
  }, [pageFromEvent, tool, brush, commitDoc])

  const onPointerUp = useCallback(() => {
    if (zoneErase.current) {
      const z = zoneErase.current
      zoneErase.current = null
      if (z.start && z.current) {
        commitDoc((prev) => {
          const { strokes } = eraseInRect(prev.strokes, {
            x1: z.start.x, y1: z.start.y, x2: z.current.x, y2: z.current.y,
          }, { layerId: prev.activeLayerId })
          return { ...prev, strokes }
        }, { recordHistory: true })
      }
      return
    }

    selectRect.current = null

    const d = drawing.current
    drawing.current = null
    if (!d || d.mode === 'erase') return

    if (d.pts?.length >= 2 || (d.pts?.length === 1 && !isShapeTool(tool))) {
      commitDoc((prev) => ({
        ...prev,
        strokes: [...prev.strokes, d],
      }), { recordHistory: true })
    }
  }, [commitDoc, tool])

  const getLiveStroke = useCallback(() => drawing.current, [])
  const getSelectRect = useCallback(() => selectRect.current, [])
  const getZoneRect = useCallback(() => zoneErase.current, [])

  const updateLayer = useCallback((layerId, patch) => {
    commitDoc((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === layerId ? { ...l, ...patch } : l)),
    }), { recordHistory: false })
  }, [commitDoc])

  const setActiveLayerId = useCallback((layerId) => {
    commitDoc((prev) => ({ ...prev, activeLayerId: layerId }), { recordHistory: false })
  }, [commitDoc])

  const updateTool = useCallback((nextTool) => {
    setTool(nextTool)
    setBrush(toolBrushSettings(nextTool, brush))
  }, [brush])

  return {
    tool,
    setTool: updateTool,
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
    getSelectRect,
    getZoneRect,
    updateLayer,
    setActiveLayerId,
    commitDoc,
  }
}
