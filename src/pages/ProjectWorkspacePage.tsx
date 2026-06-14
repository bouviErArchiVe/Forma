/**
 * ProjectWorkspacePage — espace d'un projet (/projects/:id) avec onglets :
 * vue d'ensemble, documents, tâches, FormAI. Regroupe documents (notebook.
 * projectId), tâches (projectId) et notes (description).
 */
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { LinkedDocuments } from '../components/workspace/LinkedDocuments'
import { TasksPanel } from '../components/tasks/TasksPanel'
import { db } from '../db'
import { listTasks } from '../services/tasks'
import {
  deleteProject,
  getProject,
  projectDocuments,
  setDocumentProject,
  toggleProjectFavorite,
  updateProject,
} from '../services/projects'
import { confirm } from '../stores/confirmStore'
import { useToastStore } from '../stores/toastStore'
import type { Notebook, Project } from '../types'

type Tab = 'overview' | 'documents' | 'tasks'

export function ProjectWorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [docs, setDocs] = useState<Notebook[]>([])
  const [taskCount, setTaskCount] = useState(0)
  const [tab, setTab] = useState<Tab>('overview')
  const [desc, setDesc] = useState('')

  const reload = useCallback(async () => {
    if (!id) return
    const p = await getProject(id)
    if (!p) { navigate('/projects', { replace: true }); return }
    setProject(p)
    setDesc(p.description ?? '')
    setDocs(await projectDocuments(id))
    setTaskCount((await listTasks({ projectId: id })).length)
  }, [id, navigate])

  useEffect(() => {
    void Promise.resolve().then(reload)
  }, [reload])

  if (!project || !id) {
    return <div className="min-h-full flex items-center justify-center text-forma-muted text-sm">Chargement…</div>
  }

  const saveDesc = async () => {
    if (desc !== (project.description ?? '')) {
      await updateProject(id, { description: desc })
      setProject({ ...project, description: desc })
    }
  }

  const loadCandidates = async () =>
    db.notebooks.filter((n) => !n.deletedAt && n.type !== 'subject' && n.projectId !== id).toArray()

  const TABS: { id: Tab; label: string; icon: 'layout' | 'folder' | 'check' }[] = [
    { id: 'overview', label: 'Vue d’ensemble', icon: 'layout' },
    { id: 'documents', label: `Documents (${docs.length})`, icon: 'folder' },
    { id: 'tasks', label: `Tâches (${taskCount})`, icon: 'check' },
  ]

  return (
    <div className="min-h-full">
      {/* En-tête projet */}
      <div className="border-b border-forma-border bg-forma-surface px-6 py-4">
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-forma-muted hover:text-forma-accent transition-colors mb-2">
          <Icon name="chevron-left" className="w-3.5 h-3.5" />
          Projets
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
          <h1 className="text-xl font-semibold text-forma-text flex-1 truncate">{project.name}</h1>
          <button type="button" title={project.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} onClick={async () => { await toggleProjectFavorite(id); await reload() }} className="p-1 text-forma-muted hover:text-amber-400">
            <Icon name={project.favorite ? 'star' : 'star-outline'} className={`w-4 h-4 ${project.favorite ? 'text-amber-400' : ''}`} />
          </button>
          <button type="button" title="Supprimer le projet" onClick={async () => { const ok = await confirm(`Supprimer le projet « ${project.name} » ? (les documents ne sont pas supprimés)`, { confirmLabel: 'Supprimer', danger: true }); if (ok) { await deleteProject(id); useToastStore.getState().show('Projet supprimé'); navigate('/projects') } }} className="p-1 text-forma-muted hover:text-red-500">
            <Icon name="trash" className="w-4 h-4" />
          </button>
        </div>
        {/* Onglets */}
        <div className="flex gap-1 mt-3">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-forma-border bg-forma-surface">
                <p className="text-2xl font-semibold text-forma-text">{docs.length}</p>
                <p className="text-xs text-forma-muted">documents</p>
              </div>
              <div className="p-3 rounded-xl border border-forma-border bg-forma-surface">
                <p className="text-2xl font-semibold text-forma-text">{taskCount}</p>
                <p className="text-xs text-forma-muted">tâches</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1">Notes du projet</p>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                onBlur={() => void saveDesc()}
                rows={4}
                placeholder="Objectifs, portée, idées…"
                className="w-full text-sm border border-forma-border rounded-lg px-3 py-2 bg-forma-surface resize-y focus:outline-none focus:border-forma-accent"
              />
            </div>
            <Link to="/formai" className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors">
              <Icon name="sparkles" className="w-3.5 h-3.5" />
              Travailler avec FormAI
            </Link>
          </div>
        )}

        {tab === 'documents' && (
          <LinkedDocuments
            linked={docs}
            loadCandidates={loadCandidates}
            onLink={(nbId) => setDocumentProject(nbId, id)}
            onUnlink={(nbId) => setDocumentProject(nbId, undefined)}
            onChanged={() => void reload()}
          />
        )}

        {tab === 'tasks' && (
          <TasksPanel filter={{ projectId: id }} createDefaults={{ projectId: id }} title="Projet" />
        )}
      </div>
    </div>
  )
}
