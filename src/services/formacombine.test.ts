import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import {
  blankPage,
  clonePage,
  createProject,
  reorderPages,
  textPage,
  titlePage,
} from '../lib/formacombine/model'
import { safeFilename } from '../lib/formacombine/render'
import {
  createProjectRecord,
  deleteProject,
  duplicateProject,
  getProject,
  listProjects,
  saveProject,
} from './formacombine'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('formacombine service', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('creates and lists projects', async () => {
    await createProjectRecord('Mon dossier')
    const list = await listProjects()
    expect(list).toHaveLength(1)
    expect(list[0]?.name).toBe('Mon dossier')
  })

  it('saves project with pages', async () => {
    const project = await createProjectRecord('Test')
    const updated = await saveProject({
      ...project,
      pages: [blankPage(), titlePage('Intro')],
    })
    const row = await getProject(project.id)
    expect(row?.pages).toHaveLength(2)
    expect(updated.updatedAt).toBeGreaterThanOrEqual(project.updatedAt)
  })

  it('duplicates and deletes project', async () => {
    const project = await createProjectRecord('Original')
    const copy = await duplicateProject(project.id)
    expect(copy?.name).toContain('copie')
    expect(await listProjects()).toHaveLength(2)
    await deleteProject(project.id)
    expect(await listProjects()).toHaveLength(1)
  })
})

describe('formacombine model', () => {
  it('reorderPages moves item', () => {
    const pages = [textPage('A', 'a'), textPage('B', 'b'), textPage('C', 'c')]
    const next = reorderPages(pages, 0, 2)
    expect(next[2]?.name).toBe('a')
  })

  it('clonePage assigns new id', () => {
    const page = blankPage()
    const copy = clonePage(page)
    expect(copy.id).not.toBe(page.id)
  })

  it('safeFilename sanitizes name', () => {
    expect(safeFilename('Projet #1!', 'pdf')).toBe('Projet _1_.pdf')
  })
})

describe('formacombine createProject', () => {
  it('defaults pageNumbers to true', () => {
    const p = createProject()
    expect(p.settings.pageNumbers).toBe(true)
    expect(p.pages).toEqual([])
  })
})
