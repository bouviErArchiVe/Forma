import { FC_DARK } from '@/lib/formatcal/constants'
import { autoStatus, checklistProgress } from '@/lib/formatcal/model'
import { fmtDate, fmtTime, isToday, isSameMonthTs, monthGrid, weekDays } from '@/lib/formatcal/dates'
import { eventsForDay, eventsForMonth } from '@/lib/formatcal/filters'

export function EventChip({ ev, compact, onClick, draggable, onDragStart }) {
  const st = autoStatus(ev)
  const opacity = st === 'done' ? 0.55 : 1
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={(e) => { e.stopPropagation(); onClick?.(ev) }}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: compact ? '2px 6px' : '6px 8px',
        marginBottom: 3,
        borderRadius: 6,
        border: 'none',
        borderLeft: `3px solid ${ev.color || FC_DARK.accent}`,
        background: `${ev.color || FC_DARK.accent}22`,
        color: FC_DARK.ink,
        fontSize: compact ? 9 : 11,
        fontWeight: 600,
        cursor: 'pointer',
        opacity,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {!ev.allDay && !compact && <span style={{ opacity: 0.7, marginRight: 4 }}>{fmtTime(ev.startAt)}</span>}
      {ev.icon && <span style={{ marginRight: 3 }}>{ev.icon}</span>}
      {ev.title}
    </button>
  )
}

export function FormatcalMonthView({ cursor, events, weekStartsOn, onDayClick, onEventClick, onEventDrop }) {
  const days = monthGrid(cursor, weekStartsOn)
  const monthEvents = eventsForMonth(events, cursor)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', padding: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 1, flex: 1, minHeight: 0, overflow: 'auto', alignContent: 'start' }}>
      {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
        <div key={d} style={{ padding: '6px 4px', fontSize: 10, fontWeight: 700, color: FC_DARK.muted, textAlign: 'center' }}>{d}</div>
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
            style={{
              minHeight: 88,
              padding: 4,
              background: today ? `${FC_DARK.accent}12` : inMonth ? FC_DARK.surface : `${FC_DARK.bg}`,
              border: `1px solid ${today ? FC_DARK.accent : FC_DARK.border}`,
              borderRadius: 6,
              cursor: 'pointer',
              opacity: inMonth ? 1 : 0.45,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: today ? 800 : 600, color: today ? FC_DARK.accent : FC_DARK.ink, marginBottom: 4 }}>
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
            {dayEv.length > 3 && <div style={{ fontSize: 9, color: FC_DARK.muted }}>+{dayEv.length - 3}</div>}
          </div>
        )
      })}
      </div>
    </div>
  )
}

export function FormatcalWeekView({ cursor, events, weekStartsOn, onEventClick, onSlotClick }) {
  const days = weekDays(cursor, weekStartsOn)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7)

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'auto' }}>
      <div style={{ width: 44, flexShrink: 0 }}>
        {hours.map((h) => (
          <div key={h} style={{ height: 48, fontSize: 9, color: FC_DARK.muted, paddingTop: 4, textAlign: 'right', paddingRight: 6 }}>{h}:00</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', flex: 1, gap: 4 }}>
        {days.map((day) => {
          const ts = day.getTime()
          const dayEv = eventsForDay(events, ts).filter((e) => !e.allDay)
          return (
            <div key={ts} style={{ borderLeft: `1px solid ${FC_DARK.border}` }}>
              <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 10, fontWeight: isToday(ts) ? 800 : 600, color: isToday(ts) ? FC_DARK.accent : FC_DARK.muted }}>
                {fmtDate(ts, 'EEE d')}
              </div>
              <div style={{ position: 'relative', height: hours.length * 48 }}>
                {hours.map((h) => (
                  <div
                    key={h}
                    onClick={() => {
                      const d = new Date(day)
                      d.setHours(h, 0, 0, 0)
                      onSlotClick?.(d.getTime())
                    }}
                    style={{ height: 48, borderTop: `1px solid ${FC_DARK.border}33`, cursor: 'pointer' }}
                  />
                ))}
                {dayEv.map((ev) => {
                  const start = new Date(ev.startAt)
                  const end = new Date(ev.endAt)
                  const top = ((start.getHours() - 7) * 60 + start.getMinutes()) / 60 * 48
                  const h = Math.max(24, ((end - start) / 3600000) * 48)
                  return (
                    <div key={ev.id} style={{ position: 'absolute', left: 2, right: 2, top, height: h, zIndex: 2 }}>
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

export function FormatcalDayView({ cursor, events, onEventClick, onSlotClick }) {
  const dayEv = eventsForDay(events, cursor)
  const hours = Array.from({ length: 16 }, (_, i) => i + 6)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '0 12px' }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}>{fmtDate(cursor, 'EEEE d MMMM yyyy')}</div>
      {dayEv.filter((e) => e.allDay).map((ev) => <EventChip key={ev.id} ev={ev} onClick={onEventClick} />)}
      {hours.map((h) => {
        const slotStart = new Date(cursor)
        slotStart.setHours(h, 0, 0, 0)
        const slotEnd = slotStart.getTime() + 3600000
        const slotEv = dayEv.filter((e) => !e.allDay && e.startAt < slotEnd && (e.endAt || e.startAt) > slotStart.getTime())
        return (
          <div key={h} style={{ display: 'flex', gap: 12, minHeight: 52, borderTop: `1px solid ${FC_DARK.border}44` }}>
            <div style={{ width: 44, fontSize: 10, color: FC_DARK.muted, paddingTop: 8 }}>{h}:00</div>
            <div
              style={{ flex: 1, padding: '4px 0', cursor: 'pointer' }}
              onClick={() => onSlotClick?.(slotStart.getTime())}
            >
              {slotEv.map((ev) => <EventChip key={ev.id} ev={ev} onClick={onEventClick} />)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FormatcalAgendaView({ events, onEventClick }) {
  const sorted = [...events].sort((a, b) => a.startAt - b.startAt)
  let lastDay = ''

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
      {sorted.length === 0 && <div style={{ color: FC_DARK.muted, textAlign: 'center', padding: 40 }}>Aucun événement</div>}
      {sorted.map((ev) => {
        const dayKey = fmtDate(ev.startAt, 'yyyy-MM-dd')
        const showHeader = dayKey !== lastDay
        lastDay = dayKey
        const st = autoStatus(ev)
        return (
          <div key={ev.id}>
            {showHeader && (
              <div style={{ fontSize: 12, fontWeight: 800, color: FC_DARK.accent, margin: '16px 0 8px', paddingTop: 8 }}>
                {fmtDate(ev.startAt, 'EEEE d MMMM')}
              </div>
            )}
            <div
              onClick={() => onEventClick?.(ev)}
              style={{
                display: 'flex',
                gap: 12,
                padding: '12px 14px',
                marginBottom: 8,
                borderRadius: 10,
                background: FC_DARK.surface,
                border: `1px solid ${FC_DARK.border}`,
                borderLeft: `4px solid ${ev.color}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 20 }}>{ev.icon || '📅'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{ev.title}</div>
                <div style={{ fontSize: 11, color: FC_DARK.muted, marginTop: 2 }}>
                  {ev.allDay ? 'Journée entière' : `${fmtTime(ev.startAt)} – ${fmtTime(ev.endAt)}`}
                </div>
                {ev.description && <div style={{ fontSize: 11, color: FC_DARK.muted, marginTop: 4, opacity: 0.85 }}>{ev.description.slice(0, 120)}</div>}
                {(ev.checklist?.length > 0) && (
                  <div style={{ fontSize: 10, color: FC_DARK.accent, marginTop: 4 }}>{checklistProgress(ev)}% complété</div>
                )}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: st === 'late' ? FC_DARK.danger : FC_DARK.muted, alignSelf: 'flex-start' }}>{st}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function FormatcalTimelineView({ events, onEventClick }) {
  const sorted = [...events].sort((a, b) => a.startAt - b.startAt)
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
      <div style={{ position: 'relative', borderLeft: `2px solid ${FC_DARK.border}`, marginLeft: 80 }}>
        {sorted.map((ev) => (
          <div key={ev.id} style={{ position: 'relative', marginBottom: 20, paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: -86, top: 4, width: 70, fontSize: 10, color: FC_DARK.muted, textAlign: 'right' }}>
              {fmtDate(ev.startAt, 'd MMM')}
            </div>
            <div style={{ position: 'absolute', left: -7, top: 8, width: 12, height: 12, borderRadius: '50%', background: ev.color || FC_DARK.accent, border: `2px solid ${FC_DARK.bg}` }} />
            <div onClick={() => onEventClick?.(ev)} style={{ padding: '10px 14px', borderRadius: 10, background: FC_DARK.surface, border: `1px solid ${FC_DARK.border}`, cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{ev.icon} {ev.title}</div>
              <div style={{ fontSize: 10, color: FC_DARK.muted, marginTop: 2 }}>{fmtTime(ev.startAt)} – {fmtTime(ev.endAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FormatcalListView({ events, title, onEventClick }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
      <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>{title}</div>
      {events.length === 0 ? (
        <div style={{ color: FC_DARK.muted, textAlign: 'center', padding: 40 }}>Rien à afficher</div>
      ) : (
        events.map((ev) => <EventChip key={ev.id} ev={ev} onClick={onEventClick} />)
      )}
    </div>
  )
}
