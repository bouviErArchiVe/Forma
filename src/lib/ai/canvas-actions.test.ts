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
  SELECTION_FALLBACK_NOTE,
  TRANSLATE_LANGUAGE_LABELS,
  buildExplainPrompt,
  buildExplainSelectionPrompt,
  buildOutlinePrompt,
  buildPrompt,
  buildReformulatePrompt,
  buildSummarizePrompt,
  buildTranslatePrompt,
  runCanvasAction,
  runDocumentAction,
  runPageAction,
  runSelectionAction,
  suggestTaskFromText,
  translateLanguageLabel,
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

  it('buildSummarizePrompt demande des points clés (portée page par défaut)', () => {
    const { system, user } = buildSummarizePrompt('Doc', 'contenu')
    expect(user.toLowerCase()).toContain('résume')
    expect(user.toLowerCase()).toContain('page')
    expect(system.toLowerCase()).toContain('résumé')
  })

  it('buildSummarizePrompt adapte le libellé en portée document', () => {
    const { system, user } = buildSummarizePrompt('Carnet', 'contenu', 'document')
    expect(user.toLowerCase()).toContain('document')
    expect(user).toContain('Contenu du document')
    expect(system.toLowerCase()).toContain('document')
  })

  it('buildExplainSelectionPrompt cible l’extrait et garde l’ancrage', () => {
    const { system, user } = buildExplainSelectionPrompt('Mur', 'le pare-vapeur')
    expect(user.toLowerCase()).toContain('extrait sélectionné')
    expect(user).toContain('le pare-vapeur')
    expect(user).toContain('Mur')
    expect(system.toLowerCase()).toContain('extrait')
    expect(system).toContain('UNIQUEMENT')
    expect(system).toContain('UNIQUEMENT sur le texte')
  })

  it('buildExplainSelectionPrompt interdit explicitement l’extrapolation hors extrait', () => {
    const { system, user } = buildExplainSelectionPrompt('Mur', 'le pare-vapeur')
    // Ancrage renforcé : centré sur l'extrait, pas d'ajout hors extrait.
    expect(system.toLowerCase()).toContain('n’extrapole')
    expect(user.toLowerCase()).toContain('sans rien ajouter')
  })

  it('titre vide → libellé de repli (explain & selection)', () => {
    expect(buildExplainPrompt('   ', 'x').user).toContain('Document sans titre')
    expect(buildExplainSelectionPrompt('', 'x').user).toContain('Document sans titre')
  })

  it('buildPrompt route selon le type d’action', () => {
    expect(buildPrompt('explain', 't', 'c').user).toContain('Explique')
    expect(buildPrompt('summarize', 't', 'c').user.toLowerCase()).toContain('résume')
    expect(buildPrompt('explain-selection', 't', 'c').user.toLowerCase()).toContain('extrait')
  })

  it('buildPrompt summarize honore la portée document', () => {
    expect(buildPrompt('summarize', 't', 'c', 'document').user.toLowerCase()).toContain('document')
  })

  it('aucun prompt ne contient de référence normative inventée', () => {
    const { system } = buildExplainPrompt('t', 'c')
    expect(system).toMatch(/référence normative/i)
    expect(system).toContain('aucune')
  })
})

// ─── Builders : reformuler / traduire / plan (purs + ancrage) ──────────────────

describe('buildReformulatePrompt', () => {
  it('réécrit sans changer le sens, ancrage anti-invention conservé', () => {
    const { system, user } = buildReformulatePrompt('Mur', 'Le pare-vapeur côté chaud.')
    expect(user.toLowerCase()).toContain('reformule')
    expect(user).toContain('Mur')
    expect(user).toContain('Le pare-vapeur côté chaud.')
    expect(system).toContain('UNIQUEMENT sur le texte')
    expect(system.toLowerCase()).toContain('sans en modifier le sens')
    expect(system.toLowerCase()).toContain('aucune information')
  })

  it('adapte le libellé en portée document', () => {
    const { user } = buildReformulatePrompt('Carnet', 'contenu', 'document')
    expect(user.toLowerCase()).toContain('document')
    expect(user).toContain('Contenu du document')
  })

  it('titre vide → libellé de repli', () => {
    expect(buildReformulatePrompt('  ', 'x').user).toContain('Document sans titre')
  })
})

describe('buildTranslatePrompt', () => {
  it('traduit uniquement le texte fourni, sans ajout', () => {
    const { system, user } = buildTranslatePrompt('Mur', 'Le pare-vapeur.', 'en')
    expect(user.toLowerCase()).toContain('traduis')
    expect(user).toContain('Le pare-vapeur.')
    expect(user).toContain('anglais')
    expect(system.toLowerCase()).toContain('uniquement le texte fourni')
    expect(system.toLowerCase()).toContain('aucun commentaire')
    expect(system.toLowerCase()).toContain('n’invente')
  })

  it('langue par défaut = anglais ; sortie demandée dans la langue cible', () => {
    const en = buildTranslatePrompt('t', 'c')
    expect(en.user).toContain('anglais')
    expect(en.system).toContain('en anglais')
    const es = buildTranslatePrompt('t', 'c', 'es')
    expect(es.user).toContain('espagnol')
    expect(es.system).toContain('en espagnol')
  })

  it('langue inconnue → repli anglais', () => {
    const { user } = buildTranslatePrompt('t', 'c', 'zz')
    expect(user).toContain('anglais')
  })

  it('adapte le libellé en portée document', () => {
    const { user } = buildTranslatePrompt('Carnet', 'contenu', 'de', 'document')
    expect(user.toLowerCase()).toContain('document')
    expect(user).toContain('allemand')
  })
})

describe('buildOutlinePrompt', () => {
  it('demande un plan hiérarchique fidèle, ancrage conservé', () => {
    const { system, user } = buildOutlinePrompt('Cours', 'Partie A. Partie B.')
    expect(user.toLowerCase()).toContain('plan')
    expect(user).toContain('Cours')
    expect(user).toContain('Partie A. Partie B.')
    expect(system).toContain('UNIQUEMENT sur le texte')
    expect(system.toLowerCase()).toContain('n’invente aucune section')
  })

  it('adapte le libellé en portée document', () => {
    const { user } = buildOutlinePrompt('Carnet', 'contenu', 'document')
    expect(user.toLowerCase()).toContain('document')
    expect(user).toContain('Contenu du document')
  })
})

describe('translateLanguageLabel', () => {
  it('résout les libellés connus et retombe sur anglais', () => {
    expect(translateLanguageLabel('en')).toBe('anglais')
    expect(translateLanguageLabel('es')).toBe('espagnol')
    expect(translateLanguageLabel('zz')).toBe(TRANSLATE_LANGUAGE_LABELS.en)
  })
})

// ─── Routage buildPrompt pour les nouvelles actions ───────────────────────────

describe('buildPrompt — routage reformulate / translate / outline', () => {
  it('route reformulate', () => {
    expect(buildPrompt('reformulate', 't', 'c').user.toLowerCase()).toContain('reformule')
  })

  it('route outline', () => {
    expect(buildPrompt('outline', 't', 'c').user.toLowerCase()).toContain('plan')
  })

  it('route translate avec langue (6e paramètre)', () => {
    const built = buildPrompt('translate', 't', 'c', 'page', 'generic', 'es')
    expect(built.user.toLowerCase()).toContain('traduis')
    expect(built.user).toContain('espagnol')
  })

  it('translate honore la portée document', () => {
    const built = buildPrompt('translate', 't', 'c', 'document', 'generic', 'en')
    expect(built.user.toLowerCase()).toContain('document')
  })

  it('reformulate/outline gardent l’ancrage anti-hallucination', () => {
    expect(buildPrompt('reformulate', 't', 'c').system).toContain('UNIQUEMENT sur le texte')
    expect(buildPrompt('outline', 't', 'c').system).toContain('UNIQUEMENT sur le texte')
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

// ─── Orchestration des nouvelles actions (read-only, aucune écriture DB) ───────

describe('nouvelles actions — routage runPageAction / runDocumentAction', () => {
  const html =
    '<p>La toiture végétalisée retient l’eau de pluie et améliore l’isolation thermique du bâtiment.</p>'

  it('runPageAction route reformulate sans modifier la page (read-only)', async () => {
    await db.pages.add(makePage({ id: 'reformPage', content: html }))
    const res = await runPageAction('reformPage', 'reformulate', 'Toiture')
    expect(res?.empty).toBe(false)
    expect(res?.fromCloud).toBe(false)
    const after = await db.pages.get('reformPage')
    expect(after?.content).toBe(html)
  })

  it('runPageAction route outline', async () => {
    await db.pages.add(makePage({ id: 'outlinePage', content: html }))
    const res = await runPageAction('outlinePage', 'outline', 'Toiture')
    expect(res?.empty).toBe(false)
    expect(res?.text.trim().length).toBeGreaterThan(0)
  })

  it('runPageAction route translate avec langue cible', async () => {
    await db.pages.add(makePage({ id: 'transPage', content: html }))
    const res = await runPageAction('transPage', 'translate', 'Toiture', { language: 'en' })
    expect(res?.empty).toBe(false)
    expect(res?.fromCloud).toBe(false)
  })

  it('runDocumentAction route les nouvelles actions sur l’agrégat', async () => {
    await db.pages.bulkAdd([
      makePage({ id: 'da', notebookId: 'nbNew', order: 0, content: '<p>Intro.</p>' }),
      makePage({ id: 'dbp', notebookId: 'nbNew', order: 1, content: '<p>Suite du contenu.</p>' }),
    ])
    const res = await runDocumentAction('nbNew', 'outline', 'Carnet')
    expect(res.empty).toBe(false)
    expect(res.text.trim().length).toBeGreaterThan(0)
  })

  it('aucune création de tâche par ces actions (table tasks vide)', async () => {
    await db.pages.add(makePage({ id: 'noTask', content: html }))
    await runPageAction('noTask', 'reformulate', 'X')
    await runPageAction('noTask', 'translate', 'X', { language: 'es' })
    await runPageAction('noTask', 'outline', 'X')
    expect(await db.tasks.count()).toBe(0)
  })
})

// ─── Expliquer la sélection (V2 — préparé, fallback page entière) ──────────────

describe('runSelectionAction', () => {
  it('avec une sélection : explique l’extrait sans toucher Dexie', async () => {
    // Pas de page en base : prouve qu'aucune lecture Dexie n'est nécessaire.
    const res = await runSelectionAction('absente', 'Mur', {
      selectionText: 'Le pare-vapeur se place côté chaud du mur.',
    })
    expect(res).toBeDefined()
    expect(res?.empty).toBe(false)
    expect(res?.note).toBeUndefined()
    expect(res?.text.trim().length).toBeGreaterThan(0)
  })

  it('sélection vide/blanche → fallback page entière avec note', async () => {
    await db.pages.add(
      makePage({ id: 'selPage', content: '<p>Contenu complet de la page.</p>' }),
    )
    const res = await runSelectionAction('selPage', 'Page', { selectionText: '   ' })
    expect(res).toBeDefined()
    expect(res?.empty).toBe(false)
    expect(res?.note).toBe(SELECTION_FALLBACK_NOTE)
  })

  it('sans selectionText → fallback page entière avec note', async () => {
    await db.pages.add(
      makePage({ id: 'selPage2', content: '<p>Autre contenu.</p>' }),
    )
    const res = await runSelectionAction('selPage2', 'Page')
    expect(res?.note).toBe(SELECTION_FALLBACK_NOTE)
    expect(res?.empty).toBe(false)
  })

  it('fallback sur page introuvable → undefined', async () => {
    const res = await runSelectionAction('inexistante', 'X')
    expect(res).toBeUndefined()
  })

  it('fallback sur page vide → message page vide + note de sélection', async () => {
    await db.pages.add(makePage({ id: 'selEmpty' }))
    const res = await runSelectionAction('selEmpty', 'Vide')
    expect(res?.empty).toBe(true)
    expect(res?.text).toBe(EMPTY_PAGE_MESSAGE)
    expect(res?.note).toBe(SELECTION_FALLBACK_NOTE)
  })

  it('ne modifie pas la page en fallback (lecture seule)', async () => {
    await db.pages.add(makePage({ id: 'selRO', content: '<p>Intact.</p>' }))
    await runSelectionAction('selRO', 'RO')
    const after = await db.pages.get('selRO')
    expect(after?.content).toBe('<p>Intact.</p>')
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
