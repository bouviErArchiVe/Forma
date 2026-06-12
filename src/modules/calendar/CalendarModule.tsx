/**
 * CalendarModule — calendrier Forma V2 (vues jour / semaine / mois).
 *
 * Événements persistés dans page.moduleData via ModuleHost (JSON
 * CalendarState). Helpers de dates purs dans ./calendar-data.ts.
 * Un événement peut référencer une matière (notebook 'subject') et un
 * document lié (navigation /document/:id).
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { Modal } from '../../components/ui/Modal'
import { db } from '../../db'
import { createId } from '../../lib/id'
import { confirm } from '../../stores/confirmStore'
import { useToastStore } from '../../stores/toastStore'
import type { Notebook } from '../../types'
import type { ModuleProps } from '../ModuleHost'
import {
  addDays,
  addMonths,
  EVENT_COLORS,
  eventsOnDay,
  monthGrid,
  parseCalendarState,
  parseISODate,
  serializeCalendarState,
  startOfWeek,
  todayISO,
  weekDays,
  type CalendarEvent,
  type CalendarState,
} from './calendar-data'

type ViewMode = 'day' | 'week' | 'month'

const VIEW_LABELS: { id: ViewMode; label: string }[] = [
  { id: 'day', label: 'Jour' },
  { id: 'week', label: 'Semaine' },
  { id: 'month', label: 'Mois' },
]

const WEEKDAY_HEADERS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// ─── Brouillon du formulaire événement ───────────────────────────────────────

interface EventDraft {
  id: string | null // null = création
  title: string
  date: string
  startTime: string
  endTime: string
  description: string
  color: string
  subjectId: string
  linkedDocId: string
}

function emptyDraft(date: string): EventDraft {
  return {
    id: null,
    title: '',
    date,
    startTime: '',
    endTime: '',
    description: '',
    color: EVENT_COLORS[0],
    subjectId: '',
    linkedDocId: '',
  }
}

function draftFromEvent(e: CalendarEvent): EventDraft {
  return {
    id: e.id,
    title: e.title,
    date: e.date,
    startTime: e.startTime ?? '',
    endTime: e.endTime ?? '',
    description: e.description ?? '',
    color: e.color,
    subjectId: e.subjectId ?? '',
    linkedDocId: e.linkedDocId ?? '',
  }
}

// ─── Libellés de période (français) ──────────────────────────────────────────

function dayLabel(iso: string): string {
  return parseISODate(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function monthLabel(iso: string): string {
  const label = parseISODate(iso).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function weekLabel(iso: string): string {
  const monday = startOfWeek(iso)
  const sunday = addDays(monday, 6)
  const fmt = (d: string) =>
    parseISODate(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

// ─── Pastille événement (mois / semaine) ─────────────────────────────────────

function EventPill({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      title={event.startTime ? `${event.startTime} — ${event.title}` : event.title}
      className="w-full text-left text-[10px] leading-tight px-1.5 py-0.5 rounded truncate text-white hover:opacity-85 transition-opacity"
      style={{ backgroundColor: event.color }}
    >
      {event.startTime && <span className="font-medium">{event.startTime} </span>}
      {event.title}
    </button>
  )
}

// ─── Modal création / édition ────────────────────────────────────────────────

function EventModal({
  draft,
  subjects,
  documents,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  draft: EventDraft
  subjects: Notebook[]
  documents: Notebook[]
  onChange: (d: EventDraft) => void
  onSave: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const editing = draft.id !== null
  const canSave = draft.title.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(draft.date)

  const field = 'w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent focus:ring-1 focus:ring-forma-accent/30'
  const label = 'block text-[11px] font-medium text-forma-muted mb-1'

  return (
    <Modal open onClose={onClose} maxWidth="max-w-md">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-forma-text">
            {editing ? 'Modifier l’événement' : 'Nouvel événement'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            title="Fermer"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-forma-muted hover:text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon name="close" className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className={label} htmlFor="cal-ev-title">Titre</label>
            <input
              id="cal-ev-title"
              type="text"
              value={draft.title}
              autoFocus
              onChange={(e) => onChange({ ...draft, title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSave) onSave()
              }}
              placeholder="Ex. Examen de mathématiques"
              className={field}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={label} htmlFor="cal-ev-date">Date</label>
              <input
                id="cal-ev-date"
                type="date"
                value={draft.date}
                onChange={(e) => onChange({ ...draft, date: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="cal-ev-start">Début</label>
              <input
                id="cal-ev-start"
                type="time"
                value={draft.startTime}
                onChange={(e) => onChange({ ...draft, startTime: e.target.value })}
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="cal-ev-end">Fin</label>
              <input
                id="cal-ev-end"
                type="time"
                value={draft.endTime}
                onChange={(e) => onChange({ ...draft, endTime: e.target.value })}
                className={field}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="cal-ev-desc">Description</label>
            <textarea
              id="cal-ev-desc"
              value={draft.description}
              onChange={(e) => onChange({ ...draft, description: e.target.value })}
              rows={2}
              placeholder="Détails (optionnel)"
              className={`${field} resize-none`}
            />
          </div>

          <div>
            <span className={label}>Couleur</span>
            <div className="flex gap-2">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange({ ...draft, color: c })}
                  title={c}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    draft.color === c
                      ? 'ring-2 ring-offset-2 ring-forma-accent ring-offset-forma-surface scale-110'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={label} htmlFor="cal-ev-subject">Matière</label>
              <select
                id="cal-ev-subject"
                value={draft.subjectId}
                onChange={(e) => onChange({ ...draft, subjectId: e.target.value })}
                className={field}
              >
                <option value="">— Aucune —</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="cal-ev-doc">Document lié</label>
              <select
                id="cal-ev-doc"
                value={draft.linkedDocId}
                onChange={(e) => onChange({ ...draft, linkedDocId: e.target.value })}
                className={field}
              >
                <option value="">— Aucun —</option>
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {editing && (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="trash" className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors"
          >
            {editing ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Module ──────────────────────────────────────────────────────────────────

export function CalendarModule({ data, onDataChange }: ModuleProps) {
  const navigate = useNavigate()
  const [state, setState] = useState<CalendarState>(() => parseCalendarState(data))
  const [view, setView] = useState<ViewMode>('month')
  const [anchor, setAnchor] = useState<string>(todayISO())
  const [draft, setDraft] = useState<EventDraft | null>(null)
  const [subjects, setSubjects] = useState<Notebook[]>([])
  const [documents, setDocuments] = useState<Notebook[]>([])

  const today = todayISO()

  // Matières + documents liables (notebooks non supprimés)
  useEffect(() => {
    let cancelled = false
    void db.notebooks
      .filter((n) => !n.deletedAt)
      .toArray()
      .then((all) => {
        if (cancelled) return
        const sorted = all.slice().sort((a, b) => a.name.localeCompare(b.name))
        setSubjects(sorted.filter((n) => n.type === 'subject'))
        setDocuments(sorted)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const docById = useMemo(() => new Map(documents.map((d) => [d.id, d])), [documents])

  const update = (events: CalendarEvent[]) => {
    const next: CalendarState = { v: 1, events }
    setState(next)
    onDataChange(serializeCalendarState(next))
  }

  // ── Navigation ◀ Aujourd'hui ▶ ─────────────────────────────────────────────
  const step = (dir: -1 | 1) => {
    if (view === 'day') setAnchor(addDays(anchor, dir))
    else if (view === 'week') setAnchor(addDays(anchor, dir * 7))
    else setAnchor(addMonths(anchor, dir))
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────
  const saveDraft = () => {
    if (!draft || draft.title.trim() === '') return
    const event: CalendarEvent = {
      id: draft.id ?? createId(),
      title: draft.title.trim(),
      date: draft.date,
      color: draft.color,
      ...(draft.startTime ? { startTime: draft.startTime } : {}),
      ...(draft.endTime ? { endTime: draft.endTime } : {}),
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      ...(draft.subjectId ? { subjectId: draft.subjectId } : {}),
      ...(draft.linkedDocId ? { linkedDocId: draft.linkedDocId } : {}),
    }
    const events = draft.id
      ? state.events.map((e) => (e.id === draft.id ? event : e))
      : [...state.events, event]
    update(events)
    setDraft(null)
  }

  const deleteDraft = async () => {
    if (!draft?.id) return
    const ok = await confirm(`Supprimer « ${draft.title} » ?`, {
      title: 'Supprimer l’événement',
      confirmLabel: 'Supprimer',
      danger: true,
    })
    if (!ok) return
    update(state.events.filter((e) => e.id !== draft.id))
    setDraft(null)
    useToastStore.getState().show('Événement supprimé')
  }

  // ── Rendu d'un événement (vue jour) ─────────────────────────────────────────
  const renderDayEvent = (event: CalendarEvent) => {
    const subject = event.subjectId ? subjectById.get(event.subjectId) : undefined
    const linkedDoc = event.linkedDocId ? docById.get(event.linkedDocId) : undefined
    return (
      <div
        key={event.id}
        role="button"
        tabIndex={0}
        onClick={() => setDraft(draftFromEvent(event))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && e.target === e.currentTarget) setDraft(draftFromEvent(event))
        }}
        className="w-full text-left flex gap-3 px-3 py-2.5 rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/60 transition-colors cursor-pointer"
      >
        <span className="w-1 rounded-full shrink-0 self-stretch" style={{ backgroundColor: event.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs text-forma-muted shrink-0 tabular-nums">
              {event.startTime
                ? `${event.startTime}${event.endTime ? ` – ${event.endTime}` : ''}`
                : 'Journée'}
            </span>
            <span className="text-sm font-medium text-forma-text truncate">{event.title}</span>
          </div>
          {event.description && (
            <p className="text-xs text-forma-muted mt-0.5 line-clamp-2">{event.description}</p>
          )}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {subject && (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-forma-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.coverColor }} />
                {subject.name}
              </span>
            )}
            {linkedDoc && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/document/${linkedDoc.id}`)
                }}
                title={`Ouvrir « ${linkedDoc.name} »`}
                className="inline-flex items-center gap-1 text-[11px] text-forma-accent hover:underline"
              >
                <Icon name="file-text" className="w-3 h-3" />
                {linkedDoc.name}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Vues ────────────────────────────────────────────────────────────────────
  const monthCells = useMemo(() => {
    const d = parseISODate(anchor)
    return monthGrid(d.getFullYear(), d.getMonth() + 1)
  }, [anchor])

  const periodLabel =
    view === 'day' ? dayLabel(anchor) : view === 'week' ? weekLabel(anchor) : monthLabel(anchor)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Barre d'outils ──────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-forma-border bg-forma-surface flex-wrap">
        <div className="flex rounded-lg border border-forma-border overflow-hidden">
          {VIEW_LABELS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`text-xs px-3 py-1.5 transition-colors ${
                view === v.id
                  ? 'bg-forma-accent text-white'
                  : 'text-forma-muted hover:text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            title="Période précédente"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-forma-muted hover:text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon name="chevron-left" className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setAnchor(today)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Aujourd’hui
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            title="Période suivante"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-forma-muted hover:text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Icon name="chevron-right" className="w-4 h-4" />
          </button>
        </div>

        <span className="text-sm font-semibold text-forma-text capitalize">{periodLabel}</span>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => setDraft(emptyDraft(anchor))}
          className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors inline-flex items-center gap-1.5"
        >
          <Icon name="plus" className="w-3.5 h-3.5" />
          Événement
        </button>
      </div>

      {/* ── Contenu ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {view === 'month' && (
          <div className="h-full flex flex-col p-3">
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAY_HEADERS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-forma-muted py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 grid-rows-6 gap-1 flex-1 min-h-[480px]">
              {monthCells.map((cell) => {
                const events = eventsOnDay(state, cell.iso)
                const isToday = cell.iso === today
                return (
                  <div
                    key={cell.iso}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setAnchor(cell.iso)
                      setView('day')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target === e.currentTarget) {
                        setAnchor(cell.iso)
                        setView('day')
                      }
                    }}
                    className={`text-left rounded-lg border p-1 flex flex-col gap-0.5 overflow-hidden transition-colors cursor-pointer ${
                      cell.inMonth
                        ? 'bg-forma-surface border-forma-border hover:border-forma-accent/60'
                        : 'bg-transparent border-transparent opacity-45 hover:opacity-70'
                    }`}
                  >
                    <span
                      className={`text-[11px] leading-none w-5 h-5 flex items-center justify-center rounded-full shrink-0 ${
                        isToday ? 'bg-forma-accent text-white font-semibold' : 'text-forma-muted'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {events.slice(0, 3).map((e) => (
                      <EventPill key={e.id} event={e} onClick={() => setDraft(draftFromEvent(e))} />
                    ))}
                    {events.length > 3 && (
                      <span className="text-[10px] text-forma-muted px-1.5">+{events.length - 3}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {view === 'week' && (
          <div className="grid grid-cols-7 gap-2 p-3 min-h-full">
            {weekDays(anchor).map((iso) => {
              const events = eventsOnDay(state, iso)
              const isToday = iso === today
              const d = parseISODate(iso)
              return (
                <div key={iso} className="flex flex-col gap-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAnchor(iso)
                      setView('day')
                    }}
                    className={`text-center rounded-lg py-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      isToday ? 'bg-forma-accent/10' : ''
                    }`}
                  >
                    <div className="text-[10px] text-forma-muted">{WEEKDAY_HEADERS[(d.getDay() + 6) % 7]}</div>
                    <div className={`text-sm font-semibold ${isToday ? 'text-forma-accent' : 'text-forma-text'}`}>
                      {d.getDate()}
                    </div>
                  </button>
                  <div className="flex flex-col gap-1 flex-1">
                    {events.map((e) => (
                      <EventPill key={e.id} event={e} onClick={() => setDraft(draftFromEvent(e))} />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft(emptyDraft(iso))}
                    title={`Ajouter un événement le ${iso}`}
                    className="w-full rounded-lg border border-dashed border-forma-border text-forma-muted hover:text-forma-accent hover:border-forma-accent/60 transition-colors flex items-center justify-center py-1"
                  >
                    <Icon name="plus" className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {view === 'day' && (
          <div className="max-w-2xl mx-auto p-4 space-y-2">
            {eventsOnDay(state, anchor).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-forma-muted mb-4">Aucun événement ce jour.</p>
                <button
                  type="button"
                  onClick={() => setDraft(emptyDraft(anchor))}
                  className="text-xs px-3 py-1.5 rounded-lg border border-forma-border text-forma-text hover:border-forma-accent/60 hover:bg-forma-accent/5 transition-colors inline-flex items-center gap-1.5"
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                  Ajouter un événement
                </button>
              </div>
            ) : (
              <>
                {eventsOnDay(state, anchor).map(renderDayEvent)}
                <button
                  type="button"
                  onClick={() => setDraft(emptyDraft(anchor))}
                  className="w-full rounded-xl border border-dashed border-forma-border text-forma-muted hover:text-forma-accent hover:border-forma-accent/60 transition-colors flex items-center justify-center gap-1.5 py-2 text-xs"
                >
                  <Icon name="plus" className="w-3.5 h-3.5" />
                  Ajouter un événement
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────────── */}
      {draft && (
        <EventModal
          draft={draft}
          subjects={subjects}
          documents={documents}
          onChange={setDraft}
          onSave={saveDraft}
          onDelete={() => void deleteDraft()}
          onClose={() => setDraft(null)}
        />
      )}
    </div>
  )
}
