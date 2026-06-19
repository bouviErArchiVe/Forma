/**
 * Tests logique pure Study Hub : agrégation transversale, filtre matière,
 * compteurs dérivés (dues / examens du jour / passages récents). Aucune
 * dépendance Dexie.
 */
import { describe, expect, it } from 'vitest'
import { buildStudyHub, hubSubjects, type HubMaterial } from './hub'
import { buildGoal } from './goals'
import type { ExamAttempt, Flashcard } from '../../types'

const NOW = 1_700_000_000_000
const DAY = 86_400_000

function attempt(p: Partial<ExamAttempt>): ExamAttempt {
  return {
    id: Math.random().toString(36).slice(2),
    examId: 'e',
    answers: [],
    score: 0,
    total: 100,
    percent: 0,
    createdAt: 0,
    ...p,
  }
}

function card(p: Partial<Flashcard>): Flashcard {
  return {
    id: Math.random().toString(36).slice(2),
    front: 'f',
    back: 'b',
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: 0,
    createdAt: 0,
    updatedAt: 0,
    ...p,
  }
}

describe('buildStudyHub', () => {
  it('matériel vide → vue cohérente à zéro', () => {
    const v = buildStudyHub({ flashcards: [], attempts: [], goals: [] }, { now: NOW })
    expect(v.subjectId).toBeNull()
    expect(v.flashcards.total).toBe(0)
    expect(v.dueCount).toBe(0)
    expect(v.exams.attempts).toBe(0)
    expect(v.examsToday).toBe(0)
    expect(v.goals.total).toBe(0)
    expect(v.recentAttempts).toEqual([])
  })

  it('agrège flashcards / examens / objectifs toutes matières confondues', () => {
    const material: HubMaterial = {
      flashcards: [
        card({ subjectId: 'm', dueDate: NOW - 1, repetitions: 0 }), // due + fraîche
        card({ subjectId: 'b', dueDate: NOW + DAY, repetitions: 3 }), // ni due ni fraîche
      ],
      attempts: [
        attempt({ subjectId: 'm', percent: 60, createdAt: NOW - 5 * DAY }),
        attempt({ subjectId: 'b', percent: 90, createdAt: NOW - 2 }),
      ],
      goals: [
        buildGoal({ title: 'g1', target: 2, progress: 2, createdAt: 1 }),
        buildGoal({ title: 'g2', target: 4, progress: 1, createdAt: 1 }),
      ],
    }
    const v = buildStudyHub(material, { now: NOW })
    expect(v.flashcards.total).toBe(2)
    expect(v.dueCount).toBe(1)
    expect(v.flashcards.fresh).toBe(1)
    expect(v.exams.attempts).toBe(2)
    expect(v.exams.bestPercent).toBe(90)
    expect(v.goals.total).toBe(2)
    expect(v.goals.done).toBe(1)
  })

  it('examsToday ne compte que les passages des dernières 24 h', () => {
    const material: HubMaterial = {
      flashcards: [],
      attempts: [
        attempt({ createdAt: NOW }), // maintenant
        attempt({ createdAt: NOW - DAY + 1 }), // tout juste dans la fenêtre
        attempt({ createdAt: NOW - DAY - 1 }), // hors fenêtre
      ],
      goals: [],
    }
    expect(buildStudyHub(material, { now: NOW }).examsToday).toBe(2)
  })

  it('recentAttempts est trié du plus récent au plus ancien et tronqué', () => {
    const material: HubMaterial = {
      flashcards: [],
      attempts: [
        attempt({ id: 'a1', createdAt: NOW - 30 * DAY, percent: 10 }),
        attempt({ id: 'a2', createdAt: NOW - 1 * DAY, percent: 20 }),
        attempt({ id: 'a3', createdAt: NOW - 2 * DAY, percent: 30 }),
      ],
      goals: [],
    }
    const v = buildStudyHub(material, { now: NOW, recentLimit: 2 })
    expect(v.recentAttempts.map((a) => a.id)).toEqual(['a2', 'a3'])
  })

  it('filtre par matière : n’agrège que le matériel de la matière', () => {
    const material: HubMaterial = {
      flashcards: [
        card({ subjectId: 'm', dueDate: NOW - 1 }),
        card({ subjectId: 'b', dueDate: NOW - 1 }),
      ],
      attempts: [
        attempt({ subjectId: 'm', percent: 50, createdAt: NOW }),
        attempt({ subjectId: 'b', percent: 99, createdAt: NOW }),
      ],
      goals: [
        buildGoal({ title: 'gm', subjectId: 'm', target: 1, progress: 1, createdAt: 1 }),
        buildGoal({ title: 'gb', subjectId: 'b', target: 1, progress: 0, createdAt: 1 }),
      ],
    }
    const v = buildStudyHub(material, { now: NOW, subjectId: 'm' })
    expect(v.subjectId).toBe('m')
    expect(v.flashcards.total).toBe(1)
    expect(v.dueCount).toBe(1)
    expect(v.exams.attempts).toBe(1)
    expect(v.exams.bestPercent).toBe(50)
    expect(v.goals.total).toBe(1)
    expect(v.goals.done).toBe(1)
  })
})

describe('hubSubjects', () => {
  it('ne renvoie que les matières avec du matériel ET un nom connu, triées', () => {
    const material: HubMaterial = {
      flashcards: [card({ subjectId: 'maths' })],
      attempts: [attempt({ subjectId: 'bio' })],
      goals: [buildGoal({ title: 'g', subjectId: 'inconnu', target: 1, createdAt: 1 })],
    }
    const names = { maths: 'Maths', bio: 'Bio' /* 'inconnu' absent */ }
    const subjects = hubSubjects(material, names)
    // 'inconnu' filtré (pas de nom), tri par nom : Bio avant Maths
    expect(subjects).toEqual([
      { id: 'bio', name: 'Bio' },
      { id: 'maths', name: 'Maths' },
    ])
  })

  it('ignore le matériel sans matière', () => {
    const material: HubMaterial = {
      flashcards: [card({})],
      attempts: [attempt({})],
      goals: [],
    }
    expect(hubSubjects(material, {})).toEqual([])
  })
})
