/**
 * Tests des actions FormAI sur le canvas.
 *
 * Couvre : builders de prompt (purs), honnêteté du mode local (jamais
 * d'invention, message clair sur page vide), orchestration Dexie en
 * lecture seule, et suggestion de tâche (confirmation côté UI uniquement).
 *
 * En l'absence de configuration cloud (aiStore par défaut : local, cloud
 * désactivé), runCanvasAction passe par le provider local honnête.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import {
  AI_DISCLAIMER,
  EMPTY_PAGE_MESSAGE,
  INK_ONLY_NOTE,
  buildExplainPrompt,
  buildPrompt,
  buildSummarizePrompt,
  runCanvasAction,
  runDocumentAction,
  runPageAction,
  suggestTaskFromText,
} from './canvas-actions'
import { extractPageContext } from './canvas-context'
import type { Page } from '../../types'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

function makePage(partial: Partial<Page>): Page {
  return {
    id: 'p1',
    notebookId: 'nb1',
    order: 0,
    template: 'blank',
    strokes: [],
    shapes: [],
    texts: [],
    images: [],
    stickers: [],
    tapes: [],
    rotation: 0,
    ...partial,
  }
}

beforeEach(async () => {
  await resetDb()
})

// ─── Builders de prompt (purs) ────────────────────────────────────────────────

describe('builders de prompt', () => {
  it('buildExplainPrompt inclut titre, contexte et garde anti-hallucination', () => {
    const { system, user } = buildExplainPrompt('Mur extérieur', 'Texte de la page.')
    expect(user).toContain('Mur extérieur')
    expect(user).toContain('Texte de la page.')
    expect(system.toLowerCase()).toContain('invente')
    expect(system).toContain('UNIQUEMENT sur le texte')
  })

  it('buildSummarizePrompt demande des points clés', () => {
    const { system, user } = buildSummarizePrompt('Doc', 'contenu')
    expect(user.toLowerCase()).toContain('résume')
    expect(system.toLowerCase()).toContain('résumé')
  })

  it('titre vide → libellé de repli', () => {
    const { user } = buildExplainPrompt('   ', 'x')
    expect(user).toContain('Document sans titre')
  })

  it('buildPrompt route selon le type d’action', () => {
    expect(buildPrompt('explain', 't', 'c').user).toContain('Explique')
    expect(buildPrompt('summarize', 't', 'c').user.toLowerCase()).toContain('résume')
  })

  it('aucun prompt ne contient de référence normative inventée', () => {
    const { system } = buildExplainPrompt('t', 'c')
    expect(system).toMatch(/référence normative/i)
    expect(system).toContain('aucune')
  })
})

// ─── Honnêteté mode local ─────────────────────────────────────────────────────

describe('runCanvasAction — page vide (honnêteté)', () => {
  it('retourne un message clair sans appeler le provider', async () => {
    const ctx = extractPageContext(makePage({}))
    const res = await runCanvasAction({ kind: 'explain', title: 'Vide', context: ctx })
    expect(res.empty).toBe(true)
    expect(res.text).toBe(EMPTY_PAGE_MESSAGE)
    expect(res.fromCloud).toBe(false)
  })
})

describe('runCanvasAction — mode local', () => {
  it('produit une réponse locale honnête (fromCloud false, pas d’erreur)', async () => {
    const ctx = extractPageContext(
      makePage({
        content:
          '<p>La toiture végétalisée retient l’eau de pluie. Elle améliore l’isolation thermique du bâtiment. Elle favorise la biodiversité en ville.</p>',
      }),
    )
    const res = await runCanvasAction({ kind: 'summarize', title: 'Toiture', context: ctx })
    expect(res.empty).toBe(false)
    expect(res.fromCloud).toBe(false)
    expect(res.providerId).toBe('local')
    expect(res.text.trim().length).toBeGreaterThan(0)
  })

  it('marque la note OCR quand le texte vient seulement de l’encre', async () => {
    const ctx = extractPageContext(
      makePage({
        inkText:
          'note manuscrite reconnue par OCR contenant suffisamment de texte pour analyse extractive locale.',
      }),
    )
    const res = await runCanvasAction({ kind: 'explain', title: 'Croquis', context: ctx })
    expect(res.note).toBe(INK_ONLY_NOTE)
  })

  it('respecte le budget de contexte (tronque les gros textes)', async () => {
    const big = 'phrase utile et longue. '.repeat(2000)
    const ctx = extractPageContext(makePage({ pdfText: big }))
    const res = await runCanvasAction({
      kind: 'summarize',
      title: 'Gros doc',
      context: ctx,
      budget: 400,
    })
    expect(res.empty).toBe(false)
    expect(res.text.trim().length).toBeGreaterThan(0)
  })
})

// ─── Orchestration Dexie (lecture seule) ──────────────────────────────────────

describe('runPageAction', () => {
  it('lit la page depuis Dexie et l’analyse', async () => {
    const page = makePage({
      id: 'pageX',
      content: '<p>Le pare-vapeur se place côté chaud du mur en climat froid.</p>',
    })
    await db.pages.add(page)
    const res = await runPageAction('pageX', 'explain', 'Mur')
    expect(res).toBeDefined()
    expect(res?.empty).toBe(false)
  })

  it('page introuvable → undefined', async () => {
    const res = await runPageAction('inexistant', 'explain', 'X')
    expect(res).toBeUndefined()
  })

  it('ne modifie pas la page lue (lecture seule)', async () => {
    const page = makePage({ id: 'pageY', content: '<p>Contenu original.</p>' })
    await db.pages.add(page)
    await runPageAction('pageY', 'summarize', 'Y')
    const after = await db.pages.get('pageY')
    expect(after?.content).toBe('<p>Contenu original.</p>')
  })
})

describe('runDocumentAction', () => {
  it('agrège toutes les pages d’un carnet', async () => {
    await db.pages.bulkAdd([
      makePage({ id: 'd1', notebookId: 'nbDoc', order: 0, content: '<p>Intro du document.</p>' }),
      makePage({ id: 'd2', notebookId: 'nbDoc', order: 1, content: '<p>Suite du document.</p>' }),
    ])
    const res = await runDocumentAction('nbDoc', 'summarize', 'Carnet')
    expect(res.empty).toBe(false)
    expect(res.text.trim().length).toBeGreaterThan(0)
  })

  it('carnet sans texte → message page vide', async () => {
    await db.pages.add(makePage({ id: 'e1', notebookId: 'nbEmpty', order: 0 }))
    const res = await runDocumentAction('nbEmpty', 'explain', 'Vide')
    expect(res.empty).toBe(true)
    expect(res.text).toBe(EMPTY_PAGE_MESSAGE)
  })
})

// ─── Suggestion de tâche (création confirmée côté UI) ──────────────────────────

describe('suggestTaskFromText', () => {
  it('détecte échéance et priorité sans rien créer', () => {
    const s = suggestTaskFromText('remettre le rapport urgent lundi', '2026-06-15')
    expect(s).not.toBeNull()
    expect(s?.priority).toBe('high')
    expect(s?.dueDate).toBeTruthy()
    expect(s?.title.toLowerCase()).toContain('rapport')
  })

  it('texte vide → null', () => {
    expect(suggestTaskFromText('   ', '2026-06-15')).toBeNull()
  })

  it('aucune tâche n’est persistée (table tasks vide)', async () => {
    suggestTaskFromText('faire le plan demain', '2026-06-15')
    const count = await db.tasks.count()
    expect(count).toBe(0)
  })
})

// ─── Disclaimer ───────────────────────────────────────────────────────────────

describe('AI_DISCLAIMER', () => {
  it('mentionne la vérification et l’absence d’avis officiel', () => {
    expect(AI_DISCLAIMER.toLowerCase()).toContain('vérifier')
    expect(AI_DISCLAIMER.toLowerCase()).toContain('officielle')
  })
})
