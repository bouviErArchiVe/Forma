/**
 * Tests générateurs d'étude locaux : quiz, révision, checklist, tâche-depuis-note.
 */
import { describe, expect, it } from 'vitest'
import {
  generateChecklistLocal,
  generateQuizLocal,
  prepareRevisionLocal,
  splitSentences,
  taskFromNote,
} from './study-generators'

const SAMPLE =
  'Le béton armé combine béton et acier. La résistance en compression dépend du rapport eau-ciment. ' +
  'Le pare-vapeur se place du côté chaud en climat froid. Les solives de plancher supportent les charges. ' +
  'Un escalier confortable respecte la règle de Blondel.'

describe('splitSentences', () => {
  it('découpe en phrases utiles', () => {
    const s = splitSentences(SAMPLE)
    expect(s.length).toBeGreaterThanOrEqual(4)
  })
})

describe('generateQuizLocal', () => {
  it('génère des questions vrai/faux et réponses courtes', () => {
    const q = generateQuizLocal(SAMPLE, 6)
    expect(q.length).toBeGreaterThan(0)
    expect(q.length).toBeLessThanOrEqual(6)
    expect(q.every((x) => x.question.length > 0 && x.answer.length > 0)).toBe(true)
    expect(q.some((x) => x.type === 'truefalse')).toBe(true)
  })

  it('texte vide → aucune question', () => {
    expect(generateQuizLocal('', 6)).toEqual([])
  })
})

describe('prepareRevisionLocal', () => {
  it('produit résumé, concepts et points', () => {
    const r = prepareRevisionLocal(SAMPLE)
    expect(r.summary.length).toBeGreaterThan(0)
    expect(r.concepts.length).toBeGreaterThan(0)
    expect(r.points.length).toBeGreaterThan(0)
  })
})

describe('generateChecklistLocal', () => {
  it('produit des étapes, signale les manques', () => {
    const full = generateChecklistLocal({ documentCount: 3, taskTitles: ['a', 'b'], hasEvents: true })
    expect(full.length).toBeGreaterThanOrEqual(5)
    expect(full.some((i) => i.includes('3 document'))).toBe(true)

    const empty = generateChecklistLocal({ documentCount: 0, taskTitles: [], hasEvents: false })
    expect(empty.some((i) => i.startsWith('⚠'))).toBe(true)
  })
})

describe('taskFromNote', () => {
  const TODAY = '2026-06-10' // mercredi

  it('« remettre le rapport lundi » → titre + échéance lundi', () => {
    const s = taskFromNote('remettre le rapport lundi', TODAY)
    expect(s).not.toBeNull()
    expect(s!.title.toLowerCase()).toContain('rapport')
    expect(s!.dueDate).toBe('2026-06-15') // prochain lundi
  })

  it('« examen urgent demain » → priorité haute, demain', () => {
    const s = taskFromNote('examen urgent demain', TODAY)
    expect(s!.priority).toBe('high')
    expect(s!.dueDate).toBe('2026-06-11')
  })

  it('note vide → null', () => {
    expect(taskFromNote('', TODAY)).toBeNull()
  })

  it('sans date → pas d’échéance, priorité moyenne', () => {
    const s = taskFromNote('réviser les notes', TODAY)
    expect(s!.dueDate).toBeUndefined()
    expect(s!.priority).toBe('medium')
  })
})
