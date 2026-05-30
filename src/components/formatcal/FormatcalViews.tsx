import type { FormaCalEvent } from '../../types'
import { fmtDate, fmtTime, isSameMonthTs, isToday, monthGrid, weekDays } from '../../lib/formatcal/dates'
import { autoStatus, checklistProgress } from '../../lib/formatcal/model'
import { eventsForDay, eventsForMonth } from '../../lib/formatcal/filters'
import { EventChip } from './EventChip'

interface ViewProps {
  events: FormaCalEvent[]
  onEventClick?: (ev: FormaCalEvent) => void
}

interface MonthProps extends ViewProps {
  cursor: number
  weekStartsOn?: number
  onDayClick?: (ts: number) => void
  onEventDrop?: (id: string, dayTs: number) => void
}

export function FormatcalMonthView({
  cursor,
  events,
  weekStartsOn = 1,
  onDayClick,
  onEventClick,
  onEventDrop,
}: MonthProps) {
  const days = monthGrid(cursor, weekStartsOn)
  const monthEvents = eventsForMonth(events, cursor)
  const weekdayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-2">
      <div className="grid grid-cols-7 gap-px flex-1 min-h-0 overflow-auto content-start">
        {weekdayLabels.map((d) => (
          <div key={d} className="py-1.5 text-[10px] font-bold text-forma-muted text-center">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const ts = day.getTime()
          const dayEv = eventsForDay(monthEvents, ts)
          const inMonth = isSameMonthTs(ts, cursor)
          const today = isToday(ts)
          return (
            <div
              key={ts}
              onClick={() => onDayClick?.(ts)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const id = e.dataTransfer.getData('text/formatcal-event')
                if (id) onEventDrop?.(id, ts)
              }}
              className="min-h-[88px] p-1 rounded-md cursor-pointer border"
              style={{
                background: today ? 'color-mix(in srgb, var(--forma-accent) 12%, transparent)' : undefined,
                borderColor: today ? 'var(--forma-accent)' : 'var(--forma-border)',
                opacity: inMonth ? 1 : 0.45,
              }}
            >
              <div
                className={`text-[11px] mb-1 ${today ? 'font-extrabold text-forma-accent' : 'font-semibold text-forma-ink'}`}
              >
                {day.getDate()}
              </div>
              {dayEv.slice(0, 3).map((ev) => (
                <EventChip
                  key={ev.id}
                  ev={ev}
                  compact
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/formatcal-event', ev.id)}
                  onClick={onEventClick}
                />
              ))}
              {dayEv.length > 3 && (
                <div className="text-[9px] text-forma-muted">+{dayEv.length - 3}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface WeekProps extends ViewProps {
  cursor: number
  weekStartsOn?: number
  onSlotClick?: (ts: number) => void
}

export function FormatcalWeekView({
  cursor,
  events,
  weekStartsOn = 1,
  onEventClick,
  onSlotClick,
}: WeekProps) {
  const days = weekDays(cursor, weekStartsOn)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  return (
    <div className="flex flex-1 min-h-0 overflow-auto">
      <div className="w-11 shrink-0">
        {hours.map((h) => (
          <div key={h} className="h-12 text-[9px] text-forma-muted pt-1 text-right pr-1.5">
            {h}:00
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1 gap-1">
        {days.map((day) => {
          const ts = day.getTime()
          const dayEv = eventsForDay(events, ts).filter((e) => !e.allDay)
          return (
            <div key={ts} className="border-l border-forma-border/50">
              <div
                className={`text-center py-1.5 text-[10px] ${isToday(ts) ? 'font-extrabold text-forma-accent' : 'font-semibold text-forma-muted'}`}
              >
                {fmtDate(ts, 'EEE d')}
              </div>
              <div className="relative" style={{ height: hours.length * 48 }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    onClick={() => {
                      const d = new Date(day)
                      d.setHours(h, 0, 0, 0)
                      onSlotClick?.(d.getTime())
                    }}
                    className="h-12 border-t border-forma-border/20 cursor-pointer"
                  />
                ))}
                {dayEv.map((ev) => {
                  const start = new Date(ev.startAt)
                  const end = new Date(ev.endAt)
                  const top = (((start.getHours() - 7) * 60 + start.getMinutes()) / 60) * 48
                  const h = Math.max(24, ((end.getTime() - start.getTime()) / 3600000) * 48)
                  return (
                    <div
                      key={ev.id}
                      className="absolute left-0.5 right-0.5 z-[2]"
                      style={{ top, height: h }}
                    >
                      <EventChip ev={ev} onClick={onEventClick} />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface DayProps extends ViewProps {
  cursor: number
  onSlotClick?: (ts: number) => void
}

export function FormatcalDayView({ cursor, events, onEventClick, onSlotClick }: DayProps) {
  const dayEv = eventsForDay(events, cursor)
  const hours = Array.from({ length: 16 }, (_, i) => i + 6)

  return (
    <div className="flex-1 overflow-auto px-3">
      <div className="text-base font-extrabold mb-3">{fmtDate(cursor, 'EEEE d MMMM yyyy')}</div>
      {dayEv.filter((e) => e.allDay).map((ev) => (
        <EventChip key={ev.id} ev={ev} onClick={onEventClick} />
      ))}
      {hours.map((h) => {
        const slotStart = new Date(cursor)
        slotStart.setHours(h, 0, 0, 0)
        const slotEnd = slotStart.getTime() + 3600000
        const slotEv = dayEv.filter(
          (e) =>
            !e.allDay && e.startAt < slotEnd && (e.endAt || e.startAt) > slotStart.getTime(),
        )
        return (
          <div key={h} className="flex gap-3 min-h-[52px] border-t border-forma-border/30">
            <div className="w-11 text-[10px] text-forma-muted pt-2">{h}:00</div>
            <div
              className="flex-1 py-1 cursor-pointer"
              onClick={() => onSlotClick?.(slotStart.getTime())}
            >
              {slotEv.map((ev) => (
                <EventChip key={ev.id} ev={ev} onClick={onEventClick} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FormatcalAgendaView({ events, onEventClick }: ViewProps) {
  const sorted = [...events].sort((a, b) => a.startAt - b.startAt)
  let lastDay = ''

  return (
    <div className="flex-1 overflow-auto p-3">
      {sorted.length === 0 && (
        <div className="text-forma-muted text-center py-10">Aucun événement</div>
      )}
      {sorted.map((ev) => {
        const dayKey = fmtDate(ev.startAt, 'yyyy-MM-dd')
        const showHeader = dayKey !== lastDay
        lastDay = dayKey
        const st = autoStatus(ev)
        return (
          <div key={ev.id}>
            {showHeader && (
              <div className="text-xs font-extrabold text-forma-accent my-4 pt-2">
                {fmtDate(ev.startAt, 'EEEE d MMMM')}
              </div>
            )}
            <div
              onClick={() => onEventClick?.(ev)}
              className="flex gap-3 p-3 mb-2 rounded-xl bg-forma-surface border border-forma-border cursor-pointer"
              style={{ borderLeft: `4px solid ${ev.color}` }}
            >
              <div className="text-xl">{ev.icon || '📅'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{ev.title}</div>
                <div className="text-[11px] text-forma-muted mt-0.5">
                  {ev.allDay
                    ? 'Journée entière'
                    : `${fmtTime(ev.startAt)} – ${fmtTime(ev.endAt)}`}
                </div>
                {ev.description && (
                  <div className="text-[11px] text-forma-muted mt-1 opacity-85 line-clamp-2">
                    {ev.description}
                  </div>
                )}
                {ev.checklist?.length > 0 && (
                  <div className="text-[10px] text-forma-accent mt-1">
                    {checklistProgress(ev)}% complété
                  </div>
                )}
              </div>
              <div
                className={`text-[9px] font-bold self-start ${st === 'late' ? 'text-red-500' : 'text-forma-muted'}`}
              >
                {st}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FormatcalTimelineView({ events, onEventClick }: ViewProps) {
  const sorted = [...events].sort((a, b) => a.startAt - b.startAt)
  return (
    <div className="flex-1 overflow-auto py-5 px-6">
      <div className="relative border-l-2 border-forma-border ml-20">
        {sorted.map((ev) => (
          <div key={ev.id} className="relative mb-5 pl-6">
            <div className="absolute -left-[86px] top-1 w-[70px] text-[10px] text-forma-muted text-right">
              {fmtDate(ev.startAt, 'd MMM')}
            </div>
            <div
              className="absolute -left-[7px] top-2 w-3 h-3 rounded-full border-2 border-forma-bg"
              style={{ background: ev.color || 'var(--forma-accent)' }}
            />
            <div
              onClick={() => onEventClick?.(ev)}
              className="p-2.5 rounded-xl bg-forma-surface border border-forma-border cursor-pointer"
            >
              <div className="font-bold text-xs">
                {ev.icon} {ev.title}
              </div>
              <div className="text-[10px] text-forma-muted mt-0.5">
                {fmtTime(ev.startAt)} – {fmtTime(ev.endAt)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ListProps extends ViewProps {
  title: string
}

export function FormatcalListView({ events, title, onEventClick }: ListProps) {
  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="text-sm font-extrabold mb-3">{title}</div>
      {events.length === 0 ? (
        <div className="text-forma-muted text-center py-10">Rien à afficher</div>
      ) : (
        events.map((ev) => <EventChip key={ev.id} ev={ev} onClick={onEventClick} />)
      )}
    </div>
  )
}
