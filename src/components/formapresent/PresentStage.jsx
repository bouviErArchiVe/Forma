import { useCallback, useEffect, useRef, useState } from 'react'
import { SLIDE_SIZE, FPR_DARK } from '@/lib/formapresent/constants'
import { getGuideLines } from '@/lib/formapresent/layout'

function SlideElement({
  el, scale, selected, onSelect, onUpdate, readOnly,
}) {
  const dragRef = useRef(null)
  const [editing, setEditing] = useState(false)

  const style = {
    position: 'absolute',
    left: el.x * scale,
    top: el.y * scale,
    width: el.w * scale,
    height: el.h * scale,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity ?? 1,
    zIndex: el.zIndex || 1,
    cursor: readOnly ? 'default' : 'move',
    outline: selected ? `2px solid ${FPR_DARK.accent}` : 'none',
    outlineOffset: 2,
    boxSizing: 'border-box',
  }

  const handlePointerDown = (e) => {
    if (readOnly || editing) return
    e.stopPropagation()
    onSelect(el.id)
    dragRef.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!dragRef.current || readOnly) return
    const dx = (e.clientX - dragRef.current.x) / scale
    const dy = (e.clientY - dragRef.current.y) / scale
    onUpdate(el.id, { x: dragRef.current.elX + dx, y: dragRef.current.elY + dy })
  }

  const handlePointerUp = (e) => {
    dragRef.current = null
    try { e.currentTarget.releasePointerCapture(e.pointerId) } catch { /* ignore */ }
  }

  if (el.type === 'text') {
    return (
      <div
        style={style}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={() => !readOnly && setEditing(true)}
      >
        {editing ? (
          <textarea
            autoFocus
            value={el.content || ''}
            onChange={(e) => onUpdate(el.id, { content: e.target.value })}
            onBlur={() => setEditing(false)}
            style={{
              width: '100%', height: '100%', border: 'none', background: 'transparent',
              fontSize: (el.fontSize || 32) * scale, fontFamily: el.fontFamily || 'Inter, sans-serif',
              fontWeight: el.bold ? 'bold' : 'normal', color: el.color || '#1a1a1a',
              textAlign: el.align || 'left', resize: 'none', outline: 'none',
            }}
          />
        ) : (
          <div style={{
            fontSize: (el.fontSize || 32) * scale,
            fontFamily: el.fontFamily || 'Inter, sans-serif',
            fontWeight: el.bold ? 'bold' : 'normal',
            color: el.color || '#1a1a1a',
            textAlign: el.align || 'left',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.35,
            pointerEvents: readOnly ? 'none' : 'auto',
          }}>
            {el.content}
          </div>
        )}
      </div>
    )
  }

  if (el.type === 'video') {
    const src = el.dataUrl || el.src
    return (
      <div style={style} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        {src ? (
          <video src={src} controls style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: readOnly ? 'none' : 'auto' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 32 * scale }}>▶</div>
        )}
      </div>
    )
  }

  const src = el.dataUrl || el.src
  return (
    <div style={style} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {src ? (
        <img src={src} alt={el.label || ''} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} draggable={false} />
      ) : (
        <div style={{
          width: '100%', height: '100%', background: '#eee', border: '2px dashed #ccc',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#999', fontSize: 12 * scale,
        }}>
          {el.type === 'embed' ? (el.label || 'Embed') : 'Image'}
        </div>
      )}
    </div>
  )
}

export default function PresentStage({
  slide, settings, selectedElementId, onSelectElement, onUpdateElement, onDeselect, readOnly = false,
}) {
  const containerRef = useRef(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const s = Math.min((width - 48) / SLIDE_SIZE.width, (height - 48) / SLIDE_SIZE.height, 1)
      setScale(Math.max(0.2, s))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const guides = getGuideLines()
  const gridSize = settings?.gridSize || 20
  const showGrid = settings?.showGrid
  const showGuides = settings?.showGuides

  const sorted = [...(slide?.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0c10', overflow: 'hidden', padding: 24,
      }}
      onPointerDown={() => onDeselect?.()}
    >
      {!slide ? (
        <span style={{ color: FPR_DARK.muted }}>Sélectionnez une slide</span>
      ) : (
        <div
          style={{
            width: SLIDE_SIZE.width * scale,
            height: SLIDE_SIZE.height * scale,
            position: 'relative',
            background: slide.bgColor || '#fff',
            backgroundImage: slide.bgImage ? `url(${slide.bgImage})` : undefined,
            backgroundSize: 'cover',
            boxShadow: '0 12px 48px rgba(0,0,0,.5)',
            borderRadius: 4,
            overflow: 'hidden',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {showGrid && (
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.15 }}>
              <defs>
                <pattern id="grid" width={gridSize * scale} height={gridSize * scale} patternUnits="userSpaceOnUse">
                  <path d={`M ${gridSize * scale} 0 L 0 0 0 ${gridSize * scale}`} fill="none" stroke="#666" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          )}
          {showGuides && (
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              {guides.vertical.map((x) => (
                <line key={`v${x}`} x1={x * scale} y1={0} x2={x * scale} y2={SLIDE_SIZE.height * scale} stroke="#6b9fd4" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              ))}
              {guides.horizontal.map((y) => (
                <line key={`h${y}`} x1={0} y1={y * scale} x2={SLIDE_SIZE.width * scale} y2={y * scale} stroke="#6b9fd4" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              ))}
            </svg>
          )}
          {sorted.map((el) => (
            <SlideElement
              key={el.id}
              el={el}
              scale={scale}
              selected={selectedElementId === el.id}
              onSelect={onSelectElement}
              onUpdate={(id, patch) => onUpdateElement?.(slide.id, id, patch)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  )
}
