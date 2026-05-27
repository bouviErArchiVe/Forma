import { useRef, useCallback } from 'react'

/** Swipe horizontal sur le canvas pour faire défiler les outils. */
export function useSwipeToolCycle({
  enabled = true,
  toolIds = [],
  tool,
  setTool,
  onCycle,
  threshold = 56,
}) {
  const startRef = useRef(null)

  const clear = useCallback(() => {
    startRef.current = null
  }, [])

  const onPointerDown = useCallback((e) => {
    if (!enabled || !toolIds.length) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }, [enabled, toolIds.length])

  const onPointerMove = useCallback((e) => {
    if (!startRef.current || startRef.current.id !== e.pointerId) return
    const dy = Math.abs(e.clientY - startRef.current.y)
    const dx = Math.abs(e.clientX - startRef.current.x)
    if (dy > threshold * 1.2 && dy > dx) clear()
  }, [threshold, clear])

  const onPointerUp = useCallback((e) => {
    if (!enabled || !startRef.current || startRef.current.id !== e.pointerId) {
      clear()
      return
    }
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    clear()
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.25) return

    const idx = toolIds.indexOf(tool)
    if (idx < 0) return
    const nextIdx = dx < 0
      ? (idx + 1) % toolIds.length
      : (idx - 1 + toolIds.length) % toolIds.length
    const next = toolIds[nextIdx]
    if (next && next !== tool) {
      setTool(next)
      onCycle?.(next, dx < 0 ? 1 : -1)
    }
  }, [enabled, toolIds, tool, setTool, onCycle, threshold, clear])

  const onPointerCancel = useCallback(() => clear(), [clear])

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel }
}

export function flattenEditorTools(toolsList) {
  return (toolsList || []).flatMap((g) => g.items.map((i) => i.id))
}
