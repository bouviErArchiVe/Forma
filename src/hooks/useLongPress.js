import { useRef, useCallback } from 'react'

/** Long press + click — pointer events (touch + souris). */
export function useLongPress({ onLongPress, onClick, delay = 480, moveThreshold = 12 } = {}) {
  const timerRef = useRef(null)
  const startRef = useRef(null)
  const longPressedRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return
    longPressedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY }
    clearTimer()
    timerRef.current = setTimeout(() => {
      longPressedRef.current = true
      onLongPress?.(e)
    }, delay)
  }, [delay, onLongPress, clearTimer])

  const onPointerMove = useCallback((e) => {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    if (Math.hypot(dx, dy) > moveThreshold) clearTimer()
  }, [moveThreshold, clearTimer])

  const onPointerUp = useCallback((e) => {
    clearTimer()
    if (!longPressedRef.current) onClick?.(e)
    startRef.current = null
  }, [onClick, clearTimer])

  const onPointerCancel = useCallback(() => {
    clearTimer()
    startRef.current = null
  }, [clearTimer])

  const onContextMenu = useCallback((e) => {
    e.preventDefault()
    longPressedRef.current = true
    onLongPress?.(e)
  }, [onLongPress])

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave: onPointerCancel,
    onPointerCancel,
    onContextMenu,
  }
}
