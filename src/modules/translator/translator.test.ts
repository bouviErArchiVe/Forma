/** Tests du cœur pur du module Traduction (prompts + historique). */
import { describe, expect, it } from 'vitest'
import {
  addHistoryEntry,
  buildTranslationMessages,
  HISTORY_LIMIT,
  parseTranslatorState,
  removeHistoryEntry,
  sortHistory,
  toggleHistoryFavorite,
  type TranslationEntry,
} from './translator-core'

function entry(overrides: Partial<TranslationEntry> = {}): TranslationEntry {
  return {
    src: 'bonjour',
    dst: 'hello',
    from: 'fr',
    mode: 'simple',
    ts: 1000,
    ...overrides,
  }
}

describe('buildTranslationMessages', () => {
  it('produit un message system + un message user contenant le texte', () => {
    const msgs = buildTranslationMessages('Bonjour le monde', 'fr', 'simple')
    expect(msgs).toHaveLength(2)
    expect(msgs[0].role).toBe('system')
    expect(msgs[1].role).toBe('user')
    expect(msgs[1].content).toBe('Bonjour le monde')
  })

  it('indique le sens FR → EN dans le prompt système', () => {
    const [system] = buildTranslationMessages('texte', 'fr', 'simple')
    expect(system.content).toContain('français')
    expect(system.content).toContain('anglais')
    expect(system.content).toContain('du français vers le anglais')
  })

  it('indique le sens EN → FR dans le prompt système', () => {
    const [system] = buildTranslationMessages('text', 'en', 'simple')
    expect(system.content).toContain('du anglais vers le français')
  })

  it('mode simple → registre courant', () => {
    const [system] = buildTranslationMessages('texte', 'fr', 'simple')
    expect(system.content).toContain('registre courant')
    expect(system.content).not.toContain('registre soutenu')
  })

  it('mode professionnel → registre soutenu', () => {
    const [system] = buildTranslationMessages('texte', 'fr', 'professionnel')
    expect(system.content).toContain('registre soutenu')
  })

  it('mode technique → terminologie bâtiment et unités inchangées', () => {
    const [system] = buildTranslationMessages('texte', 'fr', 'technique')
    expect(system.content).toContain('terminologie du bâtiment')
    expect(system.content).toContain('CLT')
    expect(system.content).toContain('pare-vapeur')
    expect(system.content).toContain('solive')
    expect(system.content).toMatch(/unités[\s\S]*inchangées/)
  })

  it('demande une réponse contenant uniquement la traduction', () => {
    const [system] = buildTranslationMessages('texte', 'fr', 'simple')
    expect(system.content).toContain('uniquement avec la traduction')
  })
})

describe('historique — addHistoryEntry', () => {
  it('ajoute la nouvelle entrée en tête', () => {
    const h1 = addHistoryEntry([], entry({ ts: 1 }))
    const h2 = addHistoryEntry(h1, entry({ ts: 2 }))
    expect(h2.map((e) => e.ts)).toEqual([2, 1])
  })

  it('respecte la limite de 50 entrées', () => {
    let history: TranslationEntry[] = []
    for (let i = 0; i < 60; i++) {
      history = addHistoryEntry(history, entry({ ts: i }))
    }
    expect(history).toHaveLength(HISTORY_LIMIT)
    expect(HISTORY_LIMIT).toBe(50)
    // Les plus récentes sont conservées
    expect(history[0].ts).toBe(59)
  })

  it('évince les non-favoris avant les favoris une fois la limite atteinte', () => {
    let history: TranslationEntry[] = []
    for (let i = 0; i < 50; i++) {
      history = addHistoryEntry(history, entry({ ts: i, favorite: i === 0 }))
    }
    // ts=0 est favori et le plus ancien ; l'ajout d'une 51e entrée doit
    // évincer ts=1 (plus ancien non favori), pas ts=0.
    history = addHistoryEntry(history, entry({ ts: 100 }))
    expect(history).toHaveLength(50)
    expect(history.some((e) => e.ts === 0)).toBe(true)
    expect(history.some((e) => e.ts === 1)).toBe(false)
  })
})

describe('historique — tri et favoris', () => {
  it('sortHistory place les favoris en tête, puis trie par date décroissante', () => {
    const history = [
      entry({ ts: 3 }),
      entry({ ts: 1, favorite: true }),
      entry({ ts: 2 }),
      entry({ ts: 4, favorite: true }),
    ]
    expect(sortHistory(history).map((e) => e.ts)).toEqual([4, 1, 3, 2])
  })

  it('toggleHistoryFavorite bascule le favori sans toucher aux autres', () => {
    const history = [entry({ ts: 1 }), entry({ ts: 2 })]
    const next = toggleHistoryFavorite(history, 1)
    expect(next.find((e) => e.ts === 1)?.favorite).toBe(true)
    expect(next.find((e) => e.ts === 2)?.favorite).toBeUndefined()
    const back = toggleHistoryFavorite(next, 1)
    expect(back.find((e) => e.ts === 1)?.favorite).toBe(false)
  })

  it('removeHistoryEntry supprime la bonne entrée', () => {
    const history = [entry({ ts: 1 }), entry({ ts: 2 })]
    expect(removeHistoryEntry(history, 1).map((e) => e.ts)).toEqual([2])
  })
})

describe('parseTranslatorState', () => {
  it("retourne l'état vide pour une chaîne vide ou un JSON invalide", () => {
    expect(parseTranslatorState('')).toEqual({ v: 1, history: [] })
    expect(parseTranslatorState('{oops')).toEqual({ v: 1, history: [] })
    expect(parseTranslatorState('42')).toEqual({ v: 1, history: [] })
  })

  it('recharge un état valide et filtre les entrées malformées', () => {
    const valid = entry({ ts: 7 })
    const json = JSON.stringify({ v: 1, history: [valid, { src: 'x' }] })
    const state = parseTranslatorState(json)
    expect(state.history).toHaveLength(1)
    expect(state.history[0].ts).toBe(7)
  })
})
