import { useEffect, useRef } from 'react'

/** Swipe horizontal sur la zone de page pour changer de page (mode page unique). */
export function useSwipePage(
  elRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  onPrev: () => void,
  onNext: () => void,
) {
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null)

  useEffect(() => {
    const el = elRef.current
    if (!el || !enabled) return

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      startRef.current = { x: t.clientX, y: t.clientY, t: Date.now() }
    }

    const onEnd = (e: TouchEvent) => {
      const start = startRef.current
      startRef.current = null
      if (!start || e.changedTouches.length !== 1) return
      const t = e.changedTouches[0]
      const dx = t.clientX - start.x
      const dy = t.clientY - start.y
      const dt = Date.now() - start.t
      if (dt > 500) return
      if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.2) return
      if (dx > 0) onPrev()
      else onNext()
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [elRef, enabled, onPrev, onNext])
}
