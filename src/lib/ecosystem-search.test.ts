/**
 * Tests recherche écosystème (tâches, projets, normes, détails) + agrégation
 * d'événements pour le dashboard.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { createTask } from '../services/tasks'
import { createProject } from '../services/projects'
import { createSession } from '../services/academic'
import { saveChecklist, saveQuiz } from '../services/study-content'
import { searchEcosystem } from './ecosystem-search'
import { upcomingEvents } from './dashboard-data'

beforeEach(async () => {
  await db.open()
  await db.tasks.clear()
  await db.projects.clear()
  await db.notebooks.clear()
  await db.pages.clear()
  await db.quizzes.clear()
  await db.checklists.clear()
  await db.academicSessions.clear()
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

  it('trouve des matériaux (catalogue statique)', async () => {
    const acier = await searchEcosystem('acier')
    expect(acier.some((h) => h.kind === 'material')).toBe(true)
    const hit = acier.find((h) => h.kind === 'material')
    expect(hit?.to).toBe('/resources')
  })

  it('trouve des vérifications de conformité (catalogue statique)', async () => {
    const gc = await searchEcosystem('garde-corps')
    const hit = gc.find((h) => h.kind === 'compliance')
    expect(hit).toBeDefined()
    expect(hit?.to).toBe('/compliance')
  })

  it('les routes de navigation sont correctes', async () => {
    const p = await createProject({ name: 'Cuisine' })
    const hits = await searchEcosystem('cuisine')
    const proj = hits.find((h) => h.kind === 'project')
    expect(proj?.to).toBe(`/projects/${p.id}`)
  })

  it('V3 : trouve quiz, checklists et sessions', async () => {
    await saveQuiz({
      title: 'Quiz thermodynamique', subjectId: 's1', source: 'local',
      questions: [{ id: 'q1', type: 'short', question: 'Loi de Fourier ?', answer: 'flux' }],
    })
    await saveChecklist({
      title: 'Checklist remise maquette', projectId: 'p1', source: 'local',
      items: ['Vérifier échelle', 'Exporter PDF'],
    })
    await createSession({ term: 'automne', year: 2026, startDate: '2026-09-07' })

    const quiz = await searchEcosystem('thermodynamique')
    expect(quiz.some((h) => h.kind === 'quiz' && h.to === '/subjects/s1')).toBe(true)

    const check = await searchEcosystem('maquette')
    expect(check.some((h) => h.kind === 'checklist' && h.to === '/projects/p1')).toBe(true)

    const session = await searchEcosystem('automne')
    expect(session.some((h) => h.kind === 'session')).toBe(true)
  })

  it('V3 : recherche dans le contenu des quiz et checklists', async () => {
    await saveQuiz({
      title: 'Quiz A', source: 'local',
      questions: [{ id: 'q1', type: 'short', question: 'Définir la flèche admissible', answer: 'L/360' }],
    })
    await saveChecklist({ title: 'Checklist B', source: 'local', items: ['Contrôler le drainage périphérique'] })

    expect((await searchEcosystem('flèche')).some((h) => h.kind === 'quiz')).toBe(true)
    expect((await searchEcosystem('drainage')).some((h) => h.kind === 'checklist')).toBe(true)
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

  it('filtre par projet (relation événement↔projet)', async () => {
    await makeCalendar([
      { id: 'a', title: 'Jalon projet', date: '2099-03-01', projectId: 'p1', color: '#f00' },
      { id: 'b', title: 'Autre', date: '2099-03-01', projectId: 'p2', color: '#0f0' },
    ])
    const events = await upcomingEvents(10, { projectId: 'p1' })
    expect(events.map((e) => e.title)).toEqual(['Jalon projet'])
  })

  it('filtre par type (examens / remises) et par intervalle', async () => {
    await makeCalendar([
      { id: 'a', title: 'Examen final', date: '2099-04-10', kind: 'examen', color: '#f00' },
      { id: 'b', title: 'Remise rapport', date: '2099-04-12', kind: 'remise', color: '#0f0' },
      { id: 'c', title: 'Cours magistral', date: '2099-04-11', kind: 'cours', color: '#00f' },
      { id: 'd', title: 'Examen hors période', date: '2099-05-10', kind: 'examen', color: '#f0f' },
    ])
    const events = await upcomingEvents(10, { kinds: ['examen', 'remise'], from: '2099-04-01', to: '2099-04-30' })
    expect(events.map((e) => e.title).sort()).toEqual(['Examen final', 'Remise rapport'])
    expect(events.every((e) => e.kind === 'examen' || e.kind === 'remise')).toBe(true)
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
