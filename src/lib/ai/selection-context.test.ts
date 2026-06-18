/**
 * Tests du pont sélection→FormAI (`selection-context.ts`).
 *
 * Couvre : description structurelle honnête (jamais inventée), priorité du
 * texte sur le snapshot, repli chaîne vide (⇒ page entière), et l'adaptateur
 * `makeGetSelectionText`. Vérifie aussi l'interop avec l'accesseur read-only
 * réel de Lane B (`readSelection`) — sans mutation.
 */
import { describe, expect, it } from 'vitest'
import {
  buildSelectionText,
  describeSelectionStructure,
  makeGetSelectionText,
} from './selection-context'
import { readSelection } from '../drawing/selection-accessor'
import type { SelectionSnapshot } from '../drawing/selection-accessor'
import type { Page, SelectableKind, SelectionItem } from '../../types'

function snapshot(partial: Partial<SelectionSnapshot> = {}): SelectionSnapshot {
  return {
    empty: false,
    count: 0,
    ids: [],
    kinds: [],
    countByKind: { stroke: 0, shape: 0, text: 0, image: 0, sticker: 0, tape: 0 },
    bbox: null,
    ...partial,
  }
}

function withKinds(counts: Partial<Record<SelectableKind, number>>): SelectionSnapshot {
  const countByKind = { stroke: 0, shape: 0, text: 0, image: 0, sticker: 0, tape: 0, ...counts }
  const kinds = (Object.keys(counts) as SelectableKind[]).filter((k) => (counts[k] ?? 0) > 0)
  const count = kinds.reduce((acc, k) => acc + (countByKind[k] ?? 0), 0)
  return snapshot({ empty: count === 0, count, kinds, countByKind })
}

// ─── describeSelectionStructure ───────────────────────────────────────────────

describe('describeSelectionStructure', () => {
  it('sélection vide → chaîne vide', () => {
    expect(describeSelectionStructure(snapshot({ empty: true }))).toBe('')
  })

  it('un seul type singulier', () => {
    expect(describeSelectionStructure(withKinds({ text: 1 }))).toBe('Sélection de 1 zone de texte.')
  })

  it('pluriel FR correct', () => {
    expect(describeSelectionStructure(withKinds({ stroke: 3 }))).toBe('Sélection de 3 traits.')
  })

  it('plusieurs types joints par « et »', () => {
    const snap = snapshot({
      count: 3,
      kinds: ['stroke', 'shape', 'text'],
      countByKind: { stroke: 2, shape: 1, text: 1, image: 0, sticker: 0, tape: 0 },
    })
    expect(describeSelectionStructure(snap)).toBe('Sélection de 2 traits, 1 forme et 1 zone de texte.')
  })

  it('n’invente rien hors du snapshot (types à 0 ignorés)', () => {
    const out = describeSelectionStructure(withKinds({ image: 2 }))
    expect(out).toBe('Sélection de 2 images.')
    expect(out).not.toMatch(/trait|forme|texte|ruban|autocollant/)
  })
})

// ─── buildSelectionText ───────────────────────────────────────────────────────

describe('buildSelectionText', () => {
  it('texte fourni → renvoyé nettoyé (priorité sur le snapshot)', () => {
    const out = buildSelectionText({
      selectionText: '  le pare-vapeur  ',
      snapshot: withKinds({ stroke: 5 }),
    })
    expect(out).toBe('le pare-vapeur')
  })

  it('pas de texte mais snapshot → description structurelle', () => {
    expect(buildSelectionText({ snapshot: withKinds({ shape: 1 }) })).toBe('Sélection de 1 forme.')
  })

  it('texte blanc + snapshot vide → chaîne vide (repli page entière)', () => {
    expect(buildSelectionText({ selectionText: '   ', snapshot: snapshot({ empty: true }) })).toBe('')
  })

  it('rien fourni → chaîne vide', () => {
    expect(buildSelectionText({})).toBe('')
  })
})

// ─── makeGetSelectionText ─────────────────────────────────────────────────────

describe('makeGetSelectionText', () => {
  it('renvoie le texte sélectionné lu au moment de l’appel', () => {
    let current = 'premier'
    const get = makeGetSelectionText(() => ({ selectionText: current }))
    expect(get()).toBe('premier')
    current = 'second' // l'hôte met à jour sa source ; lecture au clic
    expect(get()).toBe('second')
  })

  it('rien d’exploitable → undefined (déclenche le repli page entière)', () => {
    const get = makeGetSelectionText(() => ({ selectionText: '   ' }))
    expect(get()).toBeUndefined()
  })

  it('snapshot seul → description structurelle', () => {
    const get = makeGetSelectionText(() => ({ snapshot: withKinds({ text: 2 }) }))
    expect(get()).toBe('Sélection de 2 zones de texte.')
  })
})

// ─── Interop avec l'accesseur read-only réel (Lane B) ─────────────────────────

function makePage(partial: Partial<Page> = {}): Page {
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

describe('interop readSelection (Lane B)', () => {
  it('décrit fidèlement une sélection résolue, sans muter la sélection', () => {
    const page = makePage({
      shapes: [{ id: 's1', type: 'rectangle', x1: 0, y1: 0, x2: 10, y2: 10, color: '#000', width: 1, pageId: 'p1' }],
      texts: [{ id: 't1', x: 0, y: 0, width: 50, height: 20, content: 'x', fontSize: 16, color: '#000', align: 'left', pageId: 'p1' }],
    })
    const selection: SelectionItem[] = [
      { kind: 'shape', id: 's1' },
      { kind: 'text', id: 't1' },
    ]
    const snap = readSelection(page, selection)
    expect(buildSelectionText({ snapshot: snap })).toBe('Sélection de 1 forme et 1 zone de texte.')
    // L'entrée n'a pas été mutée par la chaîne accesseur → description.
    expect(selection).toHaveLength(2)
  })
})
