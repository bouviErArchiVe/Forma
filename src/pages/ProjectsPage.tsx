/**
 * ProjectsPage — liste et création de projets (espace de travail par sujet
 * concret, distinct des matières).
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { formatRelativeTime } from '../lib/format-relative'
import { createProject, listProjects } from '../services/projects'
import { projectDocuments } from '../services/projects'
import type { Project } from '../types'

export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [newName, setNewName] = useState('')

  const load = async () => {
    const list = await listProjects()
    setProjects(list)
    const c: Record<string, number> = {}
    for (const p of list) c[p.id] = (await projectDocuments(p.id)).length
    setCounts(c)
  }

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [])

  const create = async () => {
    if (newName.trim() === '') return
    const p = await createProject({ name: newName })
    setNewName('')
    navigate(`/projects/${p.id}`)
  }

  return (
    <div className="min-h-full p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors">
          <Icon name="chevron-left" className="w-4 h-4" />
          Tableau de bord
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-forma-text inline-flex items-center gap-2 mb-4">
        <Icon name="folder" className="w-5 h-5 text-forma-accent" />
        Projets
      </h1>

      <div className="flex gap-1.5 mb-5 max-w-md">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void create() }}
          placeholder="Nom du projet (ex. Maison familiale)…"
          className="flex-1 text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent"
        />
        <button type="button" onClick={() => void create()} disabled={newName.trim() === ''} className="text-xs px-3 py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors inline-flex items-center gap-1">
          <Icon name="plus" className="w-3.5 h-3.5" />
          Créer
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-forma-border rounded-xl">
          <Icon name="folder" className="w-8 h-8 mx-auto text-forma-muted mb-2" />
          <p className="text-sm text-forma-muted">Aucun projet. Un projet regroupe documents, tâches et événements autour d’un sujet concret.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {projects.map((p) => (
            <button key={p.id} type="button" onClick={() => navigate(`/projects/${p.id}`)} className="text-left p-4 rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/60 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-medium text-forma-text truncate flex-1">{p.name}</span>
                {p.favorite && <span className="text-amber-400 text-xs">★</span>}
              </div>
              {p.description && <p className="text-xs text-forma-muted line-clamp-2 mb-1">{p.description}</p>}
              <p className="text-[10px] text-forma-muted">{counts[p.id] ?? 0} document(s) · {formatRelativeTime(p.updatedAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
