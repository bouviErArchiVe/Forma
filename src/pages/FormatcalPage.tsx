import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { FormatcalEventModal } from '../components/formatcal/FormatcalEventModal'
import { FormatcalSidebar } from '../components/formatcal/FormatcalSidebar'
import {
  FormatcalAgendaView,
  FormatcalDayView,
  FormatcalListView,
  FormatcalMonthView,
  FormatcalTimelineView,
  FormatcalWeekView,
} from '../components/formatcal/FormatcalViews'
import { GlassButton } from '../components/ui/GlassButton'
import { addDays, addMonths, addYears, fmtDate } from '../lib/formatcal/dates'
import { exportAgendaPdf, exportEventsIcsFile } from '../lib/formatcal/export'
import {
  deadlineEvents,
  filterEvents,
  projectEvents,
  sortEvents,
  type EventFilters,
} from '../lib/formatcal/filters'
import { requestNotificationPermission, startReminderLoop } from '../lib/formatcal/reminders'
import {
  deleteEvent,
  getSettings,
  listEvents,
  moveEvent,
  upsertEvent,
} from '../services/formatcal'
import { useToastStore } from '../stores/toastStore'
import type { FormaCalEvent, FormaCalSettings, FormaCalViewId } from '../types'

export function FormatcalPage() {
  const [events, setEvents] = useState<FormaCalEvent[]>([])
  const [settings, setSettings] = useState<FormaCalSettings | null>(null)
  const [view, setView] = useState<FormaCalViewId>('month')
  const [cursor, setCursor] = useState(Date.now())
  const [filters, setFilters] = useState<EventFilters>({
    query: '',
    category: 'all',
    status: 'all',
    tag: '',
  })
  const [modal, setModal] = useState<{
    open: boolean
    event: FormaCalEvent | null
    defaultDate: number | null
  }>({ open: false, event: null, defaultDate: null })

  const refresh = useCallback(async () => {
    const [evs, cfg] = await Promise.all([listEvents(), getSettings()])
    setEvents(evs)
    setSettings(cfg)
  }, [])

  useEffect(() => {
    void (async () => {
      const cfg = await getSettings()
      setSettings(cfg)
      setView(cfg.defaultView)
      setEvents(await listEvents())
    })()
  }, [])

  useEffect(() => {
    const stop = startReminderLoop(
      () => events,
      ({ title, body }) => useToastStore.getState().show(`${title} — ${body}`),
    )
    return stop
  }, [events])

  const filtered = useMemo(() => {
    const list = filterEvents(events, filters)
    return sortEvents(list, 'date')
  }, [events, filters])

  const openNew = useCallback(
    (defaultDate: number | null = null) => {
      setModal({ open: true, event: null, defaultDate: defaultDate || cursor })
    },
    [cursor],
  )

  const openEdit = useCallback((ev: FormaCalEvent) => {
    setModal({ open: true, event: ev, defaultDate: null })
  }, [])

  const handleSave = async (ev: FormaCalEvent) => {
    await upsertEvent(ev)
    await refresh()
    useToastStore.getState().show('Événement enregistré')
  }

  const handleDelete = async (id: string) => {
    await deleteEvent(id)
    await refresh()
    useToastStore.getState().show('Événement supprimé')
  }

  const handleDrop = async (id: string, dayTs: number) => {
    const ev = events.find((e) => e.id === id)
    if (!ev) return
    const d = new Date(dayTs)
    const old = new Date(ev.startAt)
    d.setHours(old.getHours(), old.getMinutes(), 0, 0)
    const duration = (ev.endAt || ev.startAt) - ev.startAt
    await moveEvent(id, d.getTime(), d.getTime() + duration)
    await refresh()
  }

  const goToday = () => setCursor(Date.now())

  const weekStartsOn = settings?.weekStartsOn ?? 1

  const navLabel = useMemo(() => {
    if (view === 'day') return fmtDate(cursor, 'EEEE d MMMM yyyy')
    if (view === 'week') return fmtDate(cursor, 'MMMM yyyy')
    if (view === 'year') return fmtDate(cursor, 'yyyy')
    return fmtDate(cursor, 'MMMM yyyy')
  }, [view, cursor])

  const shiftCursor = (dir: 'prev' | 'next') => {
    const n = dir === 'prev' ? -1 : 1
    if (view === 'day') setCursor(addDays(cursor, n).getTime())
    else if (view === 'week') setCursor(addDays(cursor, n * 7).getTime())
    else if (view === 'year') setCursor(addYears(cursor, n).getTime())
    else setCursor(addMonths(cursor, n).getTime())
  }

  const renderView = () => {
    const props = { events: filtered, onEventClick: openEdit }
    switch (view) {
      case 'day':
        return <FormatcalDayView cursor={cursor} {...props} onSlotClick={openNew} />
      case 'week':
        return (
          <FormatcalWeekView
            cursor={cursor}
            weekStartsOn={weekStartsOn}
            {...props}
            onSlotClick={openNew}
          />
        )
      case 'month':
        return (
          <FormatcalMonthView
            cursor={cursor}
            weekStartsOn={weekStartsOn}
            {...props}
            onDayClick={(ts) => {
              setCursor(ts)
              setView('day')
            }}
            onEventDrop={(id, ts) => void handleDrop(id, ts)}
          />
        )
      case 'agenda':
      case 'planning':
        return <FormatcalAgendaView {...props} />
      case 'timeline':
        return <FormatcalTimelineView {...props} />
      case 'project':
        return (
          <FormatcalListView
            title="Vue projets"
            onEventClick={openEdit}
            events={projectEvents(filtered)}
          />
        )
      case 'deadlines':
        return (
          <FormatcalListView
            title="Remises & examens"
            onEventClick={openEdit}
            events={deadlineEvents(filtered)}
          />
        )
      case 'year':
        return (
          <FormatcalListView
            title={`Année ${fmtDate(cursor, 'yyyy')}`}
            onEventClick={openEdit}
            events={filtered}
          />
        )
      default:
        return (
          <FormatcalMonthView
            cursor={cursor}
            weekStartsOn={weekStartsOn}
            {...props}
            onDayClick={(ts) => {
              setCursor(ts)
              setView('day')
            }}
            onEventDrop={(id, ts) => void handleDrop(id, ts)}
          />
        )
    }
  }

  const handleExportIcs = () => {
    exportEventsIcsFile(events)
    useToastStore.getState().show('Export ICS téléchargé')
  }

  const handleExportPdf = async () => {
    await exportAgendaPdf(filtered, { title: 'FormatCal — Agenda' })
    useToastStore.getState().show('PDF exporté')
  }

  return (
    <div className="min-h-full flex flex-col h-screen max-h-screen">
      <header className="forma-glass-header px-4 py-2 flex flex-wrap items-center gap-2 border-b border-forma-border/50 shrink-0">
        <BrandLogo size="sm" subtitle="FormatCal" />
        <Link to="/" className="text-sm text-forma-accent hover:underline ml-2">
          ← Bibliothèque
        </Link>
        <div className="flex-1 min-w-[8rem] text-sm font-semibold">{navLabel}</div>
        <button
          type="button"
          onClick={() => shiftCursor('prev')}
          className="text-xs font-semibold text-forma-muted px-2"
          title="Précédent"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={goToday}
          className="text-xs font-bold text-forma-accent px-2"
        >
          Aujourd'hui
        </button>
        <button
          type="button"
          onClick={() => shiftCursor('next')}
          className="text-xs font-semibold text-forma-muted px-2"
          title="Suivant"
        >
          ›
        </button>
        {(['day', 'week', 'month', 'agenda', 'timeline'] as FormaCalViewId[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${view === v ? 'border-forma-accent text-forma-accent font-extrabold' : 'border-forma-border text-forma-muted'}`}
          >
            {v === 'day'
              ? 'Jour'
              : v === 'week'
                ? 'Semaine'
                : v === 'month'
                  ? 'Mois'
                  : v === 'agenda'
                    ? 'Agenda'
                    : 'Timeline'}
          </button>
        ))}
        <GlassButton size="sm" onClick={handleExportIcs}>
          ICS
        </GlassButton>
        <GlassButton size="sm" onClick={() => void handleExportPdf()}>
          PDF
        </GlassButton>
        <GlassButton accent size="sm" onClick={() => openNew()}>
          + Événement
        </GlassButton>
      </header>

      <div className="flex flex-1 min-h-0">
        <FormatcalSidebar
          events={events}
          filters={filters}
          onFilterChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
          onEventClick={openEdit}
          onNewEvent={() => openNew()}
          onEnableReminders={async () => {
            const p = await requestNotificationPermission()
            useToastStore.getState().show(
              p === 'granted'
                ? 'Notifications activées'
                : 'Notifications refusées ou indisponibles',
            )
          }}
        />
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-auto">{renderView()}</main>
      </div>

      <FormatcalEventModal
        open={modal.open}
        event={modal.event}
        defaultDate={modal.defaultDate}
        onClose={() => setModal({ open: false, event: null, defaultDate: null })}
        onSave={(ev) => void handleSave(ev)}
        onDelete={(id) => void handleDelete(id)}
      />
    </div>
  )
}
