import { FC_DARK, FC_CATEGORIES, FC_STATUSES } from '@/lib/formatcal/constants'
import { autoStatus, checklistProgress } from '@/lib/formatcal/model'
import { fmtDate, fmtTime } from '@/lib/formatcal/dates'
import { todayEvents, upcomingEvents, allTags } from '@/lib/formatcal/filters'

export default function FormatcalSidebar({
  events,
  filters,
  onFilterChange,
  onEventClick,
  onNewEvent,
  onEnableReminders,
}) {
  const today = todayEvents(events)
  const upcoming = upcomingEvents(events, 6)
  const tags = allTags(events)

  return (
    <aside style={{
      width: 280,
      background: FC_DARK.panel,
      borderRight: `1px solid ${FC_DARK.border}`,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${FC_DARK.border}` }}>
        <button type="button" onClick={onNewEvent} style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: 8,
          border: 'none',
          background: FC_DARK.accent,
          color: '#fff',
          fontWeight: 700,
          fontSize: 12,
          cursor: 'pointer',
        }}>
          + Nouvel événement
        </button>
        <button type="button" onClick={onEnableReminders} style={{
          width: '100%',
          marginTop: 8,
          padding: '7px 0',
          borderRadius: 8,
          border: `1px solid ${FC_DARK.border}`,
          background: 'transparent',
          color: FC_DARK.muted,
          fontSize: 10,
          cursor: 'pointer',
        }}>
          🔔 Activer notifications
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: 12 }}>
        <Section title="Aujourd'hui">
          {today.length === 0 ? <Empty /> : today.map((ev) => (
            <MiniEvent key={ev.id} ev={ev} onClick={onEventClick} />
          ))}
        </Section>

        <Section title="À venir">
          {upcoming.length === 0 ? <Empty /> : upcoming.map((ev) => (
            <MiniEvent key={ev.id} ev={ev} onClick={onEventClick} />
          ))}
        </Section>

        <Section title="Filtres">
          <input
            value={filters.query || ''}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            placeholder="Rechercher…"
            style={inputStyle}
          />
          <select value={filters.category || 'all'} onChange={(e) => onFilterChange({ category: e.target.value })} style={{ ...inputStyle, marginTop: 6 }}>
            <option value="all">Toutes catégories</option>
            {FC_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
          <select value={filters.status || 'all'} onChange={(e) => onFilterChange({ status: e.target.value })} style={{ ...inputStyle, marginTop: 6 }}>
            <option value="all">Tous statuts</option>
            {FC_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {tags.length > 0 && (
            <select value={filters.tag || ''} onChange={(e) => onFilterChange({ tag: e.target.value })} style={{ ...inputStyle, marginTop: 6 }}>
              <option value="">Tous tags</option>
              {tags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </Section>
      </div>
    </aside>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: FC_DARK.muted, letterSpacing: 0.6, marginBottom: 8 }}>{title.toUpperCase()}</div>
      {children}
    </div>
  )
}

function MiniEvent({ ev, onClick }) {
  const st = autoStatus(ev)
  return (
    <button type="button" onClick={() => onClick?.(ev)} style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '8px 10px',
      marginBottom: 6,
      borderRadius: 8,
      border: `1px solid ${FC_DARK.border}`,
      borderLeft: `3px solid ${ev.color}`,
      background: FC_DARK.surface,
      color: FC_DARK.ink,
      cursor: 'pointer',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700 }}>{ev.icon} {ev.title}</div>
      <div style={{ fontSize: 9, color: FC_DARK.muted, marginTop: 2 }}>
        {ev.allDay ? fmtDate(ev.startAt, 'EEE d MMM') : `${fmtTime(ev.startAt)} · ${fmtDate(ev.startAt, 'd MMM')}`}
      </div>
      {ev.checklist?.length > 0 && (
        <div style={{ fontSize: 9, color: FC_DARK.accent, marginTop: 2 }}>{checklistProgress(ev)}%</div>
      )}
      {st === 'late' && <div style={{ fontSize: 9, color: FC_DARK.danger, marginTop: 2 }}>En retard</div>}
    </button>
  )
}

function Empty() {
  return <div style={{ fontSize: 10, color: FC_DARK.muted, padding: '4px 0' }}>—</div>
}

const inputStyle = {
  width: '100%',
  padding: '7px 9px',
  borderRadius: 7,
  border: `1px solid ${FC_DARK.border}`,
  background: FC_DARK.surface,
  color: FC_DARK.ink,
  fontSize: 11,
  boxSizing: 'border-box',
}
