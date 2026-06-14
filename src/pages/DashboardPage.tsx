/**
 * DashboardPage — tableau de bord étudiant : vue d'ensemble de Forma.
 * Documents récents, matières, événements à venir, tâches du jour / en
 * retard, favoris, raccourcis modules, accès FormAI, création rapide.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AcademicPanel } from '../components/dashboard/AcademicPanel'
import { Icon, type IconName } from '../components/ui/Icon'
import { getKindMeta } from '../lib/document-kinds'
import { formatRelativeTime } from '../lib/format-relative'
import { currentSession, weekInfo, weekRange } from '../services/academic'
import { getAllNotebooks, getFavorites } from '../services/library'
import { listProjects } from '../services/projects'
import { listQuizzes } from '../services/study-content'
import { listTasks, overdueTasks, tasksDueToday, todayISO } from '../services/tasks'
import { upcomingEvents, type UpcomingEvent } from '../lib/dashboard-data'
import type { Notebook, Project, Quiz, Task } from '../types'

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-forma-border bg-forma-surface p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-forma-text">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

const MODULE_SHORTCUTS: { label: string; icon: IconName; to: string }[] = [
  { label: 'Bibliothèque', icon: 'book', to: '/' },
  { label: 'Tâches', icon: 'check', to: '/tasks' },
  { label: 'Projets', icon: 'folder', to: '/projects' },
  { label: 'Ressources', icon: 'book', to: '/resources' },
  { label: 'Importer', icon: 'upload', to: '/import' },
  { label: 'FormAI', icon: 'sparkles', to: '/formai' },
]

export function DashboardPage() {
  const navigate = useNavigate()
  const [recent, setRecent] = useState<Notebook[]>([])
  const [subjects, setSubjects] = useState<Notebook[]>([])
  const [favorites, setFavorites] = useState<Notebook[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [weekEvents, setWeekEvents] = useState<UpcomingEvent[]>([])
  const [quizzes, setQuizzes] = useState<Quiz[]>([])

  const reload = useCallback(async () => {
    const all = await getAllNotebooks()
    const active = all.filter((n) => !n.deletedAt)
    setRecent([...active].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6))
    setSubjects(active.filter((n) => n.type === 'subject').slice(0, 8))
    setFavorites(await getFavorites())
    setProjects(await listProjects())
    setTasks(await listTasks())
    setEvents(await upcomingEvents(10))
    setQuizzes(await listQuizzes())
    // Examens / remises de la semaine de session courante
    const session = await currentSession()
    const info = session ? weekInfo(session, todayISO()) : null
    if (session && info?.week) {
      const { start, end } = weekRange(session, info.week)
      setWeekEvents(await upcomingEvents(20, { kinds: ['examen', 'remise'], from: start, to: end }))
    } else {
      setWeekEvents(await upcomingEvents(20, { kinds: ['examen', 'remise'] }))
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(reload)
    // Compteurs « live » : rafraîchit au retour sur l'onglet/fenêtre.
    const onFocus = () => void reload()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [reload])

  const today = todayISO()
  const overdue = useMemo(() => overdueTasks(tasks, today), [tasks, today])
  const dueToday = useMemo(() => tasksDueToday(tasks, today), [tasks, today])

  return (
    <div className="min-h-full p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold text-forma-text inline-flex items-center gap-2">
          <Icon name="layout" className="w-6 h-6 text-forma-accent" />
          Tableau de bord
        </h1>
        <div className="flex items-center gap-2">
          <Link to="/" className="text-xs px-3 py-1.5 rounded-lg border border-forma-border text-forma-muted hover:text-forma-accent hover:border-forma-accent/60 transition-colors">
            Bibliothèque
          </Link>
          <Link to="/formai" className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors inline-flex items-center gap-1.5">
            <Icon name="sparkles" className="w-3.5 h-3.5" />
            FormAI
          </Link>
        </div>
      </div>

      {/* Raccourcis modules */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
        {MODULE_SHORTCUTS.map((m) => (
          <button
            key={m.to}
            type="button"
            onClick={() => navigate(m.to)}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/60 transition-colors"
          >
            <Icon name={m.icon} className="w-5 h-5 text-forma-accent" />
            <span className="text-[11px] text-forma-text">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Session académique */}
      <div className="mb-4">
        <AcademicPanel />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cette semaine : examens / remises */}
        <Section title="Cette semaine" action={<Link to="/" className="text-xs text-forma-accent hover:underline">Calendriers</Link>}>
          {weekEvents.length === 0 ? (
            <p className="text-xs text-forma-muted py-2">Aucun examen ni remise cette semaine.</p>
          ) : (
            <div className="space-y-1.5">
              {weekEvents.slice(0, 6).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => navigate(`/document/${e.notebookId}`)}
                  className="w-full text-left flex items-center gap-2 hover:bg-forma-bg rounded-lg px-1.5 py-1"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-[10px] uppercase font-semibold shrink-0 text-forma-muted">{e.kind === 'examen' ? 'Examen' : 'Remise'}</span>
                  <span className="text-sm text-forma-text truncate flex-1">{e.title}</span>
                  <span className="text-[10px] text-forma-muted shrink-0">{e.date.slice(5)}</span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Révisions : quiz récents */}
        <Section title="Révisions" action={<Link to="/formai" className="text-xs text-forma-accent hover:underline">FormAI</Link>}>
          {quizzes.length === 0 ? (
            <p className="text-xs text-forma-muted py-2">Aucun quiz pour l’instant. Générez-en depuis une matière → « Réviser ».</p>
          ) : (
            <div className="space-y-1">
              {quizzes.slice(0, 6).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => q.subjectId && navigate(`/subjects/${q.subjectId}`)}
                  className="w-full text-left flex items-center gap-2 hover:bg-forma-bg rounded-lg px-1.5 py-1"
                >
                  <Icon name="sparkles" className="w-4 h-4 shrink-0 text-forma-accent" />
                  <span className="text-sm text-forma-text truncate flex-1">{q.title}</span>
                  <span className="text-[10px] text-forma-muted shrink-0">{q.questions.length} q.</span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Tâches du jour / en retard */}
        <Section title="À faire" action={<Link to="/tasks" className="text-xs text-forma-accent hover:underline">Toutes</Link>}>
          {overdue.length === 0 && dueToday.length === 0 ? (
            <p className="text-xs text-forma-muted py-2">Rien d’urgent aujourd’hui 🎉</p>
          ) : (
            <div className="space-y-2">
              {overdue.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-red-500 mb-1">En retard ({overdue.length})</p>
                  {overdue.slice(0, 4).map((t) => (
                    <p key={t.id} className="text-sm text-forma-text truncate">⚠ {t.title} <span className="text-[10px] text-red-500">{t.dueDate?.slice(5)}</span></p>
                  ))}
                </div>
              )}
              {dueToday.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-amber-500 mb-1">Aujourd’hui ({dueToday.length})</p>
                  {dueToday.slice(0, 4).map((t) => (
                    <p key={t.id} className="text-sm text-forma-text truncate">{t.title}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Prochains événements */}
        <Section title="Prochains événements" action={<Link to="/" className="text-xs text-forma-accent hover:underline">Calendriers</Link>}>
          {events.length === 0 ? (
            <p className="text-xs text-forma-muted py-2">Aucun événement à venir. Créez un calendrier pour planifier.</p>
          ) : (
            <div className="space-y-1.5">
              {events.slice(0, 6).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => navigate(`/document/${e.notebookId}`)}
                  className="w-full text-left flex items-center gap-2 hover:bg-forma-bg rounded-lg px-1.5 py-1"
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-sm text-forma-text truncate flex-1">{e.title}</span>
                  <span className="text-[10px] text-forma-muted shrink-0">{e.date.slice(5)}{e.startTime ? ` ${e.startTime}` : ''}</span>
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Documents récents */}
        <Section title="Documents récents" action={<Link to="/" className="text-xs text-forma-accent hover:underline">Tout</Link>}>
          {recent.length === 0 ? (
            <p className="text-xs text-forma-muted py-2">Aucun document. Créez-en un depuis la bibliothèque.</p>
          ) : (
            <div className="space-y-1">
              {recent.map((nb) => {
                const meta = getKindMeta(nb.type)
                return (
                  <button key={nb.id} type="button" onClick={() => navigate(`/document/${nb.id}`)} className="w-full text-left flex items-center gap-2 hover:bg-forma-bg rounded-lg px-1.5 py-1">
                    <Icon name={meta.icon} className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                    <span className="text-sm text-forma-text truncate flex-1">{nb.name}</span>
                    <span className="text-[10px] text-forma-muted shrink-0">{formatRelativeTime(nb.updatedAt)}</span>
                  </button>
                )
              })}
            </div>
          )}
        </Section>

        {/* Matières */}
        <Section title="Matières" action={<Link to="/" className="text-xs text-forma-accent hover:underline">Gérer</Link>}>
          {subjects.length === 0 ? (
            <p className="text-xs text-forma-muted py-2">Aucune matière. Créez-en une via « + Nouveau ».</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {subjects.map((s) => (
                <button key={s.id} type="button" onClick={() => navigate(`/subjects/${s.id}`)} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-forma-border hover:border-forma-accent/60 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.coverColor }} />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Projets */}
        <Section title="Projets" action={<Link to="/projects" className="text-xs text-forma-accent hover:underline">Tous</Link>}>
          {projects.length === 0 ? (
            <p className="text-xs text-forma-muted py-2">Aucun projet. Créez-en un dans l’espace Projets.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {projects.slice(0, 8).map((p) => (
                <button key={p.id} type="button" onClick={() => navigate(`/projects/${p.id}`)} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-forma-border hover:border-forma-accent/60 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </Section>

        {/* Favoris */}
        <Section title="Favoris">
          {favorites.length === 0 ? (
            <p className="text-xs text-forma-muted py-2">Aucun favori. Touchez l’étoile sur un document.</p>
          ) : (
            <div className="space-y-1">
              {favorites.slice(0, 6).map((nb) => {
                const meta = getKindMeta(nb.type)
                return (
                  <button key={nb.id} type="button" onClick={() => navigate(`/document/${nb.id}`)} className="w-full text-left flex items-center gap-2 hover:bg-forma-bg rounded-lg px-1.5 py-1">
                    <span className="text-amber-400">★</span>
                    <Icon name={meta.icon} className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                    <span className="text-sm text-forma-text truncate flex-1">{nb.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
