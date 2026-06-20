/**
 * Tests Sprint #7 (Lane E) — intégration de la base de connaissance dans la
 * recherche écosystème (`kind: 'knowledge'`) et garantie de liens valides vers
 * /dictionary?slug=… (consommés par DictionaryPage via lookupBySlug).
 *
 * Vérifie aussi le contrat HONNÊTE : un terme inconnu ne fabrique aucune entrée.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { __resetKnowledgeCache, __resetKnowledgeIndex, lookupBySlug } from './knowledge'
import { searchEcosystem } from './ecosystem-search'

beforeEach(async () => {
  await db.open()
  await db.tasks.clear()
  await db.projects.clear()
  await db.notebooks.clear()
  await db.pages.clear()
  await db.quizzes.clear()
  await db.checklists.clear()
  await db.academicSessions.clear()
  await db.flashcards.clear()
  await db.exams.clear()
  __resetKnowledgeCache()
  __resetKnowledgeIndex()
})

describe('searchEcosystem — kind knowledge', () => {
  it('remonte des entrées de la base de connaissance', async () => {
    const hits = await searchEcosystem('accessibilité')
    const k = hits.find((h) => h.kind === 'knowledge')
    expect(k).toBeDefined()
    expect(k!.title.length).toBeGreaterThan(0)
  })

  it('borne à ~5 entrées knowledge maximum', async () => {
    // « a » est trop court (filtré), on prend un terme large à fort rappel.
    const hits = await searchEcosystem('construction')
    const known = hits.filter((h) => h.kind === 'knowledge')
    expect(known.length).toBeLessThanOrEqual(5)
  })

  it('produit un lien profond /dictionary?slug=… valide et résolvable', async () => {
    const hits = await searchEcosystem('accessibilité')
    const k = hits.find((h) => h.kind === 'knowledge')
    expect(k).toBeDefined()
    expect(k!.to.startsWith('/dictionary?slug=')).toBe(true)

    // Le slug encodé dans le lien DOIT être résolvable par DictionaryPage.
    const slug = decodeURIComponent(k!.to.split('slug=')[1])
    const entry = await lookupBySlug(slug)
    expect(entry).toBeDefined()
    expect(entry!.term).toBe(k!.title)
    // Garantie source + confiance (anti-hallucination).
    expect(entry!.sources.length).toBeGreaterThan(0)
    expect(entry!.confidence).toBeTruthy()
  })

  it('terme inconnu → aucune entrée knowledge fabriquée', async () => {
    const hits = await searchEcosystem('zzzqxwk-terme-inexistant')
    expect(hits.some((h) => h.kind === 'knowledge')).toBe(false)
  })

  it('requête < 2 caractères → vide (pas de chargement de la base)', async () => {
    expect(await searchEcosystem('a')).toEqual([])
  })
})
