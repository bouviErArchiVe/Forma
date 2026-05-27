import { useCallback, useEffect, useState } from 'react'
import PresentStage from './PresentStage'
import { FPR_DARK } from '@/lib/formapresent/constants'

export default function PresentMode({ deck, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const [showNotes, setShowNotes] = useState(false)
  const [laser, setLaser] = useState({ x: 0, y: 0, visible: false })
  const [transitioning, setTransitioning] = useState(false)

  const slides = deck?.slides || []
  const slide = slides[index]
  const total = slides.length

  const go = useCallback((next) => {
    if (next < 0 || next >= total || next === index) return
    setTransitioning(true)
    setTimeout(() => {
      setIndex(next)
      setTransitioning(false)
    }, 300)
  }, [index, total])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(index + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(index - 1) }
      if (e.key === 'Escape') onClose()
      if (e.key === 'n' || e.key === 'N') setShowNotes((v) => !v)
      if (e.key === 'l' || e.key === 'L') setLaser((l) => ({ ...l, visible: !l.visible }))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, go, onClose])

  useEffect(() => {
    try { document.documentElement.requestFullscreen?.() } catch { /* ignore */ }
    return () => { try { if (document.fullscreenElement) document.exitFullscreen() } catch { /* ignore */ } }
  }, [])

  const transition = slide?.transition || 'fade'
  const animClass = transitioning ? `fpr-exit-${transition}` : `fpr-enter-${transition}`

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 2000, display: 'flex', flexDirection: 'column' }}
      onMouseMove={(e) => setLaser({ x: e.clientX, y: e.clientY, visible: laser.visible })}
      onClick={() => go(index + 1)}
    >
      <style>{`
        @keyframes fprFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fprFadeOut { from { opacity: 1 } to { opacity: 0 } }
        @keyframes fprSlideIn { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: none } }
        @keyframes fprSlideOut { from { opacity: 1 } to { opacity: 0; transform: translateX(-40px) } }
        @keyframes fprZoomIn { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: none } }
        @keyframes fprZoomOut { from { opacity: 1 } to { opacity: 0; transform: scale(1.05) } }
        .fpr-enter-fade { animation: fprFadeIn .4s ease }
        .fpr-exit-fade { animation: fprFadeOut .3s ease forwards }
        .fpr-enter-slide { animation: fprSlideIn .4s ease }
        .fpr-exit-slide { animation: fprSlideOut .3s ease forwards }
        .fpr-enter-zoom { animation: fprZoomIn .4s ease }
        .fpr-exit-zoom { animation: fprZoomOut .3s ease forwards }
        .fpr-el-fadeIn { animation: fprFadeIn .6s ease both }
        .fpr-el-slideUp { animation: fprSlideIn .6s ease both }
        .fpr-el-zoomIn { animation: fprZoomIn .6s ease both }
      `}</style>

      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8, zIndex: 10 }} onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} style={navBtn}>‹</button>
        <span style={{ color: '#fff', fontSize: 14, padding: '6px 10px' }}>{index + 1} / {total}</span>
        <button type="button" onClick={() => go(index + 1)} disabled={index >= total - 1} style={navBtn}>›</button>
        <button type="button" onClick={() => setShowNotes((v) => !v)} style={navBtn} title="Notes (N)">📝</button>
        <button type="button" onClick={() => setLaser((l) => ({ ...l, visible: !l.visible }))} style={{ ...navBtn, background: laser.visible ? 'rgba(232,93,93,.4)' : 'rgba(255,255,255,.1)' }} title="Laser (L)">🔴</button>
        <button type="button" onClick={onClose} style={{ ...navBtn, background: 'rgba(233,69,96,.3)' }}>✕</button>
      </div>

      <div className={animClass} style={{ flex: 1, minHeight: 0 }} onClick={(e) => e.stopPropagation()}>
        <PresentStage
          slide={slide ? {
            ...slide,
            elements: (slide.elements || []).map((el) => ({
              ...el,
              _animClass: el.animation && el.animation !== 'none' ? `fpr-el-${el.animation}` : '',
            })),
          } : null}
          settings={{ showGrid: false, showGuides: false }}
          readOnly
        />
      </div>

      {showNotes && slide?.notes && (
        <div style={{
          position: 'absolute', bottom: 60, left: 24, right: 24, maxWidth: 600,
          background: 'rgba(0,0,0,.85)', color: '#fff', padding: 16, borderRadius: 12,
          fontSize: 14, lineHeight: 1.5, border: '1px solid rgba(255,255,255,.15)',
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6 }}>Notes présentateur</div>
          {slide.notes}
        </div>
      )}

      {laser.visible && (
        <div style={{
          position: 'fixed', left: laser.x - 8, top: laser.y - 8,
          width: 16, height: 16, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,50,50,.9) 0%, rgba(255,50,50,0) 70%)',
          pointerEvents: 'none', zIndex: 3000,
          boxShadow: '0 0 12px rgba(255,50,50,.8)',
        }} />
      )}

      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,.4)', fontSize: 11 }}>
        ← → naviguer · N notes · L laser · Échap quitter
      </div>
    </div>
  )
}

const navBtn = {
  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: 'rgba(255,255,255,.1)', color: '#fff', fontSize: 14,
}
