import { useEffect, type RefObject } from 'react'

export function usePinchZoom(
  scrollRef: RefObject<HTMLDivElement | null>,
  onZoom: (delta: number) => void,
) {
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let lastDist = 0

    const dist = (t: TouchList) => {
      if (t.length < 2) return 0
      const dx = t[0].clientX - t[1].clientX
      const dy = t[0].clientY - t[1].clientY
      return Math.hypot(dx, dy)
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) lastDist = dist(e.touches)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !lastDist) return
      e.preventDefault()
      const d = dist(e.touches)
      const scale = d / lastDist
      if (Math.abs(scale - 1) > 0.02) {
        onZoom((scale - 1) * 0.15)
        lastDist = d
      }
    }

    const onTouchEnd = () => {
      lastDist = 0
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [scrollRef, onZoom])
}
