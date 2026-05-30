import { useEffect, useRef, useState } from 'react'
import { SLIDE_SIZE } from '../../lib/formapresent/constants'
import { getGuideLines } from '../../lib/formapresent/layout'
import type { FormaDeckSettings, FormaSlide, FormaSlideElement } from '../../types'

interface SlideElementProps {
  el: FormaSlideElement
  scale: number
  selected: boolean
  onSelect: (id: string) => void
  onUpdate: (id: string, patch: Partial<FormaSlideElement>) => void
  readOnly?: boolean
}

function SlideElement({ el, scale, selected, onSelect, onUpdate, readOnly }: SlideElementProps) {
  const dragRef = useRef<{ x: number; y: number; elX: number; elY: number } | null>(null)
  const [editing, setEditing] = useState(false)

  const style: React.CSSProperties = {
    position: 'absolute',
    left: el.x * scale,
    top: el.y * scale,
    width: el.w * scale,
    height: el.h * scale,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity ?? 1,
    zIndex: el.zIndex || 1,
    cursor: readOnly ? 'default' : 'move',
    outline: selected ? '2px solid var(--color-forma-accent, #c8622a)' : 'none',
    outlineOffset: 2,
    boxSizing: 'border-box',
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly || editing) return
    e.stopPropagation()
    onSelect(el.id)
    dragRef.current = { x: e.clientX, y: e.clientY, elX: el.x, elY: el.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || readOnly) return
    const dx = (e.clientX - dragRef.current.x) / scale
    const dy = (e.clientY - dragRef.current.y) / scale
    onUpdate(el.id, { x: dragRef.current.elX + dx, y: dragRef.current.elY + dy })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
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
            className="w-full h-full border-none bg-transparent resize-none outline-none"
            style={{
              fontSize: (el.fontSize || 32) * scale,
              fontFamily: el.fontFamily || 'Inter, sans-serif',
              fontWeight: el.bold ? 'bold' : 'normal',
              color: el.color || '#1a1a1a',
              textAlign: el.align || 'left',
            }}
          />
        ) : (
          <div
            className="whitespace-pre-wrap leading-snug"
            style={{
              fontSize: (el.fontSize || 32) * scale,
              fontFamily: el.fontFamily || 'Inter, sans-serif',
              fontWeight: el.bold ? 'bold' : 'normal',
              color: el.color || '#1a1a1a',
              textAlign: el.align || 'left',
              pointerEvents: readOnly ? 'none' : 'auto',
            }}
          >
            {el.content}
          </div>
        )}
      </div>
    )
  }

  const src = el.dataUrl || el.src
  return (
    <div
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {src ? (
        <img
          src={src}
          alt={el.label || ''}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-neutral-100 border-2 border-dashed border-neutral-300 flex items-center justify-center text-neutral-400 text-xs">
          Image
        </div>
      )}
    </div>
  )
}

interface PresentStageProps {
  slide: FormaSlide | null
  settings?: Partial<FormaDeckSettings>
  selectedElementId?: string | null
  onSelectElement?: (id: string) => void
  onUpdateElement?: (slideId: string, elementId: string, patch: Partial<FormaSlideElement>) => void
  onDeselect?: () => void
  readOnly?: boolean
}

export function PresentStage({
  slide,
  settings,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeselect,
  readOnly = false,
}: PresentStageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect
      const s = Math.min(
        (width - 48) / SLIDE_SIZE.width,
        (height - 48) / SLIDE_SIZE.height,
        1,
      )
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
      className="flex-1 flex items-center justify-center bg-neutral-900 overflow-hidden p-6 min-h-0"
      onPointerDown={() => onDeselect?.()}
    >
      {!slide ? (
        <span className="text-forma-muted">Sélectionnez une slide</span>
      ) : (
        <div
          className="relative rounded shadow-2xl overflow-hidden"
          style={{
            width: SLIDE_SIZE.width * scale,
            height: SLIDE_SIZE.height * scale,
            background: slide.bgColor || '#fff',
            backgroundImage: slide.bgImage ? `url(${slide.bgImage})` : undefined,
            backgroundSize: 'cover',
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {showGrid && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-15">
              <defs>
                <pattern
                  id="present-grid"
                  width={gridSize * scale}
                  height={gridSize * scale}
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d={`M ${gridSize * scale} 0 L 0 0 0 ${gridSize * scale}`}
                    fill="none"
                    stroke="#666"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#present-grid)" />
            </svg>
          )}
          {showGuides && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {guides.vertical.map((x) => (
                <line
                  key={`v${x}`}
                  x1={x * scale}
                  y1={0}
                  x2={x * scale}
                  y2={SLIDE_SIZE.height * scale}
                  stroke="#6b9fd4"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
              ))}
              {guides.horizontal.map((y) => (
                <line
                  key={`h${y}`}
                  x1={0}
                  y1={y * scale}
                  x2={SLIDE_SIZE.width * scale}
                  y2={y * scale}
                  stroke="#6b9fd4"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.5"
                />
              ))}
            </svg>
          )}
          {sorted.map((el) => (
            <SlideElement
              key={el.id}
              el={el}
              scale={scale}
              selected={selectedElementId === el.id}
              onSelect={(id) => onSelectElement?.(id)}
              onUpdate={(id, patch) => slide && onUpdateElement?.(slide.id, id, patch)}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  )
}
