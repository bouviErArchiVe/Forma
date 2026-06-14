/**
 * Tests recherche écosystème (tâches, projets, normes, détails) + agrégation
 * d'événements pour le dashboard.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { createTask } from '../services/tasks'
import { createProject } from '../services/projects'
import { searchEcosystem } from './ecosystem-search'
import { upcomingEvents } from './dashboard-data'

beforeEach(async () => {
  await db.open()
  await db.tasks.clear()
  await db.projects.clear()
  await db.notebooks.clear()
  await db.pages.clear()
})

describe('searchEcosystem', () => {
  it('requête < 2 caractères → vide', async () => {
    expect(await searchEcosystem('a')).toEqual([])
  })

  it('trouve tâches, projets, normes et détails', async () => {
    await createTask({ title: 'Réviser escalier' })
    await createProject({ name: 'Maison Lévis' })

    const escalier = await searchEcosystem('escalier')
    // tâche « Réviser escalier » + fiche normative escaliers + détail escalier
    expect(escalier.some((h) => h.kind === 'task')).toBe(true)
    expect(escalier.some((h) => h.kind === 'norme')).toBe(true)
    expect(escalier.some((h) => h.kind === 'detail')).toBe(true)

    const projet = await searchEcosystem('Lévis')
    expect(projet.some((h) => h.kind === 'project' && h.title === 'Maison Lévis')).toBe(true)
  })

  it('les routes de navigation sont correctes', async () => {
    const p = await createProject({ name: 'Cuisine' })
    const hits = await searchEcosystem('cuisine')
    const proj = hits.find((h) => h.kind === 'project')
    expect(proj?.to).toBe(`/projects/${p.id}`)
  })
})

describe('upcomingEvents', () => {
  async function makeCalendar(events: unknown[]): Promise<void> {
    const nbId = `cal-${Math.random()}`
    await db.notebooks.add({
      id: nbId, folderId: null, name: 'Cal', coverColor: '#000',
      paperTemplate: 'blank', orientation: 'portrait', type: 'calendar',
      createdAt: 1, updatedAt: 1,
    })
    await db.pages.add({
      id: `p-${nbId}`, notebookId: nbId, order: 0, template: 'blank', rotation: 0,
      strokes: [], shapes: [], texts: [], images: [], stickers: [], tapes: [],
      moduleData: JSON.stringify({ v: 1, events }),
    })
  }

  it('ne retourne que les événements futurs, triés', async () => {
    const future = '2099-01-15'
    await makeCalendar([
      { id: 'a', title: 'Examen', date: future, startTime: '09:00', color: '#f00' },
      { id: 'b', title: 'Passé', date: '2000-01-01', color: '#00f' },
    ])
    const events = await upcomingEvents(10)
    expect(events.map((e) => e.title)).toContain('Examen')
    expect(events.map((e) => e.title)).not.toContain('Passé')
  })

  it('filtre par matière', async () => {
    await makeCalendar([
      { id: 'a', title: 'Cours A', date: '2099-02-01', subjectId: 's1', color: '#f00' },
      { id: 'b', title: 'Cours B', date: '2099-02-01', subjectId: 's2', color: '#0f0' },
    ])
    const events = await upcomingEvents(10, { subjectId: 's1' })
    expect(events.map((e) => e.title)).toEqual(['Cours A'])
  })

  it('JSON moduleData invalide → ignoré sans throw', async () => {
    const nbId = 'bad-cal'
    await db.notebooks.add({
      id: nbId, folderId: null, name: 'Bad', coverColor: '#000',
      paperTemplate: 'blank', orientation: 'portrait', type: 'calendar',
      createdAt: 1, updatedAt: 1,
    })
    await db.pages.add({
      id: `p-${nbId}`, notebookId: nbId, order: 0, template: 'blank', rotation: 0,
      strokes: [], shapes: [], texts: [], images: [], stickers: [], tapes: [],
      moduleData: 'pas du json',
    })
    expect(await upcomingEvents(10)).toEqual([])
  })
})
