import { db } from '../db'
import { cloneProject, createProject } from '../lib/formacombine/model'
import type { FormaCombineProject } from '../types'

export async function listProjects(): Promise<FormaCombineProject[]> {
  return db.formaCombineProjects.orderBy('updatedAt').reverse().toArray()
}

export async function getProject(id: string): Promise<FormaCombineProject | undefined> {
  return db.formaCombineProjects.get(id)
}

export async function saveProject(project: FormaCombineProject): Promise<FormaCombineProject> {
  const next = { ...project, updatedAt: Date.now() }
  await db.formaCombineProjects.put(next)
  return next
}

export async function createProjectRecord(name?: string): Promise<FormaCombineProject> {
  const project = createProject(name?.trim() || 'Combinaison')
  await db.formaCombineProjects.add(project)
  return project
}

export async function deleteProject(id: string): Promise<void> {
  await db.formaCombineProjects.delete(id)
}

export async function duplicateProject(id: string): Promise<FormaCombineProject | null> {
  const src = await getProject(id)
  if (!src) return null
  const copy = cloneProject(src)
  await db.formaCombineProjects.add(copy)
  return copy
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

export function autosaveProject(
  project: FormaCombineProject,
  delay = 500,
): Promise<FormaCombineProject> {
  return new Promise((resolve) => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      void saveProject(project).then(resolve)
    }, delay)
  })
}
