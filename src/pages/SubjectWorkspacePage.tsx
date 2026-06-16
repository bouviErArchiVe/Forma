/**
 * SubjectWorkspacePage — espace d'une matière (/subjects/:id) avec onglets.
 *
 * La matière est un notebook de type 'subject' ; les documents y sont liés
 * via notebook.subjectId. Agrège documents, tâches, événements et raccourcis.
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { LinkedDocuments } from '../components/workspace/LinkedDocuments'
import { TasksPanel } from '../components/tasks/TasksPanel'
import { SubjectStudyPanel } from '../components/study/SubjectStudyPanel'
import { FlashcardsPanel } from '../components/study/FlashcardsPanel'
import { TaskFromNoteButton } from '../components/study/TaskFromNoteButton'
import { db } from '../db'
import { upcomingEvents, type UpcomingEvent } from '../lib/dashboard-data'
import { listTasks } from '../services/tasks'
import { getNotebook } from '../services/library'
import type { Notebook } from '../types'

type Tab = 'overview' | 'documents' | 'tasks' | 'calendar' | 'study'

export function SubjectWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [subject, setSubject] = useState<Notebook | null>(null)
  const [docs, setDocs] = useState<Notebook[]>([])
  const [events, setEvents] = useState<UpcomingEvent[]>([])
  const [taskCount, setTaskCount] = useState(0)
  const [tab, setTab] = useState<Tab>('overview')

  const reload = useCallback(async () => {
    if (!id) return
    const nb = await getNotebook(id)
    if (!nb || nb.type !== 'subject') { navigate('/', { replace: true }); return }
    setSubject(nb)
    setDocs(await db.notebooks.filter((n) => n.subjectId === id && !n.deletedAt).toArray())
    setEvents(await upcomingEvents(8, { subjectId: id }))
    setTaskCount((await listTasks({ subjectId: id })).length)
  }, [id, navigate])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  if (!subject || !id) {
    return <div className="min-h-full flex items-center justify-center text-forma-muted text-sm">Chargement…</div>
  }

  const loadCandidates = async () =>
    db.notebooks.filter((n) => !n.deletedAt && n.type !== 'subject' && n.subjectId !== id).toArray()

  const TABS: { id: Tab; label: string; icon: 'layout' | 'folder' | 'check' | 'book' | 'sparkles' }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: 'layout' },
    { id: 'documents', label: `Documents (${docs.length})`, icon: 'folder' },
    { id: 'tasks', label: `Tâches (${taskCount})`, icon: 'check' },
    { id: 'study', label: 'Réviser', icon: 'sparkles' },
    { id: 'calendar', label: 'Échéances', icon: 'book' },
  ]

  return (
    <div className="min-h-full">
      <div className="border-b border-forma-border bg-forma-surface px-6 py-4">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-forma-muted hover:text-forma-accent transition-colors mb-2">
          <Icon name="chevron-left" className="w-3.5 h-3.5" />
          Bibliothèque
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: subject.coverColor }} />
          <h1 className="text-xl font-semibold text-forma-text flex-1 truncate">{subject.name}</h1>
          <button type="button" onClick={() => navigate(`/document/${id}`)} title="Ouvrir le document matière" className="text-xs px-2.5 py-1 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors">
            Éditer la matière
          </button>
        </div>
        <div className="flex gap-1 mt-3 flex-wrap">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-colors ${tab === t.id ? 'bg-forma-accent text-white' : 'text-forma-muted hover:text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
              <Icon name={t.icon} className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-3xl mx-auto">
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-forma-border bg-forma-surface"><p className="text-2xl font-semibold text-forma-text">{docs.length}</p><p className="text-xs text-forma-muted">documents</p></div>
              <div className="p-3 rounded-xl border border-forma-border bg-forma-surface"><p className="text-2xl font-semibold text-forma-text">{taskCount}</p><p className="text-xs text-forma-muted">tâches</p></div>
              <div className="p-3 rounded-xl border border-forma-border bg-forma-surface"><p className="text-2xl font-semibold text-forma-text">{events.length}</p><p className="text-xs text-forma-muted">échéances</p></div>
            </div>
            {/* Raccourcis création / outils */}
            <div className="flex flex-wrap gap-2">
              <Link to="/" className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5"><Icon name="plus" className="w-3.5 h-3.5" />Nouveau document</Link>
              <Link to="/formai" className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5"><Icon name="sparkles" className="w-3.5 h-3.5" />Réviser avec FormAI</Link>
            </div>
            {events.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1.5">Prochaines échéances</p>
                <div className="space-y-1">
                  {events.slice(0, 4).map((e) => (
                    <button key={e.id} type="button" onClick={() => navigate(`/document/${e.notebookId}`)} className="w-full text-left flex items-center gap-2 hover:bg-forma-bg rounded-lg px-1.5 py-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                      <span className="text-sm text-forma-text truncate flex-1">{e.title}</span>
                      <span className="text-[10px] text-forma-muted shrink-0">{e.date.slice(5)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'documents' && (
          <LinkedDocuments
            linked={docs}
            loadCandidates={loadCandidates}
            onLink={(nbId) => db.notebooks.update(nbId, { subjectId: id, updatedAt: Date.now() }).then(() => undefined)}
            onUnlink={(nbId) => db.notebooks.update(nbId, { subjectId: undefined, updatedAt: Date.now() }).then(() => undefined)}
            onChanged={() => void reload()}
          />
        )}

        {tab === 'tasks' && (
          <div className="space-y-3">
            <TaskFromNoteButton defaults={{ subjectId: id }} />
            <TasksPanel filter={{ subjectId: id }} createDefaults={{ subjectId: id }} title="Matière" onChange={() => void reload()} />
          </div>
        )}

        {tab === 'study' && (
          <div className="space-y-6">
            <FlashcardsPanel subjectId={id} />
            <div className="border-t border-forma-border pt-5">
              <SubjectStudyPanel subjectId={id} subjectName={subject.name} />
            </div>
          </div>
        )}

        {tab === 'calendar' && (
          events.length === 0 ? (
            <p className="text-xs text-forma-muted text-center py-8">Aucune échéance liée à cette matière. Liez des événements via le champ « Matière » du calendrier.</p>
          ) : (
            <div className="space-y-1">
              {events.map((e) => (
                <button key={e.id} type="button" onClick={() => navigate(`/document/${e.notebookId}`)} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/50">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                  <span className="text-sm text-forma-text truncate flex-1">{e.title}</span>
                  <span className="text-[10px] text-forma-muted shrink-0">{e.date}{e.startTime ? ` ${e.startTime}` : ''}</span>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
