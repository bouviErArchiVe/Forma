import { describe, expect, it } from 'vitest'
import { sourceChipHref } from './source-link'
import type { AssistantSource } from './types'

describe('sourceChipHref — règle anti-dead-link (#21)', () => {
  it('seed avec slug → lien fiche /dictionary?slug=', () => {
    const s: AssistantSource = { kind: 'seed', label: 'poutre', slug: 'poutre', toVerify: false }
    expect(sourceChipHref(s)).toBe('/dictionary?slug=poutre')
  })

  it('seed sans slug → non-cliquable (null)', () => {
    expect(sourceChipHref({ kind: 'seed', label: 'x' })).toBeNull()
  })

  it('pack avec document + page → Documents pré-filtré (document + page)', () => {
    const s: AssistantSource = { kind: 'pack', label: 'CCQ.pdf', document: 'CCQ.pdf', page: 120, gate: 'review', toVerify: true }
    expect(sourceChipHref(s)).toBe('/dictionary?source=pack&document=CCQ.pdf&page=120')
  })

  it('pack avec document sans page → pas de &page', () => {
    const s: AssistantSource = { kind: 'pack', label: 'ching 3e.pdf', document: 'ching 3e.pdf', gate: 'clean' }
    expect(sourceChipHref(s)).toBe('/dictionary?source=pack&document=ching%203e.pdf')
  })

  it('pack SANS document → non-cliquable (null), jamais de dead link', () => {
    expect(sourceChipHref({ kind: 'pack', label: 'Document Forma', gate: 'clean' })).toBeNull()
  })

  it('encode les caractères spéciaux du document', () => {
    const s: AssistantSource = { kind: 'pack', label: 'd', document: 'Acier & Béton.pdf', page: 3, gate: 'clean' }
    expect(sourceChipHref(s)).toBe('/dictionary?source=pack&document=Acier%20%26%20B%C3%A9ton.pdf&page=3')
  })
})
