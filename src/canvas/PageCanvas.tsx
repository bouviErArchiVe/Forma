import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { drawRulerOverlay } from '../lib/ruler-overlay'
import { basePageDimensions, displayPageDimensions, unrotatePoint } from '../lib/page-dimensions'
import { hydratePageForRender } from '../lib/assets'
import {
  drawShape,
  type InkClip,
  renderPageBackground,
  renderPageContent,
} from '../lib/page-render'
import { selectionInkClip } from '../lib/dirty-rect'
import { recordOverlayRedraw } from '../lib/canvas-redraw-metrics'
import { pointerEventToPagePoint } from './pointer-utils'
import { buildOverlayInteractionClip } from './overlay-interaction'
import { useCanvasHistory } from './hooks/useCanvasHistory'
import { useCanvasRenderScheduler } from './hooks/useCanvasRenderScheduler'
import { usePageCanvasPointer } from './hooks/usePageCanvasPointer'
import {
  applyColorToSelection,
  deleteSelectionItems,
  drawSelectionBoxes,
  nudgeSelection,
  omitSelectionFromPage,
  pageWithOnlySelection,
  rotateSelection,
  selectAllOnPage,
  scaleSelection,
  selectionBounds,
} from '../lib/selection-engine'
import type { Orientation } from '../types'
import {
  copySelection,
  duplicateSelection,
  hasClipboard,
  pasteClipboard,
} from '../lib/clipboard'
import { detectShapeFromPoints } from '../lib/shape-detect'
import { createPoint, getStrokeBounds } from '../lib/stroke-render'
import { StickerPicker } from '../components/editor/StickerPicker'
import { useEditorStore } from '../stores/editorStore'
import { useSettingsStore } from '../stores/settingsStore'
import type {
  Notebook,
  Page,
  Point,
  SelectionItem,
  Stroke,
  TapeElement,
} from '../types'
import { normalizePage } from '../types'

interface PageCanvasProps {
  page: Page
  onPageChange: (page: Page) => void
  scale?: number
  orientation?: Orientation
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void
  onWheelZoom?: (delta: number) => void
  onOcrSelection?: (text: string) => void
  onAddToStudy?: (text: string) => void
  onPdfNavigate?: (pageIndex: number) => void
  /** Surligne un bloc texte (recherche in-document) */
  searchHighlightTextId?: string
  /** Source du hit recherche (encre / PDF sans bloc texte) */
  searchHighlightSource?: 'text' | 'pdf' | 'ink'
  /** Recharge le canvas quand le contenu change côté DB (même page.id) */
  pageSyncKey?: number
  /** Mode présentateur : pointeur laser uniquement */
  laserPointer?: boolean
  /** false = affichage seul (défilement continu) */
  interactive?: boolean
  /** Source PDF du carnet (rendu lazy des pages PDF) */
  pdfSourceDataUrl?: string
  notebook?: Notebook | null
}

export type PageCanvasHandle = {
  undo: () => void
  redo: () => void
  openStickerPicker: () => void
  /** Recharge l’état affiché (ex. restauration d’une version) */
  reload: (page: Page) => void
}

export const PageCanvas = forwardRef<PageCanvasHandle, PageCanvasProps>(function PageCanvas(
  {
    page,
    onPageChange,
    scale = 1,
    orientation = 'portrait',
    onUndoRedoChange,
    onWheelZoom,
    onOcrSelection,
    onAddToStudy,
    onPdfNavigate,
    searchHighlightTextId,
    searchHighlightSource,
    pageSyncKey = 0,
    laserPointer = false,
    interactive = true,
    pdfSourceDataUrl,
    notebook = null,
  },
  ref,
) {
  const logical = basePageDimensions(orientation)
  const display = displayPageDimensions(orientation, page.rotation ?? 0)
  const PAGE_WIDTH = logical.width
  const PAGE_HEIGHT = logical.height
  const bgRef = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)

  const { historyRef, notifyHistory, finishGestureHistory, resetHistory } =
    useCanvasHistory(onUndoRedoChange)

  const [local, setLocal] = useState(() => normalizePage(page))
  const localRef = useRef(local)
  useEffect(() => {
    localRef.current = local
  }, [local])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [shapePoints, setShapePoints] = useState<Point[]>([])
  const [lasso, setLasso] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [selection, setSelection] = useState<SelectionItem[]>([])
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [laserTrail, setLaserTrail] = useState<{ x: number; y: number }[]>([])
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [tapeStart, setTapeStart] = useState<Point | null>(null)
  const [tapeEnd, setTapeEnd] = useState<Point | null>(null)
  const [pendingSticker, setPendingSticker] = useState<string | null>(null)
  const [showStickerPicker, setShowStickerPicker] = useState(false)

  const isDrawing = useRef(false)
  const lassoStart = useRef<Point | null>(null)
  const lassoDraftRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const tapeEndDraftRef = useRef<Point | null>(null)
  const dragStart = useRef<Point | null>(null)
  const penStartTime = useRef(0)
  const resizeRef = useRef<{
    kind: 'image' | 'sticker' | 'group'
    id?: string
    anchorX: number
    anchorY: number
    origW: number
    origH: number
  } | null>(null)
  const groupScaleBaseRef = useRef<Page | null>(null)
  const isRotatingRef = useRef(false)
  const rotationBaseRef = useRef<Page | null>(null)
  const rotationStartAngleRef = useRef(0)
  const prevLassoRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const {
    paintInkLayerRef,
    paintOverlayRef,
    scheduleInkRedraw,
    scheduleOverlayRedraw,
  } = useCanvasRenderScheduler(PAGE_WIDTH, PAGE_HEIGHT)

  const store = useEditorStore()
  const { palmRejection, fingerScroll, shapeHoldMs, gridSnap, scribbleErase, showRuler } =
    useSettingsStore()

  useEffect(() => {
    const p = normalizePage(page)
    setLocal(p)
    resetHistory()
    setSelection([])
    setEditingTextId(null)
  }, [page.id, pageSyncKey, resetHistory])

  useEffect(() => {
    if (store.activeTool === 'elements') setShowStickerPicker(true)
  }, [store.activeTool])

  useEffect(() => {
    setSelection([])
    setDragOffset(null)
    dragStart.current = null
  }, [store.activeTool])

  const commit = useCallback(
    (next: Page, recordHistory = true) => {
      const normalized = normalizePage(next)
      if (recordHistory && !historyRef.current.isBatching()) {
        historyRef.current.push(localRef.current)
      }
      setLocal(normalized)
      localRef.current = normalized
      onPageChange(normalized)
      notifyHistory()
    },
    [onPageChange, notifyHistory],
  )

  const performUndo = useCallback(() => {
    const hist = historyRef.current
    const prev = hist.undoState(local)
    if (prev) {
      setLocal(prev)
      onPageChange(prev)
      notifyHistory()
    }
  }, [local, onPageChange, notifyHistory])

  const performRedo = useCallback(() => {
    const hist = historyRef.current
    const next = hist.redoState(local)
    if (next) {
      setLocal(next)
      onPageChange(next)
      notifyHistory()
    }
  }, [local, onPageChange, notifyHistory])

  const reloadPage = useCallback(
    (p: Page) => {
      const normalized = normalizePage(p)
      setLocal(normalized)
      localRef.current = normalized
      resetHistory()
      setSelection([])
      setEditingTextId(null)
      onPageChange(normalized)
    },
    [onPageChange, resetHistory],
  )

  useImperativeHandle(
    ref,
    () => ({
      undo: performUndo,
      redo: performRedo,
      openStickerPicker: () => setShowStickerPicker(true),
      reload: reloadPage,
    }),
    [performUndo, performRedo, reloadPage],
  )

  const bgDirtyRef = useRef(true)
  const hydratedPageRef = useRef<Page>(local)
  const resolvedPdfSourceRef = useRef<string | undefined>(pdfSourceDataUrl)

  const invalidateBackground = useCallback(() => {
    bgDirtyRef.current = true
  }, [])

  useEffect(() => {
    invalidateBackground()
  }, [
    local.id,
    local.template,
    local.pdfPageIndex,
    local.pdfDataUrl,
    local.pdfAssetId,
    local.rotation,
    pageSyncKey,
    invalidateBackground,
  ])

  const paintOverlay = useCallback(
    (partialClip?: InkClip) => {
    const overlay = overlayRef.current
    if (!overlay) return
    const w = PAGE_WIDTH
    const h = PAGE_HEIGHT
    const oCtx = overlay.getContext('2d')!
    const lassoRect = lassoDraftRef.current ?? lasso
    const selBounds =
      selection.length ?
        selectionBounds(hydratedPageRef.current, selection, dragOffset ?? undefined)
      : null
    const tapePreviewEnd = tapeEndDraftRef.current ?? tapeEnd
    const tapePreview =
      tapeStart && tapePreviewEnd && store.activeTool === 'tape' ?
        {
          x: Math.min(tapeStart.x, tapePreviewEnd.x),
          y: Math.min(tapeStart.y, tapePreviewEnd.y),
          w: Math.abs(tapePreviewEnd.x - tapeStart.x),
          h: Math.abs(tapePreviewEnd.y - tapeStart.y),
        }
      : null
    const dragGhost =
      dragOffset && selBounds ?
        {
          x: selBounds.x + dragOffset.x,
          y: selBounds.y + dragOffset.y,
          w: selBounds.w,
          h: selBounds.h,
        }
      : null
    const dirty =
      partialClip ??
      buildOverlayInteractionClip(
        {
          lasso: lassoRect,
          prevLasso: prevLassoRectRef.current,
          selection,
          page: hydratedPageRef.current,
          dragOffset,
          tapePreview,
          dragGhostBounds: dragGhost,
        },
        12,
        PAGE_WIDTH,
        PAGE_HEIGHT,
      )
    if (dirty && dirty.w * dirty.h < w * h * 0.92) {
      recordOverlayRedraw('partial', dirty, PAGE_WIDTH, PAGE_HEIGHT)
      oCtx.clearRect(dirty.x, dirty.y, dirty.w, dirty.h)
    } else {
      recordOverlayRedraw('full', undefined, PAGE_WIDTH, PAGE_HEIGHT)
      oCtx.clearRect(0, 0, w, h)
    }
    if (lassoRect) {
      oCtx.strokeStyle = '#2563eb'
      oCtx.setLineDash([6, 4])
      oCtx.strokeRect(lassoRect.x, lassoRect.y, lassoRect.w, lassoRect.h)
      oCtx.setLineDash([])
    }
    if (tapeStart && tapePreviewEnd && store.activeTool === 'tape') {
      oCtx.fillStyle = store.tapeColor
      oCtx.globalAlpha = 0.45
      const x = Math.min(tapeStart.x, tapePreviewEnd.x)
      const y = Math.min(tapeStart.y, tapePreviewEnd.y)
      oCtx.fillRect(
        x,
        y,
        Math.abs(tapePreviewEnd.x - tapeStart.x),
        Math.abs(tapePreviewEnd.y - tapeStart.y),
      )
      oCtx.globalAlpha = 1
    }
    drawSelectionBoxes(oCtx, hydratedPageRef.current, selection, dragOffset ?? undefined)
    if (dragOffset && selection.length) {
      oCtx.save()
      oCtx.globalAlpha = 0.88
      oCtx.translate(dragOffset.x, dragOffset.y)
      renderPageContent(
        oCtx,
        pageWithOnlySelection(hydratedPageRef.current, selection),
        w,
        h,
      )
      oCtx.restore()
    }
    if (searchHighlightTextId) {
      const t = hydratedPageRef.current.texts.find((x) => x.id === searchHighlightTextId)
      if (t) {
        oCtx.fillStyle = 'rgba(250, 204, 21, 0.5)'
        oCtx.strokeStyle = '#ca8a04'
        oCtx.lineWidth = 2
        oCtx.fillRect(t.x, t.y, t.width, Math.max(t.height, 40))
        oCtx.strokeRect(t.x, t.y, t.width, Math.max(t.height, 40))
      }
    } else if (searchHighlightSource === 'pdf' || searchHighlightSource === 'ink') {
      oCtx.fillStyle = 'rgba(250, 204, 21, 0.35)'
      oCtx.fillRect(0, 0, w, 56)
      oCtx.fillStyle = '#92400e'
      oCtx.font = '14px system-ui, sans-serif'
      oCtx.fillText(
        searchHighlightSource === 'ink' ? 'Correspondance manuscrit (OCR)' : 'Correspondance texte PDF',
        12,
        32,
      )
    }
    if (showRuler) drawRulerOverlay(oCtx, w, h)
    prevLassoRectRef.current = lassoRect ? { ...lassoRect } : null
  },
  [
    lasso,
    selection,
    tapeStart,
    tapeEnd,
    store.activeTool,
    store.tapeColor,
    searchHighlightTextId,
    searchHighlightSource,
    showRuler,
    dragOffset,
    PAGE_WIDTH,
    PAGE_HEIGHT,
  ])

  paintOverlayRef.current = paintOverlay

  const paintInkLayer = useCallback(
    (clip?: InkClip) => {
      const draw = drawRef.current
      if (!draw) return
      const dCtx = draw.getContext('2d')!
      const page =
        dragOffset && selection.length
          ? omitSelectionFromPage(hydratedPageRef.current, selection)
          : hydratedPageRef.current
      const pad = 28
      if (clip) {
        const cx = Math.max(0, clip.x - pad)
        const cy = Math.max(0, clip.y - pad)
        const cw = Math.min(PAGE_WIDTH - cx, clip.w + pad * 2)
        const ch = Math.min(PAGE_HEIGHT - cy, clip.h + pad * 2)
        dCtx.clearRect(cx, cy, cw, ch)
        renderPageContent(dCtx, page, PAGE_WIDTH, PAGE_HEIGHT, {
          extraStroke: currentStroke,
          laserTrail,
          inkOnly: true,
          clip: { x: cx, y: cy, w: cw, h: ch },
        })
      } else {
        dCtx.clearRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
        renderPageContent(dCtx, page, PAGE_WIDTH, PAGE_HEIGHT, {
          extraStroke: currentStroke,
          laserTrail,
        })
      }
      if (shapePoints.length > 1 && store.activeTool === 'shapes') {
        const preview = detectShapeFromPoints(
          shapePoints,
          store.shapeType,
          store.penColor,
          store.penWidth,
          page.id,
        )
        if (preview) drawShape(dCtx, preview)
      }
    },
    [currentStroke, laserTrail, shapePoints, store.activeTool, store.shapeType, store.penColor, store.penWidth, dragOffset, selection, PAGE_WIDTH, PAGE_HEIGHT],
  )

  paintInkLayerRef.current = paintInkLayer

  useEffect(() => {
    if (!dragOffset) return
    const clip = selectionInkClip(
      hydratedPageRef.current,
      selection,
      dragOffset,
      28,
      PAGE_WIDTH,
      PAGE_HEIGHT,
    )
    scheduleInkRedraw(clip)
    scheduleOverlayRedraw()
  }, [dragOffset, selection, scheduleInkRedraw, scheduleOverlayRedraw, PAGE_WIDTH, PAGE_HEIGHT])

  const redraw = useCallback(async () => {
    const bg = bgRef.current
    const draw = drawRef.current
    if (!bg || !draw) return
    const w = PAGE_WIDTH
    const h = PAGE_HEIGHT
    const hydrated = await hydratePageForRender(local, notebook)
    hydratedPageRef.current = hydrated.page
    resolvedPdfSourceRef.current = hydrated.pdfSourceDataUrl ?? pdfSourceDataUrl

    if (bgDirtyRef.current) {
      const bgCtx = bg.getContext('2d')!
      await renderPageBackground(bgCtx, hydrated.page, w, h, {
        pdfSourceDataUrl: resolvedPdfSourceRef.current,
        notebook,
      })
      bgDirtyRef.current = false
    }
    paintInkLayerRef.current()
    paintOverlayRef.current()
  }, [local, notebook, pdfSourceDataUrl, PAGE_WIDTH, PAGE_HEIGHT])

  useEffect(() => {
    void redraw()
  }, [redraw])

  useEffect(() => {
    paintOverlayRef.current()
  }, [selection, searchHighlightTextId, searchHighlightSource, showRuler])

  useEffect(() => {
    if (shapePoints.length <= 1) return
    scheduleInkRedraw()
  }, [shapePoints, scheduleInkRedraw])

  useEffect(() => {
    if (!currentStroke || currentStroke.points.length < 2) return
    const b = getStrokeBounds(currentStroke)
    scheduleInkRedraw({
      x: b.minX,
      y: b.minY,
      w: b.maxX - b.minX,
      h: b.maxY - b.minY,
    })
  }, [currentStroke, scheduleInkRedraw])

  const scheduleOverlayInteraction = useCallback(() => {
    const clip = buildOverlayInteractionClip(
      {
        lasso: lassoDraftRef.current ?? lasso,
        prevLasso: prevLassoRectRef.current,
        selection,
        page: hydratedPageRef.current,
        dragOffset,
        tapePreview: null,
        dragGhostBounds: null,
      },
      12,
      PAGE_WIDTH,
      PAGE_HEIGHT,
    )
    scheduleOverlayRedraw(clip)
  }, [lasso, selection, dragOffset, scheduleOverlayRedraw, PAGE_WIDTH, PAGE_HEIGHT])

  const getPoint = (e: React.PointerEvent): Point =>
    pointerEventToPagePoint(e, drawRef.current!, {
      pageWidth: PAGE_WIDTH,
      pageHeight: PAGE_HEIGHT,
      rotation: (local.rotation ?? 0) as 0 | 90 | 180 | 270,
      gridSnap,
    })

  const hitTextAt = (pt: Point) =>
    local.texts.find(
      (t) => pt.x >= t.x && pt.x <= t.x + t.width && pt.y >= t.y && pt.y <= t.y + t.height,
    )

  const hitTape = (pt: Point): TapeElement | undefined => {
    return [...local.tapes].reverse().find(
      (t) =>
        pt.x >= t.x &&
        pt.x <= t.x + t.width &&
        pt.y >= t.y &&
        pt.y <= t.y + t.height,
    )
  }

  const { handlePointerDown, handlePointerMove, handlePointerUp } = usePageCanvasPointer({
    refs: {
      drawRef,
      isDrawing,
      lassoStart,
      lassoDraftRef,
      tapeEndDraftRef,
      dragStart,
      penStartTime,
      isRotatingRef,
      rotationBaseRef,
      rotationStartAngleRef,
      localRef,
      historyRef,
    },
    interactive,
    laserPointer,
    palmRejection,
    fingerScroll,
    shapeHoldMs,
    scribbleErase,
    store,
    pageWidth: PAGE_WIDTH,
    pageHeight: PAGE_HEIGHT,
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
  })

  const deleteSelection = () => {
    if (!selection.length) return
    commit(deleteSelectionItems(local, selection))
    setSelection([])
  }

  const copySel = () => {
    copySelection(local, selection)
  }

  const pasteAtCenter = () => {
    if (!hasClipboard()) return
    void pasteClipboard(local, PAGE_WIDTH / 2 - 100, PAGE_HEIGHT / 2 - 80).then((p) =>
      commit(p),
    )
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) performRedo()
        else performUndo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selection.length) {
        e.preventDefault()
        copySel()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        pasteAtCenter()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selection.length) {
        e.preventDefault()
        void duplicateSelection(local, selection).then((p) => {
          commit(p)
          setSelection([])
        })
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'a' &&
        useEditorStore.getState().activeTool === 'lasso'
      ) {
        e.preventDefault()
        setSelection(selectAllOnPage(local))
      }
      if (e.key === 'Escape') setSelection([])
      if (
        selection.length &&
        useEditorStore.getState().activeTool === 'lasso' &&
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
      ) {
        e.preventDefault()
        const step = e.shiftKey ? 32 : 8
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0
        commit(nudgeSelection(local, selection, dx, dy))
      }
      if (
        selection.length &&
        useEditorStore.getState().activeTool === 'lasso' &&
        (e.key === '[' || e.key === ']')
      ) {
        e.preventDefault()
        const step = (Math.PI / 180) * (e.shiftKey ? 45 : 15)
        const angle = e.key === '[' ? -step : step
        commit(rotateSelection(local, selection, angle))
      }
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const editingText = local.texts.find((t) => t.id === editingTextId)
  const displayW = display.width * scale
  const displayH = display.height * scale

  return (
    <div
      className="relative shadow-lg"
      style={{ width: displayW, height: displayH }}
      onWheel={(e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          onWheelZoom?.(e.deltaY > 0 ? -0.05 : 0.05)
        }
      }}
    >
      <canvas ref={bgRef} width={PAGE_WIDTH} height={PAGE_HEIGHT} className="absolute inset-0 w-full h-full rounded-sm" />
      <canvas
        ref={drawRef}
        data-testid="page-draw-canvas"
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        className="absolute inset-0 w-full h-full touch-none"
        style={{
          cursor: !interactive
            ? 'default'
            : store.readMode
              ? 'default'
              : store.activeTool === 'eraser'
                ? 'cell'
                : 'crosshair',
          pointerEvents: interactive ? 'auto' : 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={(e) => {
          if (store.readMode) return
          const canvas = drawRef.current
          if (!canvas) return
          const rect = canvas.getBoundingClientRect()
          const raw = unrotatePoint(
            ((e.clientX - rect.left) / rect.width) * PAGE_WIDTH,
            ((e.clientY - rect.top) / rect.height) * PAGE_HEIGHT,
            local.rotation ?? 0,
            PAGE_WIDTH,
            PAGE_HEIGHT,
          )
          const pt = createPoint(raw.x, raw.y, 0.5)
          const existing = hitTextAt(pt)
          if (existing) setEditingTextId(existing.id)
        }}
      />
      <canvas ref={overlayRef} width={PAGE_WIDTH} height={PAGE_HEIGHT} className="absolute inset-0 w-full h-full pointer-events-none" />

      {editingText && (
        <textarea
          className="absolute border-2 border-forma-accent rounded bg-white/95 p-2 resize shadow-lg text-left"
          style={{
            left: `${(editingText.x / PAGE_WIDTH) * 100}%`,
            top: `${(editingText.y / PAGE_HEIGHT) * 100}%`,
            width: `${(editingText.width / PAGE_WIDTH) * 100}%`,
            minHeight: 80,
            fontSize: editingText.fontSize,
            color: editingText.color,
          }}
          value={editingText.content}
          autoFocus
          onChange={(e) => {
            const content = e.target.value
            setLocal({
              ...local,
              texts: local.texts.map((t) =>
                t.id === editingText.id ? { ...t, content } : t,
              ),
            })
          }}
          onBlur={() => {
            commit(local)
            setEditingTextId(null)
          }}
        />
      )}

      {showStickerPicker && (
        <StickerPicker
          onPick={(id) => {
            setPendingSticker(id)
            setShowStickerPicker(false)
          }}
          onClose={() => setShowStickerPicker(false)}
        />
      )}
      {pendingSticker && (
        <div className="absolute top-2 left-2 text-xs bg-amber-100 px-2 py-1 rounded">
          Cliquez sur la page pour placer l’élément
        </div>
      )}
      {selection.length > 0 && (
        <div className="absolute top-2 right-2 flex flex-wrap gap-1 bg-white rounded-lg shadow-md p-1 border border-forma-border max-w-[240px]">
          <button type="button" className="px-2 py-1 text-xs hover:bg-gray-100 rounded" onClick={copySel}>
            Copier
          </button>
          <button type="button" className="px-2 py-1 text-xs hover:bg-gray-100 rounded" onClick={pasteAtCenter} disabled={!hasClipboard()}>
            Coller
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
            onClick={() => {
              void duplicateSelection(local, selection).then((p) => {
                commit(p)
                setSelection([])
              })
            }}
          >
            Dupliquer
          </button>
          <button type="button" className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded" onClick={deleteSelection}>
            Supprimer
          </button>
          <button
            type="button"
            className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
            onClick={() => commit(applyColorToSelection(local, selection, store.penColor))}
          >
            Couleur
          </button>
          {onOcrSelection && (
            <button
              type="button"
              className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
              onClick={async () => {
                const b = selectionBounds(local, selection)
                if (!b) return
                const { ocrRegion } = await import('../lib/ocr')
                const text = await ocrRegion(local, b.x, b.y, b.w, b.h)
                onOcrSelection(text)
              }}
            >
              → Texte
            </button>
          )}
          {onAddToStudy && (
            <button
              type="button"
              className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
              onClick={async () => {
                const b = selectionBounds(local, selection)
                if (!b) return
                const { ocrRegion } = await import('../lib/ocr')
                const text = await ocrRegion(local, b.x, b.y, b.w, b.h)
                if (text.trim()) onAddToStudy(text)
              }}
            >
              → Study
            </button>
          )}
          <button type="button" className="px-2 py-1 text-xs hover:bg-gray-100 rounded" onClick={() => setSelection([])}>
            OK
          </button>
        </div>
      )}
      {store.readMode && local.tapes.length > 0 && (
        <div className="absolute top-2 left-2 flex gap-1 z-10 print-hide">
          {local.tapes.some((t) => !t.revealed) && (
            <button
              type="button"
              className="text-[10px] px-2 py-1 bg-amber-100 rounded shadow border"
              onClick={() =>
                commit({
                  ...local,
                  tapes: local.tapes.map((t) => ({ ...t, revealed: true })),
                })
              }
            >
              Révéler rubans
            </button>
          )}
          {local.tapes.some((t) => t.revealed) && (
            <button
              type="button"
              className="text-[10px] px-2 py-1 bg-gray-100 rounded shadow border"
              onClick={() =>
                commit({
                  ...local,
                  tapes: local.tapes.map((t) => ({ ...t, revealed: false })),
                })
              }
            >
              Masquer rubans
            </button>
          )}
        </div>
      )}
      {store.readMode &&
        local.pdfLinks?.map((link, i) => {
          const style = {
            left: `${(link.x / PAGE_WIDTH) * 100}%`,
            top: `${(link.y / PAGE_HEIGHT) * 100}%`,
            width: `${(link.width / PAGE_WIDTH) * 100}%`,
            height: `${(link.height / PAGE_HEIGHT) * 100}%`,
          }
          if (link.targetPageIndex != null && onPdfNavigate) {
            return (
              <button
                key={i}
                type="button"
                className="absolute z-10 border border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/25 rounded-sm text-[10px] text-violet-800 dark:text-violet-200"
                style={style}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onPdfNavigate(link.targetPageIndex!)}
                title={`Aller à la page ${link.targetPageIndex + 1}`}
              >
                p.{link.targetPageIndex + 1}
              </button>
            )
          }
          if (link.url) {
            return (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute z-10 border border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/25 rounded-sm"
                style={style}
                onPointerDown={(e) => e.stopPropagation()}
                title={link.url}
              />
            )
          }
          return null
        })}
      {selection.length > 1 && store.activeTool === 'lasso' && !store.readMode && (() => {
        const b = selectionBounds(local, selection)
        if (!b) return null
        const handle = 10
        return (
          <div
            className="absolute bg-forma-accent border-2 border-white rounded-sm cursor-se-resize touch-none z-20"
            style={{
              left: `${((b.x + b.w - handle / 2) / PAGE_WIDTH) * 100}%`,
              top: `${((b.y + b.h - handle / 2) / PAGE_HEIGHT) * 100}%`,
              width: handle,
              height: handle,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              e.currentTarget.setPointerCapture(e.pointerId)
              groupScaleBaseRef.current = localRef.current
              historyRef.current.beginBatch(localRef.current)
              resizeRef.current = {
                kind: 'group',
                anchorX: b.x,
                anchorY: b.y,
                origW: Math.max(b.w, 1),
                origH: Math.max(b.h, 1),
              }
            }}
            onPointerMove={(e) => {
              const r = resizeRef.current
              const base = groupScaleBaseRef.current
              if (!r || r.kind !== 'group' || !base) return
              const canvas = drawRef.current
              if (!canvas) return
              const rect = canvas.getBoundingClientRect()
              const px = ((e.clientX - rect.left) / rect.width) * PAGE_WIDTH
              const py = ((e.clientY - rect.top) / rect.height) * PAGE_HEIGHT
              const scale = Math.max(
                0.15,
                Math.max((px - r.anchorX) / r.origW, (py - r.anchorY) / r.origH),
              )
              const next = scaleSelection(base, selection, { x: r.anchorX, y: r.anchorY }, scale)
              setLocal(next)
              localRef.current = next
            }}
            onPointerUp={() => {
              if (resizeRef.current?.kind === 'group') {
                commit(localRef.current)
                finishGestureHistory(true)
                resizeRef.current = null
                groupScaleBaseRef.current = null
              }
            }}
          />
        )
      })()}
      {selection.length === 1 && selection[0].kind === 'image' && !store.readMode && (() => {
        const img = local.images.find((i) => i.id === selection[0].id)
        if (!img) return null
        const handle = 10
        return (
          <div
            className="absolute bg-forma-accent border-2 border-white rounded-sm cursor-se-resize touch-none z-10"
            style={{
              left: `${((img.x + img.width - handle / 2) / PAGE_WIDTH) * 100}%`,
              top: `${((img.y + img.height - handle / 2) / PAGE_HEIGHT) * 100}%`,
              width: handle,
              height: handle,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              e.currentTarget.setPointerCapture(e.pointerId)
              historyRef.current.beginBatch(localRef.current)
              resizeRef.current = {
                kind: 'image',
                id: img.id,
                anchorX: img.x,
                anchorY: img.y,
                origW: img.width,
                origH: img.height,
              }
            }}
            onPointerMove={(e) => {
              const r = resizeRef.current
              if (!r || r.kind !== 'image' || r.id !== img.id) return
              const canvas = drawRef.current
              if (!canvas) return
              const rect = canvas.getBoundingClientRect()
              const px = ((e.clientX - rect.left) / rect.width) * PAGE_WIDTH
              const py = ((e.clientY - rect.top) / rect.height) * PAGE_HEIGHT
              const w = Math.max(40, px - r.anchorX)
              const h = Math.max(40, py - r.anchorY)
              setLocal((prev) => {
                const next = {
                  ...prev,
                  images: prev.images.map((i) =>
                    i.id === r.id ? { ...i, width: w, height: h } : i,
                  ),
                }
                localRef.current = next
                return next
              })
            }}
            onPointerUp={() => {
              if (resizeRef.current?.kind === 'image' && resizeRef.current.id === img.id) {
                commit(localRef.current)
                finishGestureHistory(true)
                resizeRef.current = null
              }
            }}
          />
        )
      })()}
      {selection.length === 1 && selection[0].kind === 'sticker' && !store.readMode && (() => {
        const st = local.stickers.find((s) => s.id === selection[0].id)
        if (!st) return null
        const handle = 10
        return (
          <div
            className="absolute bg-forma-accent border-2 border-white rounded-sm cursor-se-resize touch-none z-10"
            style={{
              left: `${((st.x + st.size - handle / 2) / PAGE_WIDTH) * 100}%`,
              top: `${((st.y + st.size - handle / 2) / PAGE_HEIGHT) * 100}%`,
              width: handle,
              height: handle,
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              e.currentTarget.setPointerCapture(e.pointerId)
              historyRef.current.beginBatch(localRef.current)
              resizeRef.current = {
                kind: 'sticker',
                id: st.id,
                anchorX: st.x,
                anchorY: st.y,
                origW: st.size,
                origH: st.size,
              }
            }}
            onPointerMove={(e) => {
              const r = resizeRef.current
              if (!r || r.kind !== 'sticker' || r.id !== st.id) return
              const canvas = drawRef.current
              if (!canvas) return
              const rect = canvas.getBoundingClientRect()
              const px = ((e.clientX - rect.left) / rect.width) * PAGE_WIDTH
              const py = ((e.clientY - rect.top) / rect.height) * PAGE_HEIGHT
              const size = Math.max(24, Math.max(px - r.anchorX, py - r.anchorY))
              setLocal((prev) => {
                const next = {
                  ...prev,
                  stickers: prev.stickers.map((s) =>
                    s.id === r.id ? { ...s, size } : s,
                  ),
                }
                localRef.current = next
                return next
              })
            }}
            onPointerUp={() => {
              if (resizeRef.current?.kind === 'sticker' && resizeRef.current.id === st.id) {
                commit(localRef.current)
                finishGestureHistory(true)
                resizeRef.current = null
              }
            }}
          />
        )
      })()}
    </div>
  )
})

export { addImageToPage, addStickerToPage } from '../lib/page-mutations'
