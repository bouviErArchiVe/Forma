import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import useAppStore from '@/stores/useAppStore'
import BrandLogo from '@/components/BrandLogo'
import FormatcalSidebar from '@/components/formatcal/FormatcalSidebar'
import FormatcalEventModal from '@/components/formatcal/FormatcalEventModal'
import {
  FormatcalMonthView, FormatcalWeekView, FormatcalDayView,
  FormatcalAgendaView, FormatcalTimelineView, FormatcalListView,
} from '@/components/formatcal/FormatcalViews'
import { FC_DARK, FC_VIEWS } from '@/lib/formatcal/constants'
import { loadCalendar, upsertEvent, deleteEvent, moveEvent } from '@/lib/formatcal/persistence'
import { filterEvents, sortEvents, deadlineEvents, projectEvents } from '@/lib/formatcal/filters'
import { addDays, addMonths, addYears, fmtDate } from '@/lib/formatcal/dates'
import { requestNotificationPermission, startReminderLoop } from '@/lib/formatcal/reminders'
import { exportEventsIcs, exportAgendaPdf, downloadText } from '@/lib/formatcal/export'

export default function FormatcalPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const addNotification = useAppStore((s) => s.addNotification)

  const [calendar, setCalendar] = useState(() => loadCalendar())
  const [view, setView] = useState(calendar.settings?.defaultView || 'month')
  const [cursor, setCursor] = useState(Date.now())
  const [filters, setFilters] = useState({ query: '', category: 'all', status: 'all', tag: '' })
  const [modal, setModal] = useState({ open: false, event: null, defaultDate: null })

  const refresh = useCallback(() => setCalendar(loadCalendar()), [])

  const events = useMemo(() => {
    let list = filterEvents(calendar.events, filters)
    list = sortEvents(list, 'date')
    return list
  }, [calendar.events, filters])

  useEffect(() => {
    const stop = startReminderLoop(() => loadCalendar().events, ({ title, body }) => {
      addNotification(`${title} — ${body}`, 'info')
    })
    return stop
  }, [addNotification])

  const openNew = useCallback((defaultDate = null) => {
    setModal({ open: true, event: null, defaultDate: defaultDate || cursor })
  }, [cursor])

  const openEdit = useCallback((ev) => {
    setModal({ open: true, event: ev, defaultDate: null })
  }, [])

  const handleSave = useCallback((ev) => {
    upsertEvent(ev)
    refresh()
    addNotification('Événement enregistré', 'success')
  }, [refresh, addNotification])

  const handleDelete = useCallback((id) => {
    deleteEvent(id)
    refresh()
    addNotification('Événement supprimé', 'success')
  }, [refresh, addNotification])

  const handleDrop = useCallback((id, dayTs) => {
    const ev = calendar.events.find((e) => e.id === id)
    if (!ev) return
    const d = new Date(dayTs)
    const old = new Date(ev.startAt)
    d.setHours(old.getHours(), old.getMinutes(), 0, 0)
    const duration = (ev.endAt || ev.startAt) - ev.startAt
    moveEvent(id, d.getTime(), d.getTime() + duration)
    refresh()
  }, [calendar.events, refresh])

  const goToday = () => setCursor(Date.now())

  const navLabel = useMemo(() => {
    if (view === 'day') return fmtDate(cursor, 'EEEE d MMMM yyyy')
    if (view === 'week') return fmtDate(cursor, 'MMMM yyyy')
    if (view === 'year') return fmtDate(cursor, 'yyyy')
    return fmtDate(cursor, 'MMMM yyyy')
  }, [view, cursor])

  const shiftCursor = (dir) => {
    const n = dir === 'prev' ? -1 : 1
    if (view === 'day') setCursor(addDays(cursor, n).getTime())
    else if (view === 'week') setCursor(addDays(cursor, n * 7).getTime())
    else if (view === 'year') setCursor(addYears(cursor, n).getTime())
    else setCursor(addMonths(cursor, n).getTime())
  }

  const renderView = () => {
    const ws = calendar.settings?.weekStartsOn ?? 1
    const props = { events, onEventClick: openEdit }
    switch (view) {
      case 'day': return <FormatcalDayView cursor={cursor} {...props} onSlotClick={openNew} />
      case 'week': return <FormatcalWeekView cursor={cursor} weekStartsOn={ws} {...props} onSlotClick={openNew} />
      case 'month': return <FormatcalMonthView cursor={cursor} weekStartsOn={ws} {...props} onDayClick={(ts) => { setCursor(ts); setView('day') }} onEventDrop={handleDrop} />
      case 'agenda': return <FormatcalAgendaView {...props} />
      case 'timeline': return <FormatcalTimelineView {...props} />
      case 'planning': return <FormatcalAgendaView {...props} />
      case 'project': return <FormatcalListView events={projectEvents(events)} title="Vue projets" {...props} />
      case 'deadlines': return <FormatcalListView events={deadlineEvents(events)} title="Remises & examens" {...props} />
      case 'year': return <FormatcalListView events={events} title={`Année ${fmtDate(cursor, 'yyyy')}`} {...props} />
      default: return <FormatcalMonthView cursor={cursor} weekStartsOn={ws} {...props} onDayClick={(ts) => { setCursor(ts); setView('day') }} onEventDrop={handleDrop} />
    }
  }

  const handleExportIcs = () => {
    const ics = exportEventsIcs(calendar.events)
    downloadText(ics, 'formatcal.ics', 'text/calendar')
    addNotification('Export ICS téléchargé', 'success')
  }

  const handleExportPdf = async () => {
    const blob = await exportAgendaPdf(events, { title: 'FormatCal — Agenda' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'formatcal-agenda.pdf'
    a.click()
    URL.revokeObjectURL(url)
    addNotification('PDF exporté', 'success')
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: FC_DARK.bg, color: FC_DARK.ink }}>
      <header style={{
        height: 52,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 16px',
        borderBottom: `1px solid ${FC_DARK.border}`,
        background: FC_DARK.panel,
        flexShrink: 0,
      }}>
        <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <BrandLogo src={T.img} alt={T.n} size="sm" showText={false} accent={FC_DARK.accent} />
        </button>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17 }}>FormatCal</div>
      </header>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        borderBottom: `1px solid ${FC_DARK.border}`,
        background: FC_DARK.surface,
        flexShrink: 0,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 160, fontSize: 13, fontWeight: 600, color: FC_DARK.ink }}>{navLabel}</div>
        <button type="button" onClick={() => shiftCursor('prev')} style={navBtn} title="Précédent">‹</button>
        <button type="button" onClick={goToday} style={{ ...navBtn, color: FC_DARK.accent, fontWeight: 700 }}>Aujourd'hui</button>
        <button type="button" onClick={() => shiftCursor('next')} style={navBtn} title="Suivant">›</button>
        {['day', 'week', 'month', 'year'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            style={{ ...navBtn, color: view === v ? FC_DARK.accent : FC_DARK.muted, fontWeight: view === v ? 800 : 600, border: `1px solid ${view === v ? FC_DARK.accent : FC_DARK.border}`, borderRadius: 6, padding: '4px 10px' }}
          >
            {v === 'day' ? 'Jour' : v === 'week' ? 'Semaine' : v === 'month' ? 'Mois' : 'Année'}
          </button>
        ))}
        <button type="button" onClick={handleExportIcs} style={{ ...navBtn, border: `1px solid ${FC_DARK.border}`, borderRadius: 6, padding: '4px 10px' }}>ICS</button>
        <button type="button" onClick={handleExportPdf} style={{ ...navBtn, border: `1px solid ${FC_DARK.border}`, borderRadius: 6, padding: '4px 10px' }}>PDF</button>
        <button type="button" onClick={() => openNew()} style={{ ...navBtn, background: FC_DARK.accent, color: '#fff', borderRadius: 6, padding: '4px 12px', fontWeight: 700 }}>+ Événement</button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <FormatcalSidebar
          events={calendar.events}
          filters={filters}
          onFilterChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          onEventClick={openEdit}
          onNewEvent={() => openNew()}
          onEnableReminders={async () => {
            const p = await requestNotificationPermission()
            addNotification(p === 'granted' ? 'Notifications activées' : 'Notifications refusées ou indisponibles', p === 'granted' ? 'success' : 'error')
          }}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, minHeight: 0 }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'auto' }}>
            {renderView()}
          </div>
        </main>
      </div>

      <FormatcalEventModal
        open={modal.open}
        event={modal.event}
        defaultDate={modal.defaultDate}
        onClose={() => setModal({ open: false, event: null, defaultDate: null })}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

const navBtn = {
  background: 'none',
  border: 'none',
  color: FC_DARK.muted,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  padding: '4px 8px',
}

const selectStyle = {
  padding: '6px 10px',
  borderRadius: 8,
  border: `1px solid ${FC_DARK.border}`,
  background: FC_DARK.surface,
  color: FC_DARK.ink,
  fontSize: 11,
}
