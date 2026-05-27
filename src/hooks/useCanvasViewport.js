import { useState, useRef, useCallback, useEffect } from 'react'
import { clampZoom, zoomAtPoint, ZOOM_DEFAULT, ZOOM_MIN, ZOOM_MAX, computeFitZoom, clampDocumentPan } from '@/lib/viewport'
import { getViewportInPage } from '@/lib/minimap'

const INERTIA_FRICTION = 0.91
const INERTIA_MIN = 0.35

/**
 * Zoom/pan premium : molette trackpad, pinch (ctrl+wheel), pan molette,
 * espace / clic milieu / outil déplacer, inertie au relâchement.
 */
export function useCanvasViewport({
  viewW = 0,
  viewH = 0,
  enabled = true,
  allowPan = true,
  initialZoom = ZOOM_DEFAULT,
  minZoom = ZOOM_MIN,
  maxZoom = ZOOM_MAX,
  documentPage = null,
} = {}) {
  const [zoom, setZoom] = useState(initialZoom)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [panActive, setPanActive] = useState(false)
  const [spacePan, setSpacePan] = useState(false)

  const vpRef = useRef({ zoom: initialZoom, panX: 0, panY: 0 })
  const panning = useRef(false)
  const panStart = useRef(null)
  const panTool = useRef(false)
  const lastPan = useRef({ t: 0, x: 0, y: 0, vx: 0, vy: 0 })
  const inertiaRaf = useRef(null)
  const spaceDown = useRef(false)
  const docRef = useRef(documentPage)
  docRef.current = documentPage

  const clampToPage = useCallback(
    (next) => {
      const doc = docRef.current
      if (!doc?.w || !doc?.h || !viewW || !viewH) return next
      const clamped = clampDocumentPan({
        panX: next.panX,
        panY: next.panY,
        zoom: next.zoom,
        viewW,
        viewH,
        pageW: doc.w,
        pageH: doc.h,
      })
      return { ...next, ...clamped }
    },
    [viewW, viewH],
  )

  const stopInertia = useCallback(() => {
    if (inertiaRaf.current) {
      cancelAnimationFrame(inertiaRaf.current)
      inertiaRaf.current = null
    }
  }, [])

  const apply = useCallback(
    (next, { clamp = true } = {}) => {
      const z = clampZoom(next.zoom, minZoom, maxZoom)
      const merged = clamp ? clampToPage({ ...next, zoom: z }) : { ...next, zoom: z }
      vpRef.current = { zoom: merged.zoom, panX: merged.panX, panY: merged.panY }
      setZoom(merged.zoom)
      setPanX(merged.panX)
      setPanY(merged.panY)
    },
    [minZoom, maxZoom, clampToPage],
  )

  const zoomBy = useCallback(
    (factor, pointer) => {
      stopInertia()
      const v = vpRef.current
      const newZoom = clampZoom(v.zoom * factor, minZoom, maxZoom)
      if (pointer && viewW && viewH) {
        apply(zoomAtPoint({ ...v, viewW, viewH, sx: pointer.x, sy: pointer.y, newZoom }))
      } else if (viewW && viewH) {
        apply(zoomAtPoint({ ...v, viewW, viewH, sx: viewW / 2, sy: viewH / 2, newZoom }))
      } else {
        apply({ ...v, zoom: newZoom })
      }
    },
    [apply, viewW, viewH, minZoom, maxZoom, stopInertia]
  )

  const resetViewport = useCallback(() => {
    stopInertia()
    apply({ zoom: initialZoom, panX: 0, panY: 0 })
  }, [apply, initialZoom, stopInertia])

  const fitToPage = useCallback(
    (pageW, pageH, padding = 48) => {
      stopInertia()
      const z = computeFitZoom({ viewW, viewH, pageW, pageH, padding })
      apply({ zoom: z, panX: 0, panY: 0 }, { clamp: false })
    },
    [apply, viewW, viewH, stopInertia],
  )

  const startInertia = useCallback(() => {
    stopInertia()
    const tick = () => {
      const { vx, vy } = lastPan.current
      if (Math.abs(vx) < INERTIA_MIN && Math.abs(vy) < INERTIA_MIN) {
        inertiaRaf.current = null
        return
      }
      const v = vpRef.current
      apply({ ...v, panX: v.panX + vx, panY: v.panY + vy })
      lastPan.current.vx *= INERTIA_FRICTION
      lastPan.current.vy *= INERTIA_FRICTION
      inertiaRaf.current = requestAnimationFrame(tick)
    }
    if (Math.abs(lastPan.current.vx) >= INERTIA_FRICTION * 4 || Math.abs(lastPan.current.vy) >= INERTIA_FRICTION * 4) {
      inertiaRaf.current = requestAnimationFrame(tick)
    }
  }, [apply, stopInertia])

  const movePan = useCallback(
    (clientX, clientY) => {
      if (!panning.current || !panStart.current) return
      const nx = clientX - panStart.current.x
      const ny = clientY - panStart.current.y
      const now = performance.now()
      const dt = Math.max(1, now - lastPan.current.t)
      lastPan.current.vx = ((nx - lastPan.current.x) / dt) * 16
      lastPan.current.vy = ((ny - lastPan.current.y) / dt) * 16
      lastPan.current.x = nx
      lastPan.current.y = ny
      lastPan.current.t = now
      apply({ ...vpRef.current, panX: nx, panY: ny })
    },
    [apply]
  )

  const beginPan = useCallback(
    (clientX, clientY, { toolMode = false } = {}) => {
      if (!allowPan || !enabled || panning.current) return false
      stopInertia()
      panning.current = true
      panTool.current = toolMode
      panStart.current = { x: clientX - vpRef.current.panX, y: clientY - vpRef.current.panY }
      lastPan.current = { t: performance.now(), x: vpRef.current.panX, y: vpRef.current.panY, vx: 0, vy: 0 }
      setPanActive(true)
      return true
    },
    [allowPan, enabled, stopInertia]
  )

  const endPan = useCallback(
    (withInertia = true) => {
      if (!panning.current) return
      const useInertia = withInertia && panTool.current
      panning.current = false
      panStart.current = null
      panTool.current = false
      setPanActive(false)
      if (useInertia) startInertia()
    },
    [startInertia]
  )

  // Espace = pan temporaire
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return
      const tag = e.target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      spaceDown.current = true
      setSpacePan(true)
    }
    const onKeyUp = (e) => {
      if (e.code !== 'Space') return
      spaceDown.current = false
      setSpacePan(false)
      if (panning.current) endPan(true)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [endPan])

  // Molette / trackpad (non-passive pour preventDefault)
  useEffect(() => {
    const el = document.getElementById('canvas-area')
    if (!el || !enabled) return

    const onWheel = (e) => {
      if (!allowPan) return
      e.preventDefault()
      stopInertia()
      const r = el.getBoundingClientRect()
      const sx = e.clientX - r.left
      const sy = e.clientY - r.top
      const v = vpRef.current

      // Pinch trackpad (ctrl+wheel) ou zoom explicite
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.0022)
        const newZoom = clampZoom(v.zoom * factor, minZoom, maxZoom)
        apply(zoomAtPoint({ ...v, viewW: r.width, viewH: r.height, sx, sy, newZoom }))
        return
      }

      // Scroll = pan (trackpad deux doigts) ou changement de page aux bords
      const doc = docRef.current
      if (doc?.w && doc?.h && (doc.onPrev || doc.onNext)) {
        const vp = getViewportInPage({
          pageW: doc.w,
          pageH: doc.h,
          viewW: r.width,
          viewH: r.height,
          zoom: v.zoom,
          panX: v.panX,
          panY: v.panY,
        })
        const edge = Math.max(12, 40 / v.zoom)
        if (e.deltaY > 0 && vp.y2 >= doc.h - edge && doc.page < doc.pageCount) {
          doc.onNext?.()
          return
        }
        if (e.deltaY < 0 && vp.y1 <= edge && doc.page > 1) {
          doc.onPrev?.()
          return
        }
      }

      apply({ ...v, panX: v.panX - e.deltaX, panY: v.panY - e.deltaY })
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [enabled, allowPan, apply, minZoom, maxZoom, stopInertia])

  useEffect(() => () => stopInertia(), [stopInertia])

  const setPan = useCallback(
    (x, y) => {
      stopInertia()
      apply({ ...vpRef.current, panX: x, panY: y })
    },
    [apply, stopInertia]
  )

  const setZoomDirect = useCallback(
    (z) => {
      stopInertia()
      apply({ ...vpRef.current, zoom: clampZoom(z, minZoom, maxZoom) })
    },
    [apply, minZoom, maxZoom, stopInertia]
  )

  const canvasHandlers = {
    onPointerDownCapture: (e) => {
      if (!enabled || !allowPan) return
      const space = spaceDown.current
      const middle = e.button === 1
      const toolPan = e.button === 0 && e.currentTarget.dataset.panTool === '1'
      if (!middle && !space && !toolPan) return
      if (middle || space) e.preventDefault()
      if (middle || space || toolPan) {
        e.stopPropagation()
        beginPan(e.clientX, e.clientY, { toolMode: toolPan || false })
      }
    },
    onPointerMove: (e) => {
      if (panning.current) movePan(e.clientX, e.clientY)
    },
    onPointerUp: () => {
      endPan(true)
    },
    onPointerLeave: () => {
      endPan(false)
    },
    onMouseDown: (e) => {
      if (!enabled || !allowPan) return
      if (e.currentTarget.dataset.panTool === '1' && e.button === 0) {
        beginPan(e.clientX, e.clientY, { toolMode: true })
      }
    },
    onMouseMove: (e) => {
      if (panning.current) movePan(e.clientX, e.clientY)
    },
    onMouseUp: () => {
      endPan(true)
    },
    onMouseLeave: () => {
      endPan(false)
    },
    onContextMenu: (e) => {
      if (spaceDown.current) e.preventDefault()
    },
  }

  return {
    zoom,
    panX,
    panY,
    panActive,
    spacePan,
    setZoom: setZoomDirect,
    setPanX: (x) => setPan(x, vpRef.current.panY),
    setPanY: (y) => setPan(vpRef.current.panX, y),
    setPan,
    zoomBy,
    resetViewport,
    fitToPage,
    canvasHandlers,
    viewportRef: vpRef,
  }
}
