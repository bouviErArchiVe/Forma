/**
 * Service projets — CRUD Dexie (table `projects`).
 *
 * Un projet regroupe documents, tâches et événements autour d'un sujet
 * concret (différent d'une matière). Les documents y sont rattachés via
 * `notebook.projectId` ; tâches et événements via `projectId`.
 */
import { db } from '../db'
import { createId } from '../lib/id'
import type { Notebook, Project } from '../types'

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

export interface CreateProjectInput {
  name: string
  color?: string
  description?: string
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const now = Date.now()
  const project: Project = {
    id: createId(),
    name: input.name.trim() || 'Nouveau projet',
    color: input.color ?? DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
    createdAt: now,
    updatedAt: now,
    ...(input.description?.trim() ? { description: input.description.trim() } : {}),
  }
  await db.projects.add(project)
  return project
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, 'id' | 'createdAt'>>,
): Promise<void> {
  await db.projects.update(id, { ...patch, updatedAt: Date.now() })
}

export async function toggleProjectFavorite(id: string): Promise<void> {
  const p = await db.projects.get(id)
  if (p) await db.projects.update(id, { favorite: !p.favorite, updatedAt: Date.now() })
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.update(id, { deletedAt: Date.now(), updatedAt: Date.now() })
}

export async function restoreProject(id: string): Promise<void> {
  await db.projects.update(id, { deletedAt: undefined, updatedAt: Date.now() })
}

/** Projets actifs, triés par date de modification décroissante. */
export async function listProjects(opts: { includeDeleted?: boolean } = {}): Promise<Project[]> {
  let list = await db.projects.toArray()
  if (!opts.includeDeleted) list = list.filter((p) => !p.deletedAt)
  return list.sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Documents (notebooks) rattachés à un projet, hors corbeille. */
export async function projectDocuments(projectId: string): Promise<Notebook[]> {
  const docs = await db.notebooks.filter((n) => n.projectId === projectId && !n.deletedAt).toArray()
  return docs.sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Rattache/détache un document à un projet. */
export async function setDocumentProject(notebookId: string, projectId: string | undefined): Promise<void> {
  await db.notebooks.update(notebookId, { projectId, updatedAt: Date.now() })
}
