/**
 * Tests accesseur de sélection (lecture seule) : forme de l'instantané, bbox,
 * dédup, items obsolètes ignorés, et garantie de NON-mutation (page/sélection).
 */
import { describe, expect, it } from 'vitest'
import {
  isHomogeneousSelection,
  readSelection,
  selectableKinds,
  selectionOfKind,
} from './selection-accessor'
import type { ImageElement, Page, SelectionItem, Stroke, TextElement } from '../../types'

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

function stroke(id: string, pts: Array<[number, number]>): Stroke {
  return {
    id,
    tool: 'pen',
    color: '#000',
    width: 2,
    opacity: 1,
    points: pts.map(([x, y]) => ({ x, y, pressure: 0.5, timestamp: 0 })),
    pageId: 'p1',
  }
}

function image(id: string, x: number, y: number, w: number, h: number): ImageElement {
  return { id, x, y, width: w, height: h, pageId: 'p1' }
}

function text(id: string, x: number, y: number, w: number, h: number): TextElement {
  return { id, x, y, width: w, height: h, content: 'x', fontSize: 16, color: '#000', align: 'left', pageId: 'p1' }
}

describe('readSelection — forme de l’instantané', () => {
  it('sélection vide', () => {
    const snap = readSelection(makePage(), [])
    expect(snap.empty).toBe(true)
    expect(snap.count).toBe(0)
    expect(snap.ids).toEqual([])
    expect(snap.kinds).toEqual([])
    expect(snap.bbox).toBeNull()
    expect(snap.countByKind).toEqual({ stroke: 0, shape: 0, text: 0, image: 0, sticker: 0, tape: 0 })
  })

  it('compte par type + types présents + ids', () => {
    const page = makePage({
      strokes: [stroke('s1', [[0, 0], [10, 10]])],
      images: [image('i1', 50, 50, 20, 20), image('i2', 80, 80, 10, 10)],
    })
    const sel: SelectionItem[] = [
      { kind: 'stroke', id: 's1' },
      { kind: 'image', id: 'i1' },
      { kind: 'image', id: 'i2' },
    ]
    const snap = readSelection(page, sel)
    expect(snap.empty).toBe(false)
    expect(snap.count).toBe(3)
    expect(snap.ids).toEqual(['s1', 'i1', 'i2'])
    expect(snap.kinds).toEqual(['stroke', 'image'])
    expect(snap.countByKind.stroke).toBe(1)
    expect(snap.countByKind.image).toBe(2)
    expect(snap.countByKind.text).toBe(0)
  })

  it('bbox englobe tous les éléments sélectionnés', () => {
    const page = makePage({
      images: [image('i1', 10, 20, 30, 40), image('i2', 100, 200, 50, 50)],
    })
    const snap = readSelection(page, [
      { kind: 'image', id: 'i1' },
      { kind: 'image', id: 'i2' },
    ])
    expect(snap.bbox).toEqual({ x: 10, y: 20, w: 140, h: 230 })
  })

  it('items dupliqués dédupliqués', () => {
    const page = makePage({ texts: [text('t1', 0, 0, 10, 10)] })
    const snap = readSelection(page, [
      { kind: 'text', id: 't1' },
      { kind: 'text', id: 't1' },
    ])
    expect(snap.count).toBe(1)
    expect(snap.ids).toEqual(['t1'])
  })

  it('items obsolètes (absents de la page) ignorés', () => {
    const page = makePage({ images: [image('i1', 0, 0, 10, 10)] })
    const snap = readSelection(page, [
      { kind: 'image', id: 'i1' },
      { kind: 'image', id: 'ghost' },
      { kind: 'stroke', id: 'nope' },
    ])
    expect(snap.count).toBe(1)
    expect(snap.ids).toEqual(['i1'])
    expect(snap.kinds).toEqual(['image'])
  })
})

describe('readSelection — lecture seule (aucune mutation)', () => {
  it('ne mute ni la page ni la sélection', () => {
    const page = makePage({
      strokes: [stroke('s1', [[0, 0], [10, 10]])],
      images: [image('i1', 5, 5, 5, 5)],
    })
    const sel: SelectionItem[] = [
      { kind: 'stroke', id: 's1' },
      { kind: 'image', id: 'i1' },
    ]
    const pageSnapshot = JSON.parse(JSON.stringify(page))
    const selSnapshot = JSON.parse(JSON.stringify(sel))

    const snap = readSelection(page, sel)

    // Entrées inchangées
    expect(page).toEqual(pageSnapshot)
    expect(sel).toEqual(selSnapshot)

    // Muter la sortie n’affecte pas les entrées
    snap.ids.push('mutated')
    snap.kinds.push('tape')
    snap.countByKind.stroke = 999
    expect(page).toEqual(pageSnapshot)
    expect(sel).toEqual(selSnapshot)
  })
})

describe('selectionOfKind', () => {
  it('filtre par type sans muter', () => {
    const sel: SelectionItem[] = [
      { kind: 'stroke', id: 's1' },
      { kind: 'image', id: 'i1' },
      { kind: 'stroke', id: 's2' },
    ]
    const strokes = selectionOfKind(sel, 'stroke')
    expect(strokes).toEqual([
      { kind: 'stroke', id: 's1' },
      { kind: 'stroke', id: 's2' },
    ])
    expect(sel).toHaveLength(3)
  })
})

describe('isHomogeneousSelection', () => {
  const page = makePage({
    strokes: [stroke('s1', [[0, 0], [1, 1]]), stroke('s2', [[2, 2], [3, 3]])],
    images: [image('i1', 0, 0, 5, 5)],
  })

  it('vrai si un seul type', () => {
    expect(isHomogeneousSelection(page, [
      { kind: 'stroke', id: 's1' },
      { kind: 'stroke', id: 's2' },
    ], 'stroke')).toBe(true)
  })
  it('faux si types mixtes', () => {
    expect(isHomogeneousSelection(page, [
      { kind: 'stroke', id: 's1' },
      { kind: 'image', id: 'i1' },
    ], 'stroke')).toBe(false)
  })
  it('faux si vide', () => {
    expect(isHomogeneousSelection(page, [], 'stroke')).toBe(false)
  })
})

describe('selectableKinds', () => {
  it('expose la liste de référence (copie)', () => {
    const a = selectableKinds()
    const b = selectableKinds()
    expect(a).toEqual(['stroke', 'shape', 'text', 'image', 'sticker', 'tape'])
    a.push('stroke')
    expect(b).toHaveLength(6)
  })
})
