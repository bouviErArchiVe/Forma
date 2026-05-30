import type { DragEvent } from 'react'
import type { FormaCalEvent } from '../../types'
import { autoStatus } from '../../lib/formatcal/model'
import { fmtTime } from '../../lib/formatcal/dates'

interface EventChipProps {
  ev: FormaCalEvent
  compact?: boolean
  onClick?: (ev: FormaCalEvent) => void
  draggable?: boolean
  onDragStart?: (e: DragEvent) => void
}

export function EventChip({ ev, compact, onClick, draggable, onDragStart }: EventChipProps) {
  const st = autoStatus(ev)
  const opacity = st === 'done' ? 0.55 : 1

  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.(ev)
      }}
      className="block w-full text-left rounded-md border-none cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap font-semibold text-forma-ink"
      style={{
        padding: compact ? '2px 6px' : '6px 8px',
        marginBottom: 3,
        borderLeft: `3px solid ${ev.color}`,
        background: `${ev.color}22`,
        fontSize: compact ? 9 : 11,
        opacity,
      }}
    >
      {!ev.allDay && !compact && (
        <span className="opacity-70 mr-1">{fmtTime(ev.startAt)}</span>
      )}
      {ev.icon && <span className="mr-1">{ev.icon}</span>}
      {ev.title}
    </button>
  )
}
