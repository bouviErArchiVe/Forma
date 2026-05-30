import type { FormaCalEvent } from '../../types'
import { FC_CATEGORIES, FC_STATUSES } from '../../lib/formatcal/constants'
import { autoStatus, checklistProgress } from '../../lib/formatcal/model'
import { fmtDate, fmtTime } from '../../lib/formatcal/dates'
import { allTags, todayEvents, upcomingEvents, type EventFilters } from '../../lib/formatcal/filters'
import { GlassButton } from '../ui/GlassButton'

interface FormatcalSidebarProps {
  events: FormaCalEvent[]
  filters: EventFilters
  onFilterChange: (patch: Partial<EventFilters>) => void
  onEventClick: (ev: FormaCalEvent) => void
  onNewEvent: () => void
  onEnableReminders: () => void
}

export function FormatcalSidebar({
  events,
  filters,
  onFilterChange,
  onEventClick,
  onNewEvent,
  onEnableReminders,
}: FormatcalSidebarProps) {
  const today = todayEvents(events)
  const upcoming = upcomingEvents(events, 6)
  const tags = allTags(events)

  return (
    <aside className="w-[280px] shrink-0 border-r border-forma-border/50 bg-forma-panel flex flex-col overflow-hidden">
      <div className="p-3.5 border-b border-forma-border/50 space-y-2">
        <GlassButton accent className="w-full" onClick={onNewEvent}>
          + Nouvel événement
        </GlassButton>
        <button
          type="button"
          onClick={onEnableReminders}
          className="w-full py-1.5 rounded-lg border border-forma-border text-[10px] text-forma-muted hover:bg-forma-surface"
        >
          🔔 Activer notifications
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <Section title="Aujourd'hui">
          {today.length === 0 ? (
            <Empty />
          ) : (
            today.map((ev) => <MiniEvent key={ev.id} ev={ev} onClick={onEventClick} />)
          )}
        </Section>

        <Section title="À venir">
          {upcoming.length === 0 ? (
            <Empty />
          ) : (
            upcoming.map((ev) => <MiniEvent key={ev.id} ev={ev} onClick={onEventClick} />)
          )}
        </Section>

        <Section title="Filtres">
          <input
            value={filters.query || ''}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            placeholder="Rechercher…"
            className="w-full px-2.5 py-1.5 rounded-lg border border-forma-border bg-forma-surface text-[11px]"
          />
          <select
            value={filters.category || 'all'}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-forma-border bg-forma-surface text-[11px]"
          >
            <option value="all">Toutes catégories</option>
            {FC_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.label}
              </option>
            ))}
          </select>
          <select
            value={filters.status || 'all'}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-forma-border bg-forma-surface text-[11px]"
          >
            <option value="all">Tous statuts</option>
            {FC_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {tags.length > 0 && (
            <select
              value={filters.tag || ''}
              onChange={(e) => onFilterChange({ tag: e.target.value })}
              className="w-full mt-1.5 px-2.5 py-1.5 rounded-lg border border-forma-border bg-forma-surface text-[11px]"
            >
              <option value="">Tous tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          )}
        </Section>
      </div>
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-extrabold text-forma-muted tracking-wide mb-2">
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  )
}

function MiniEvent({ ev, onClick }: { ev: FormaCalEvent; onClick: (ev: FormaCalEvent) => void }) {
  const st = autoStatus(ev)
  return (
    <button
      type="button"
      onClick={() => onClick(ev)}
      className="block w-full text-left p-2 mb-1.5 rounded-lg border border-forma-border bg-forma-surface cursor-pointer"
      style={{ borderLeft: `3px solid ${ev.color}` }}
    >
      <div className="text-[11px] font-bold">
        {ev.icon} {ev.title}
      </div>
      <div className="text-[9px] text-forma-muted mt-0.5">
        {ev.allDay
          ? fmtDate(ev.startAt, 'EEE d MMM')
          : `${fmtTime(ev.startAt)} · ${fmtDate(ev.startAt, 'd MMM')}`}
      </div>
      {ev.checklist?.length > 0 && (
        <div className="text-[9px] text-forma-accent mt-0.5">{checklistProgress(ev)}%</div>
      )}
      {st === 'late' && <div className="text-[9px] text-red-500 mt-0.5">En retard</div>}
    </button>
  )
}

function Empty() {
  return <div className="text-[10px] text-forma-muted py-1">—</div>
}
