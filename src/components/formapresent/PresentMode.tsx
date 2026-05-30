import { useCallback, useEffect, useState } from 'react'
import { PresentStage } from './PresentStage'
import type { FormaDeck } from '../../types'

interface PresentModeProps {
  deck: FormaDeck
  startIndex?: number
  onClose: () => void
}

export function PresentMode({ deck, startIndex = 0, onClose }: PresentModeProps) {
  const [index, setIndex] = useState(startIndex)
  const [showNotes, setShowNotes] = useState(false)
  const [laserOn, setLaserOn] = useState(false)
  const [laser, setLaser] = useState({ x: 0, y: 0 })

  const slides = deck.slides
  const slide = slides[index]
  const total = slides.length

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= total || next === index) return
      setIndex(next)
    },
    [index, total],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        go(index + 1)
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        go(index - 1)
      }
      if (e.key === 'Escape') onClose()
      if (e.key === 'n' || e.key === 'N') setShowNotes((v) => !v)
      if (e.key === 'l' || e.key === 'L') setLaserOn((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, go, onClose])

  useEffect(() => {
    void document.documentElement.requestFullscreen?.().catch(() => undefined)
    return () => {
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[2000] bg-black flex flex-col"
      onMouseMove={(e) => setLaser({ x: e.clientX, y: e.clientY })}
      onClick={() => go(index + 1)}
    >
      <div
        className="absolute top-3 right-3 flex gap-2 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <NavBtn onClick={() => go(index - 1)} disabled={index === 0}>
          ‹
        </NavBtn>
        <span className="text-white text-sm px-2 py-1">
          {index + 1} / {total}
        </span>
        <NavBtn onClick={() => go(index + 1)} disabled={index >= total - 1}>
          ›
        </NavBtn>
        <NavBtn onClick={() => setShowNotes((v) => !v)} title="Notes (N)">
          📝
        </NavBtn>
        <NavBtn
          onClick={() => setLaserOn((v) => !v)}
          active={laserOn}
          title="Laser (L)"
        >
          🔴
        </NavBtn>
        <NavBtn onClick={onClose} danger>
          ✕
        </NavBtn>
      </div>

      <div className="flex-1 min-h-0" onClick={(e) => e.stopPropagation()}>
        <PresentStage slide={slide ?? null} settings={{ showGrid: false, showGuides: false }} readOnly />
      </div>

      {showNotes && slide?.notes && (
        <div
          className="absolute bottom-16 left-6 right-6 max-w-xl bg-black/85 text-white p-4 rounded-xl text-sm border border-white/15"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[11px] opacity-60 mb-1">Notes présentateur</div>
          {slide.notes}
        </div>
      )}

      {laserOn && (
        <div
          className="fixed pointer-events-none z-[3000] w-4 h-4 rounded-full"
          style={{
            left: laser.x - 8,
            top: laser.y - 8,
            background: 'radial-gradient(circle, rgba(255,50,50,.9) 0%, rgba(255,50,50,0) 70%)',
            boxShadow: '0 0 12px rgba(255,50,50,.8)',
          }}
        />
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/40 text-[11px]">
        ← → naviguer · N notes · L laser · Échap quitter
      </div>
    </div>
  )
}

function NavBtn({
  children,
  onClick,
  disabled,
  active,
  danger,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
  danger?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-white text-sm disabled:opacity-30 ${
        danger ? 'bg-red-500/30' : active ? 'bg-red-500/40' : 'bg-white/10 hover:bg-white/20'
      }`}
    >
      {children}
    </button>
  )
}
