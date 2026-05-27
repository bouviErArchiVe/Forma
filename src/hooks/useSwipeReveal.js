import { useRef, useState, useCallback } from 'react'

/** Swipe horizontal pour révéler des actions (ex. carte bibliothèque). */
export function useSwipeReveal({ threshold = 68, maxOffset = 96, onTap } = {}) {
  const startRef = useRef(null)
  const [offset, setOffset] = useState(0)
  const [open, setOpen] = useState(false)

  const reset = useCallback(() => {
    setOffset(0)
    setOpen(false)
    startRef.current = null
  }, [])

  const onPointerDown = useCallback((e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    startRef.current = { x: e.clientX, y: e.clientY, base: open ? -maxOffset : 0, id: e.pointerId }
  }, [open, maxOffset])

  const onPointerMove = useCallback((e) => {
    if (!startRef.current || startRef.current.id !== e.pointerId) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.abs(dy) > Math.abs(dx) * 1.5) return
    const next = Math.min(0, Math.max(-maxOffset, startRef.current.base + dx))
    setOffset(next)
  }, [maxOffset])

  const onPointerUp = useCallback((e) => {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    startRef.current = null
    if (Math.abs(dx) < 12 && !open) {
      onTap?.()
      return
    }
    if (offset <= -threshold) {
      setOffset(-maxOffset)
      setOpen(true)
    } else {
      reset()
    }
  }, [offset, threshold, maxOffset, reset, open, onTap])

  const onPointerCancel = useCallback(() => reset(), [reset])

  return {
    offset,
    open,
    reset,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
  }
}
