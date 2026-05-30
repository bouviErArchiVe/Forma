import { useRef } from 'react'
import type { ResolvedMoodboardImage } from '../../services/moodboard'

type DragMode = 'move' | 'rotate' | 'nw' | 'ne' | 'se' | 'sw'

interface MoodboardCanvasItemProps {
  image: ResolvedMoodboardImage
  selected: boolean
  onSelect: () => void
  onUpdate: (patch: Partial<ResolvedMoodboardImage>) => void
  onBringToFront: () => void
}

export function MoodboardCanvasItem({
  image,
  selected,
  onSelect,
  onUpdate,
  onBringToFront,
}: MoodboardCanvasItemProps) {
  const dragRef = useRef<{
    mode: DragMode
    startX: number
    startY: number
    ox: number
    oy: number
    ow: number
    oh: number
  } | null>(null)

  const handleMouseDown = (e: React.MouseEvent, mode: DragMode) => {
    e.stopPropagation()
    if (!selected) onSelect()
    onBringToFront()
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      ox: image.x,
      oy: image.y,
      ow: image.w,
      oh: image.h,
    }
    const cx = image.x + image.w / 2
    const cy = image.y + image.h / 2

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = ev.clientX - d.startX
      const dy = ev.clientY - d.startY
      if (d.mode === 'move') {
        onUpdate({ x: d.ox + dx, y: d.oy + dy })
      } else if (d.mode === 'rotate') {
        const angle = (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI
        onUpdate({ rotation: Math.round(angle + 90) })
      } else {
        let nx = d.ox
        let ny = d.oy
        let nw = d.ow
        let nh = d.oh
        const ratio = d.oh / d.ow
        if (d.mode === 'se') {
          nw = Math.max(60, d.ow + dx)
          nh = nw * ratio
        } else if (d.mode === 'sw') {
          nw = Math.max(60, d.ow - dx)
          nx = d.ox + d.ow - nw
          nh = nw * ratio
        } else if (d.mode === 'ne') {
          nw = Math.max(60, d.ow + dx)
          nh = nw * ratio
          ny = d.oy + d.oh - nh
        } else if (d.mode === 'nw') {
          nw = Math.max(60, d.ow - dx)
          nx = d.ox + d.ow - nw
          nh = nw * ratio
          ny = d.oy + d.oh - nh
        }
        onUpdate({ x: nx, y: ny, w: Math.round(nw), h: Math.round(nh) })
      }
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handles: [DragMode, number, number, string][] = [
    ['nw', -4, -4, 'nw-resize'],
    ['ne', image.w - 4, -4, 'ne-resize'],
    ['se', image.w - 4, image.h - 4, 'se-resize'],
    ['sw', -4, image.h - 4, 'sw-resize'],
  ]

  return (
    <div
      onMouseDown={(e) => handleMouseDown(e, 'move')}
      className={`absolute select-none ${selected ? 'ring-2 ring-forma-accent shadow-lg' : ''}`}
      style={{
        left: image.x,
        top: image.y,
        width: image.w,
        height: image.h,
        transform: `rotate(${image.rotation}deg)`,
        zIndex: image.zIndex,
        cursor: selected ? 'move' : 'pointer',
      }}
    >
      {image.url ? (
        <img
          src={image.url}
          alt={image.name}
          className="w-full h-full object-cover rounded pointer-events-none"
          draggable={false}
        />
      ) : (
        <div className="w-full h-full bg-forma-border/40 rounded" />
      )}
      {selected && (
        <>
          {handles.map(([m, rx, ry, cur]) => (
            <div
              key={m}
              onMouseDown={(e) => handleMouseDown(e, m)}
              className="absolute w-2 h-2 bg-white border border-forma-accent rounded-sm"
              style={{ left: rx, top: ry, cursor: cur, zIndex: 2 }}
            />
          ))}
          <div
            onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            className="absolute left-1/2 -top-5 -translate-x-1/2 w-3 h-3 rounded-full bg-forma-accent border-2 border-white cursor-crosshair"
          />
        </>
      )}
    </div>
  )
}
