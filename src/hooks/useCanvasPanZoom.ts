import { useEffect, useRef, useState, type RefObject } from 'react'

export function useCanvasPanZoom(scrollRef: RefObject<HTMLDivElement | null>, enabled = true) {
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const last = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault()
        setSpaceHeld(true)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const el = scrollRef.current
    if (!el) return

    let dragging = false

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return
      if (spaceHeld) {
        e.preventDefault()
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (spaceHeld || e.button === 1) {
        dragging = true
        setIsPanning(true)
        last.current = { x: e.clientX, y: e.clientY }
        el.setPointerCapture(e.pointerId)
      }
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const dx = e.clientX - last.current.x
      const dy = e.clientY - last.current.y
      last.current = { x: e.clientX, y: e.clientY }
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
    }
    const end = () => {
      dragging = false
      setIsPanning(false)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', end)
    el.addEventListener('pointerleave', end)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', end)
      el.removeEventListener('pointerleave', end)
    }
  }, [scrollRef, spaceHeld, enabled])

  return {
    pan,
    cursor: spaceHeld || isPanning ? 'grab' : undefined,
  }
}
