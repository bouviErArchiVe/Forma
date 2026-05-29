import { useCallback, useEffect, useRef } from 'react'
import { recordInkRedraw } from '../../lib/canvas-redraw-metrics'
import type { InkClip } from '../../lib/page-render'

/** RAF coalescing encre + overlay — extrait de PageCanvas (refactor 0.25.2). */
export function useCanvasRenderScheduler(pageWidth: number, pageHeight: number) {
  const inkRafRef = useRef<number | null>(null)
  const overlayRafRef = useRef<number | null>(null)
  const paintInkLayerRef = useRef<(clip?: InkClip) => void>(() => {})
  const paintOverlayRef = useRef<(partialClip?: InkClip) => void>(() => {})

  const scheduleOverlayRedraw = useCallback((partialClip?: InkClip) => {
    if (overlayRafRef.current != null) return
    overlayRafRef.current = requestAnimationFrame(() => {
      overlayRafRef.current = null
      paintOverlayRef.current(partialClip)
    })
  }, [])

  const scheduleInkRedraw = useCallback(
    (clip?: InkClip) => {
      if (inkRafRef.current != null) cancelAnimationFrame(inkRafRef.current)
      inkRafRef.current = requestAnimationFrame(() => {
        inkRafRef.current = null
        recordInkRedraw(clip, pageWidth, pageHeight)
        paintInkLayerRef.current(clip)
        paintOverlayRef.current(undefined)
      })
    },
    [pageWidth, pageHeight],
  )

  useEffect(() => {
    return () => {
      if (inkRafRef.current != null) cancelAnimationFrame(inkRafRef.current)
      if (overlayRafRef.current != null) cancelAnimationFrame(overlayRafRef.current)
    }
  }, [])

  return {
    inkRafRef,
    overlayRafRef,
    paintInkLayerRef,
    paintOverlayRef,
    scheduleInkRedraw,
    scheduleOverlayRedraw,
  }
}
