/**
 * Tests service projets (Dexie fake-indexeddb).
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { createNotebook } from './library'
import {
  createProject,
  deleteProject,
  listProjects,
  projectDocuments,
  restoreProject,
  setDocumentProject,
  toggleProjectFavorite,
  updateProject,
} from './projects'

beforeEach(async () => {
  await db.open()
  await db.projects.clear()
  await db.notebooks.clear()
  await db.pages.clear()
})

describe('projets — CRUD', () => {
  it('crée et liste les projets (récents d’abord)', async () => {
    const a = await createProject({ name: 'Maison familiale' })
    await new Promise((r) => setTimeout(r, 5))
    const b = await createProject({ name: 'École primaire' })
    const list = await listProjects()
    expect(list.map((p) => p.id)).toEqual([b.id, a.id])
    expect(a.color).toBeTruthy()
  })

  it('favori, mise à jour, soft delete + restore', async () => {
    const p = await createProject({ name: 'Cuisine' })
    await toggleProjectFavorite(p.id)
    expect((await db.projects.get(p.id))?.favorite).toBe(true)
    await updateProject(p.id, { description: 'Réno cuisine' })
    expect((await db.projects.get(p.id))?.description).toBe('Réno cuisine')
    await deleteProject(p.id)
    expect(await listProjects()).toHaveLength(0)
    await restoreProject(p.id)
    expect(await listProjects()).toHaveLength(1)
  })
})

describe('rattachement de documents', () => {
  it('lier/délier un document à un projet', async () => {
    const project = await createProject({ name: 'Détail escalier' })
    const doc = await createNotebook({ name: 'Croquis', folderId: null })
    await setDocumentProject(doc.id, project.id)
    let docs = await projectDocuments(project.id)
    expect(docs.map((d) => d.id)).toEqual([doc.id])
    await setDocumentProject(doc.id, undefined)
    docs = await projectDocuments(project.id)
    expect(docs).toHaveLength(0)
  })

  it('un document en corbeille n’apparaît pas dans le projet', async () => {
    const project = await createProject({ name: 'P' })
    const doc = await createNotebook({ name: 'D', folderId: null })
    await setDocumentProject(doc.id, project.id)
    await db.notebooks.update(doc.id, { deletedAt: Date.now() })
    expect(await projectDocuments(project.id)).toHaveLength(0)
  })
})
