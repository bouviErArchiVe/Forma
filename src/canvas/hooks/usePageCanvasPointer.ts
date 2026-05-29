import { useCallback, type MutableRefObject, type RefObject } from 'react'
import { createId } from '../../lib/id'
import { eraseAt } from '../../lib/canvas-erase'
import { addStickerToPage } from '../../lib/page-mutations'
import { detectCircleStroke } from '../../lib/circle-lasso'
import { detectShapeFromPoints, snapLineToAxis } from '../../lib/shape-detect'
import { appendStrokes } from '../../lib/stroke-finalize'
import { eraseStrokesInCircle } from '../../lib/erase-circle'
import { eraserInkClip, selectionInkClip } from '../../lib/dirty-rect'
import type { InkClip } from '../../lib/page-render'
import type { PageHistory } from '../../lib/page-history'
import {
  applySelectionMove,
  angleAtPivot,
  collectSelection,
  collectSelectionFromStrokeCircle,
  getSelectionRotationHandle,
  hitTestAtPoint,
  hitTestRotationHandle,
  isMeaningfulSelectionRect,
  rotateSelection,
  selectionBounds,
  toggleSelectionItem,
} from '../../lib/selection-engine'
import type { Page, Point, SelectionItem, Stroke, TapeElement, TextElement } from '../../types'
import type { useEditorStore } from '../../stores/editorStore'

type EditorStore = ReturnType<typeof useEditorStore.getState>

export interface PageCanvasPointerRefs {
  drawRef: RefObject<HTMLCanvasElement | null>
  isDrawing: MutableRefObject<boolean>
  lassoStart: MutableRefObject<Point | null>
  lassoDraftRef: MutableRefObject<{ x: number; y: number; w: number; h: number } | null>
  tapeEndDraftRef: MutableRefObject<Point | null>
  dragStart: MutableRefObject<Point | null>
  penStartTime: MutableRefObject<number>
  isRotatingRef: MutableRefObject<boolean>
  rotationBaseRef: MutableRefObject<Page | null>
  rotationStartAngleRef: MutableRefObject<number>
  localRef: MutableRefObject<Page>
  historyRef: MutableRefObject<PageHistory>
}

export interface UsePageCanvasPointerOptions {
  refs: PageCanvasPointerRefs
  interactive: boolean
  laserPointer: boolean
  palmRejection: boolean
  fingerScroll: boolean
  shapeHoldMs: number
  scribbleErase: boolean
  store: EditorStore
  pageWidth: number
  pageHeight: number
  local: Page
  currentStroke: Stroke | null
  shapePoints: Point[]
  selection: SelectionItem[]
  dragOffset: { x: number; y: number } | null
  tapeStart: Point | null
  tapeEnd: Point | null
  pendingSticker: string | null
  getPoint: (e: React.PointerEvent) => Point
  hitTextAt: (pt: Point) => TextElement | undefined
  hitTape: (pt: Point) => TapeElement | undefined
  commit: (next: Page, recordHistory?: boolean) => void
  finishGestureHistory: (committed: boolean) => void
  scheduleOverlayInteraction: () => void
  scheduleInkRedraw: (clip?: InkClip) => void
  scheduleOverlayRedraw: (clip?: InkClip) => void
  setLocal: (page: Page) => void
  setCurrentStroke: (s: Stroke | null) => void
  setShapePoints: React.Dispatch<React.SetStateAction<Point[]>>
  setSelection: React.Dispatch<React.SetStateAction<SelectionItem[]>>
  setDragOffset: (o: { x: number; y: number } | null) => void
  setLasso: (r: { x: number; y: number; w: number; h: number } | null) => void
  setLaserTrail: React.Dispatch<React.SetStateAction<{ x: number; y: number }[]>>
  setEditingTextId: (id: string | null) => void
  setTapeStart: (p: Point | null) => void
  setTapeEnd: (p: Point | null) => void
  setPendingSticker: (id: string | null) => void
}

export function usePageCanvasPointer(options: UsePageCanvasPointerOptions) {
  const {
    refs,
    interactive,
    laserPointer,
    palmRejection,
    fingerScroll,
    shapeHoldMs,
    scribbleErase,
    store,
    pageWidth,
    pageHeight,
    local,
    currentStroke,
    shapePoints,
    selection,
    dragOffset,
    tapeStart,
    tapeEnd,
    pendingSticker,
    getPoint,
    hitTextAt,
    hitTape,
    commit,
    finishGestureHistory,
    scheduleOverlayInteraction,
    scheduleInkRedraw,
    scheduleOverlayRedraw,
    setLocal,
    setCurrentStroke,
    setShapePoints,
    setSelection,
    setDragOffset,
    setLasso,
    setLaserTrail,
    setEditingTextId,
    setTapeStart,
    setTapeEnd,
    setPendingSticker,
  } = options

  const isPalmTouch = useCallback(
    (e: React.PointerEvent) =>
      palmRejection &&
      e.pointerType === 'touch' &&
      ((e.width > 28 || e.height > 28) || (e.pressure === 0 && e.width > 0)),
    [palmRejection],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive) return
      if (isPalmTouch(e)) return
      if (
        fingerScroll &&
        e.pointerType === 'touch' &&
        e.pressure < 0.1 &&
        store.activeTool !== 'lasso'
      ) {
        return
      }

      if (store.activeTool === 'elements' && pendingSticker) {
        const pt = getPoint(e)
        commit(addStickerToPage(local, pendingSticker, pt.x, pt.y))
        setPendingSticker(null)
        return
      }

      if (laserPointer) {
        const canvas = refs.drawRef.current
        if (!canvas) return
        canvas.setPointerCapture(e.pointerId)
        const pt = getPoint(e)
        refs.isDrawing.current = true
        setLaserTrail([{ x: pt.x, y: pt.y }])
        return
      }

      if (store.readMode) {
        const tape = hitTape(getPoint(e))
        if (tape) {
          commit({
            ...local,
            tapes: local.tapes.map((t) =>
              t.id === tape.id ? { ...t, revealed: !t.revealed } : t,
            ),
          })
        }
        return
      }
      const canvas = refs.drawRef.current
      if (!canvas) return
      canvas.setPointerCapture(e.pointerId)
      const pt = getPoint(e)
      refs.isDrawing.current = true
      refs.historyRef.current.beginBatch(refs.localRef.current)

      if (store.activeTool === 'tape') {
        setTapeStart(pt)
        return
      }

      if (store.activeTool === 'text') {
        const existing = hitTextAt(pt)
        if (existing) setEditingTextId(existing.id)
        else {
          const el: TextElement = {
            id: createId(),
            x: pt.x,
            y: pt.y,
            width: 280,
            height: 120,
            content: '',
            fontSize: 18,
            color: store.penColor,
            align: 'left',
            pageId: local.id,
          }
          commit({ ...local, texts: [...local.texts, el] })
          setEditingTextId(el.id)
        }
        return
      }

      if (store.activeTool === 'lasso') {
        const handle = getSelectionRotationHandle(local, selection, dragOffset ?? undefined)
        if (handle && hitTestRotationHandle(pt, handle)) {
          refs.isRotatingRef.current = true
          refs.rotationBaseRef.current = refs.localRef.current
          refs.rotationStartAngleRef.current = angleAtPivot({ x: handle.pivotX, y: handle.pivotY }, pt)
          refs.historyRef.current.beginBatch(refs.localRef.current)
          return
        }
        const bounds = selection.length ? selectionBounds(local, selection) : null
        if (
          bounds &&
          pt.x >= bounds.x &&
          pt.x <= bounds.x + bounds.w &&
          pt.y >= bounds.y &&
          pt.y <= bounds.y + bounds.h
        ) {
          refs.dragStart.current = pt
          return
        }
        const hit = hitTestAtPoint(local, pt)
        if (hit) {
          setSelection(e.shiftKey ? toggleSelectionItem(selection, hit) : [hit])
          refs.dragStart.current = pt
          return
        }
        if (selection.length && !e.shiftKey) setSelection([])
        refs.lassoStart.current = pt
        refs.lassoDraftRef.current = { x: pt.x, y: pt.y, w: 0, h: 0 }
        scheduleOverlayInteraction()
        return
      }

      if (store.activeTool === 'eraser') {
        refs.historyRef.current.push(local)
        const next = eraseAt(local, pt)
        setLocal(next)
        refs.localRef.current = next
        scheduleInkRedraw(eraserInkClip(pt, store.eraserSize, pageWidth, pageHeight))
        return
      }

      if (store.activeTool === 'shapes') {
        setShapePoints([pt])
        return
      }

      if (store.activeTool === 'laser') {
        setLaserTrail([{ x: pt.x, y: pt.y }])
        return
      }

      const tool =
        store.activeTool === 'highlighter'
          ? 'highlighter'
          : store.activeTool === 'pencil'
            ? 'pencil'
            : 'pen'
      const stroke: Stroke = {
        id: createId(),
        tool,
        color:
          tool === 'highlighter'
            ? store.highlighterColor
            : tool === 'pencil'
              ? store.pencilColor
              : store.penColor,
        width:
          tool === 'highlighter'
            ? store.highlighterWidth
            : tool === 'pencil'
              ? store.pencilWidth + pt.pressure
              : store.penWidth + pt.pressure * 2,
        opacity: tool === 'highlighter' ? 0.4 : tool === 'pencil' ? 0.9 : 1,
        points: [pt],
        pageId: local.id,
      }
      refs.penStartTime.current = Date.now()
      setCurrentStroke(stroke)
    },
    [
      interactive,
      isPalmTouch,
      fingerScroll,
      store,
      pendingSticker,
      laserPointer,
      local,
      selection,
      dragOffset,
      tapeStart,
      getPoint,
      hitTextAt,
      hitTape,
      commit,
      scheduleOverlayInteraction,
      scheduleInkRedraw,
      pageWidth,
      pageHeight,
      refs,
      setPendingSticker,
      setLaserTrail,
      setTapeStart,
      setEditingTextId,
      setSelection,
      setLocal,
      setShapePoints,
      setCurrentStroke,
    ],
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!interactive) return
      if (!refs.isDrawing.current || (store.readMode && !laserPointer)) return
      if (isPalmTouch(e)) return
      const pt = getPoint(e)

      if (store.activeTool === 'tape' && tapeStart) {
        refs.tapeEndDraftRef.current = pt
        scheduleOverlayRedraw()
        return
      }

      if (laserPointer) {
        setLaserTrail((t) => [...t.slice(-24), { x: pt.x, y: pt.y }])
        return
      }

      if (refs.isRotatingRef.current && refs.rotationBaseRef.current) {
        const handle = getSelectionRotationHandle(refs.rotationBaseRef.current, selection)
        if (handle) {
          const angle = angleAtPivot({ x: handle.pivotX, y: handle.pivotY }, pt)
          const delta = angle - refs.rotationStartAngleRef.current
          const next = rotateSelection(refs.rotationBaseRef.current, selection, delta)
          setLocal(next)
          refs.localRef.current = next
          scheduleInkRedraw(
            selectionInkClip(next, selection, undefined, 40, pageWidth, pageHeight),
          )
          scheduleOverlayInteraction()
        }
        return
      }

      if (store.activeTool === 'lasso' && refs.lassoStart.current && !refs.dragStart.current) {
        const sx = refs.lassoStart.current.x
        const sy = refs.lassoStart.current.y
        refs.lassoDraftRef.current = {
          x: Math.min(sx, pt.x),
          y: Math.min(sy, pt.y),
          w: Math.abs(pt.x - sx),
          h: Math.abs(pt.y - sy),
        }
        scheduleOverlayInteraction()
        return
      }

      if (refs.dragStart.current && selection.length) {
        const dx = pt.x - refs.dragStart.current.x
        const dy = pt.y - refs.dragStart.current.y
        setDragOffset({ x: dx, y: dy })
        return
      }

      if (store.activeTool === 'eraser') {
        const next = eraseAt(local, pt)
        setLocal(next)
        refs.localRef.current = next
        scheduleInkRedraw(eraserInkClip(pt, store.eraserSize, pageWidth, pageHeight))
        return
      }

      if (store.activeTool === 'shapes') {
        setShapePoints((prev) => {
          const next = [...prev, pt]
          if (
            e.shiftKey &&
            next.length >= 2 &&
            (store.shapeType === 'line' || store.shapeType === 'arrow')
          ) {
            return snapLineToAxis(next)
          }
          return next
        })
        return
      }

      if (store.activeTool === 'laser') {
        setLaserTrail((t) => [...t.slice(-20), { x: pt.x, y: pt.y }])
        return
      }

      if (currentStroke) {
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, pt],
          width:
            currentStroke.tool === 'pen'
              ? store.penWidth + pt.pressure * 2
              : currentStroke.width,
        })
      }
    },
    [
      interactive,
      store,
      laserPointer,
      tapeStart,
      local,
      selection,
      currentStroke,
      getPoint,
      isPalmTouch,
      scheduleOverlayRedraw,
      scheduleOverlayInteraction,
      scheduleInkRedraw,
      pageWidth,
      pageHeight,
      refs,
      setLaserTrail,
      setDragOffset,
      setLocal,
      setShapePoints,
      setCurrentStroke,
    ],
  )

  const handlePointerUp = useCallback(() => {
    if (!refs.isDrawing.current) return
    refs.isDrawing.current = false

    if (store.activeTool === 'eraser') {
      commit(refs.localRef.current)
      finishGestureHistory(true)
      return
    }

    if (store.activeTool === 'tape' && tapeStart) {
      const end = refs.tapeEndDraftRef.current ?? tapeEnd ?? tapeStart
      refs.tapeEndDraftRef.current = null
      const x = Math.min(tapeStart.x, end.x)
      const y = Math.min(tapeStart.y, end.y)
      const w = Math.max(24, Math.abs(end.x - tapeStart.x))
      const h = Math.max(20, Math.abs(end.y - tapeStart.y))
      const tape: TapeElement = {
        id: createId(),
        x,
        y,
        width: w,
        height: h,
        color: store.tapeColor,
        revealed: false,
        pageId: local.id,
      }
      commit({ ...local, tapes: [...local.tapes, tape] })
      setTapeStart(null)
      setTapeEnd(null)
      finishGestureHistory(true)
      return
    }

    if (refs.isRotatingRef.current) {
      refs.isRotatingRef.current = false
      const base = refs.rotationBaseRef.current
      refs.rotationBaseRef.current = null
      if (base && refs.localRef.current !== base) {
        commit(refs.localRef.current)
        finishGestureHistory(true)
      } else {
        finishGestureHistory(false)
      }
      return
    }

    if (refs.dragStart.current && selection.length) {
      if (dragOffset) {
        commit(applySelectionMove(local, selection, dragOffset))
        finishGestureHistory(true)
      } else {
        finishGestureHistory(false)
      }
      setDragOffset(null)
      refs.dragStart.current = null
      return
    }

    if (store.activeTool === 'lasso') {
      const draft = refs.lassoDraftRef.current
      refs.lassoDraftRef.current = null
      refs.lassoStart.current = null
      setLasso(null)
      if (draft && isMeaningfulSelectionRect(draft)) {
        setSelection(collectSelection(local, draft))
      }
      finishGestureHistory(false)
      return
    }

    if (store.activeTool === 'shapes' && shapePoints.length > 1) {
      const pts =
        store.shapeType === 'line' || store.shapeType === 'arrow'
          ? snapLineToAxis(shapePoints)
          : shapePoints
      const shape = detectShapeFromPoints(
        pts,
        store.shapeType,
        store.penColor,
        store.penWidth,
        local.id,
      )
      if (shape) commit({ ...local, shapes: [...local.shapes, shape] })
      setShapePoints([])
      finishGestureHistory(!!shape)
      return
    }

    if (store.activeTool === 'laser' || laserPointer) {
      setTimeout(() => setLaserTrail([]), 400)
      finishGestureHistory(false)
      return
    }

    if (currentStroke && currentStroke.points.length > 1) {
      const circle = detectCircleStroke(currentStroke.points)
      if (circle && (store.activeTool === 'pen' || store.activeTool === 'pencil')) {
        if (scribbleErase && circle.r < 120) {
          commit(eraseStrokesInCircle(local, circle))
          finishGestureHistory(true)
        } else {
          const sel = collectSelectionFromStrokeCircle(local, currentStroke.points)
          if (sel?.length) setSelection(sel)
          finishGestureHistory(false)
        }
        setCurrentStroke(null)
        return
      }

      const held = Date.now() - refs.penStartTime.current >= shapeHoldMs
      const canShape =
        held &&
        (store.activeTool === 'pen' || store.activeTool === 'pencil') &&
        currentStroke.points.length > 8
      if (canShape) {
        const shape = detectShapeFromPoints(
          currentStroke.points,
          store.shapeType,
          currentStroke.color,
          currentStroke.width,
          local.id,
        )
        if (shape) {
          commit({ ...local, shapes: [...local.shapes, shape] })
        } else {
          commit({ ...local, strokes: appendStrokes(local.strokes, currentStroke) })
        }
      } else {
        commit({ ...local, strokes: appendStrokes(local.strokes, currentStroke) })
      }
      finishGestureHistory(true)
    } else {
      finishGestureHistory(false)
    }
    setCurrentStroke(null)
  }, [
    store,
    tapeStart,
    tapeEnd,
    local,
    selection,
    dragOffset,
    shapePoints,
    currentStroke,
    laserPointer,
    shapeHoldMs,
    scribbleErase,
    commit,
    finishGestureHistory,
    refs,
    setTapeStart,
    setTapeEnd,
    setDragOffset,
    setLasso,
    setSelection,
    setShapePoints,
    setLaserTrail,
    setCurrentStroke,
  ])

  return { handlePointerDown, handlePointerMove, handlePointerUp, isPalmTouch }
}
