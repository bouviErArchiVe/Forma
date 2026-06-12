/**
 * PresenceModule — suivi de présence Forma V2.
 *
 * Séances (présent / absent / retard) persistées dans page.moduleData via
 * ModuleHost. Stats globales + par matière (retard compté comme présent
 * dans le taux — voir presence-data.ts), ajout rapide, filtre par matière,
 * cycle de statut au clic sur le badge, suppression avec confirmation.
 */
import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { db } from '../../db'
import { createId } from '../../lib/id'
import { confirm } from '../../stores/confirmStore'
import { useToastStore } from '../../stores/toastStore'
import type { Notebook } from '../../types'
import type { ModuleProps } from '../ModuleHost'
import {
  attendanceStats,
  cycleStatus,
  parsePresenceState,
  serializePresenceState,
  sortByDateDesc,
  subjectKey,
  todayISO,
  type AttendanceStatus,
  type PresenceState,
  type Session,
} from './presence-data'

// ─── Méta des statuts ─────────────────────────────────────────────────────────

const STATUS_META: Record<AttendanceStatus, { label: string; badge: string; active: string }> = {
  present: {
    label: 'Présent',
    badge: 'bg-green-500/15 text-green-600 dark:text-green-400',
    active: 'bg-green-500 text-white border-green-500',
  },
  absent: {
    label: 'Absent',
    badge: 'bg-red-500/15 text-red-600 dark:text-red-400',
    active: 'bg-red-500 text-white border-red-500',
  },
  late: {
    label: 'Retard',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    active: 'bg-amber-500 text-white border-amber-500',
  },
}

const STATUS_ORDER: AttendanceStatus[] = ['present', 'absent', 'late']

/** Couleur de la barre de progression selon le taux (seuils 90 / 75). */
function pctBarColor(pct: number): string {
  if (pct >= 90) return 'bg-green-500'
  if (pct >= 75) return 'bg-amber-500'
  return 'bg-red-500'
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, 12).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Carte de stat ────────────────────────────────────────────────────────────

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-forma-border bg-forma-surface px-3 py-2.5">
      <div className={`text-xl font-bold tabular-nums ${accent ?? 'text-forma-text'}`}>{value}</div>
      <div className="text-[11px] text-forma-muted">{label}</div>
    </div>
  )
}

// ─── Module ──────────────────────────────────────────────────────────────────

const FREE_LABEL = '__free__'

export function PresenceModule({ data, onDataChange }: ModuleProps) {
  const [state, setState] = useState<PresenceState>(() => parsePresenceState(data))
  const [subjects, setSubjects] = useState<Notebook[]>([])
  const [filter, setFilter] = useState<string>('all')

  // Formulaire d'ajout rapide
  const [subjectChoice, setSubjectChoice] = useState<string>(FREE_LABEL)
  const [freeLabel, setFreeLabel] = useState('')
  const [date, setDate] = useState<string>(todayISO())
  const [status, setStatus] = useState<AttendanceStatus>('present')
  const [note, setNote] = useState('')

  // Matières (notebooks 'subject' non supprimés)
  useEffect(() => {
    let cancelled = false
    void db.notebooks
      .filter((n) => n.type === 'subject' && !n.deletedAt)
      .toArray()
      .then((list) => {
        if (cancelled) return
        const sorted = list.slice().sort((a, b) => a.name.localeCompare(b.name))
        setSubjects(sorted)
        // Pré-sélectionne la première matière disponible
        if (sorted.length > 0) setSubjectChoice((prev) => (prev === FREE_LABEL ? sorted[0].id : prev))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const subjectById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects])
  const stats = useMemo(() => attendanceStats(state.sessions), [state.sessions])

  const update = (sessions: Session[]) => {
    const next: PresenceState = { v: 1, sessions }
    setState(next)
    onDataChange(serializePresenceState(next))
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  const addSession = () => {
    const subject = subjectChoice !== FREE_LABEL ? subjectById.get(subjectChoice) : undefined
    const label = subject ? subject.name : freeLabel.trim()
    if (!label || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    const session: Session = {
      id: createId(),
      subjectLabel: label,
      date,
      status,
      ...(subject ? { subjectId: subject.id } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    }
    update([...state.sessions, session])
    setNote('')
    useToastStore.getState().show('Séance ajoutée')
  }

  const cycleSessionStatus = (id: string) => {
    update(state.sessions.map((s) => (s.id === id ? { ...s, status: cycleStatus(s.status) } : s)))
  }

  const deleteSession = async (session: Session) => {
    const ok = await confirm(
      `Supprimer la séance « ${session.subjectLabel} » du ${formatDate(session.date)} ?`,
      { title: 'Supprimer la séance', confirmLabel: 'Supprimer', danger: true },
    )
    if (!ok) return
    update(state.sessions.filter((s) => s.id !== session.id))
    useToastStore.getState().show('Séance supprimée')
  }

  // ── Liste filtrée ──────────────────────────────────────────────────────────
  const visibleSessions = useMemo(() => {
    const sorted = sortByDateDesc(state.sessions)
    if (filter === 'all') return sorted
    return sorted.filter((s) => subjectKey(s) === filter)
  }, [state.sessions, filter])

  const canAdd =
    (subjectChoice !== FREE_LABEL || freeLabel.trim() !== '') && /^\d{4}-\d{2}-\d{2}$/.test(date)

  const field = 'text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent focus:ring-1 focus:ring-forma-accent/30'

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* ── Cartes de stats globales ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            label="Taux de présence"
            value={`${stats.global.presentPct} %`}
            accent={
              stats.global.total === 0
                ? 'text-forma-muted'
                : stats.global.presentPct >= 90
                  ? 'text-green-500'
                  : stats.global.presentPct >= 75
                    ? 'text-amber-500'
                    : 'text-red-500'
            }
          />
          <StatCard label="Séances" value={String(stats.global.total)} />
          <StatCard label="Absences" value={String(stats.global.absent)} accent="text-red-500" />
          <StatCard label="Retards" value={String(stats.global.late)} accent="text-amber-500" />
        </div>

        {/* ── Stats par matière ──────────────────────────────────────────────── */}
        {stats.bySubject.length > 0 && (
          <div className="rounded-xl border border-forma-border bg-forma-surface p-3 space-y-2.5">
            <h2 className="text-xs font-semibold text-forma-muted uppercase tracking-wide">
              Par matière
            </h2>
            {stats.bySubject.map((s) => {
              const subject = s.subjectId ? subjectById.get(s.subjectId) : undefined
              return (
                <div key={s.key}>
                  <div className="flex items-center gap-2 text-xs mb-1">
                    {subject && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: subject.coverColor }}
                      />
                    )}
                    <span className="font-medium text-forma-text truncate">{s.label}</span>
                    <span className="text-forma-muted shrink-0">
                      {s.total} séance{s.total > 1 ? 's' : ''}
                    </span>
                    <span className="flex-1" />
                    <span className="font-semibold tabular-nums text-forma-text shrink-0">
                      {s.presentPct} %
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pctBarColor(s.presentPct)}`}
                      style={{ width: `${s.presentPct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Ajout rapide ───────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-forma-border bg-forma-surface p-3">
          <h2 className="text-xs font-semibold text-forma-muted uppercase tracking-wide mb-2">
            Nouvelle séance
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {subjects.length > 0 ? (
              <select
                value={subjectChoice}
                onChange={(e) => setSubjectChoice(e.target.value)}
                title="Matière"
                className={`${field} min-w-36`}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value={FREE_LABEL}>Autre…</option>
              </select>
            ) : null}
            {(subjects.length === 0 || subjectChoice === FREE_LABEL) && (
              <input
                type="text"
                value={freeLabel}
                onChange={(e) => setFreeLabel(e.target.value)}
                placeholder="Libellé de la matière"
                className={`${field} min-w-40 flex-1`}
              />
            )}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              title="Date de la séance"
              className={field}
            />
            <div className="flex rounded-lg border border-forma-border overflow-hidden">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`text-xs px-2.5 py-1.5 transition-colors border-0 ${
                    status === s
                      ? STATUS_META[s].active
                      : 'text-forma-muted hover:text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canAdd) addSession()
              }}
              placeholder="Note (optionnel)"
              className={`${field} flex-1 min-w-32`}
            />
            <button
              type="button"
              onClick={addSession}
              disabled={!canAdd}
              className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors inline-flex items-center gap-1.5"
            >
              <Icon name="plus" className="w-3.5 h-3.5" />
              Ajouter
            </button>
          </div>
        </div>

        {/* ── Liste des séances ──────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold text-forma-muted uppercase tracking-wide">
              Séances
            </h2>
            <div className="flex-1" />
            {stats.bySubject.length > 1 && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                title="Filtrer par matière"
                className={field}
              >
                <option value="all">Toutes les matières</option>
                {stats.bySubject.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            )}
          </div>

          {visibleSessions.length === 0 ? (
            <p className="text-sm text-forma-muted text-center py-8">
              Aucune séance enregistrée. Ajoutez votre première séance ci-dessus.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {visibleSessions.map((session) => {
                const subject = session.subjectId ? subjectById.get(session.subjectId) : undefined
                return (
                  <li
                    key={session.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface"
                  >
                    <button
                      type="button"
                      onClick={() => cycleSessionStatus(session.id)}
                      title="Changer le statut (présent → absent → retard)"
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 transition-colors ${STATUS_META[session.status].badge}`}
                    >
                      {STATUS_META[session.status].label}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm">
                        {subject && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: subject.coverColor }}
                          />
                        )}
                        <span className="font-medium text-forma-text truncate">
                          {session.subjectLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-forma-muted">
                        {formatDate(session.date)}
                        {session.note && <span> — {session.note}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteSession(session)}
                      title="Supprimer la séance"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-forma-muted hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
