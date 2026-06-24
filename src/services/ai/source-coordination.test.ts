import { describe, expect, it } from 'vitest'
import { coordinateSources, normalizeLabel, sourceRank, MAX_SOURCE_CHIPS } from './source-coordination'
import type { AssistantSource } from './types'

const seed = (label: string, slug?: string, toVerify = false): AssistantSource => ({ kind: 'seed', label, ...(slug ? { slug } : {}), toVerify })
const packClean = (document: string, page?: number): AssistantSource => ({ kind: 'pack', label: document, document, ...(page !== undefined ? { page } : {}), gate: 'clean', toVerify: false })
const packReview = (document: string, page?: number): AssistantSource => ({ kind: 'pack', label: document, document, ...(page !== undefined ? { page } : {}), gate: 'review', toVerify: true })

describe('normalizeLabel / sourceRank', () => {
  it('normalise accents/casse/ponctuation', () => {
    expect(normalizeLabel('Béton Armé !')).toBe('beton arme')
  })
  it('ordonne pack-clean-précis < seed < pack-review', () => {
    expect(sourceRank(packClean('CCQ.pdf', 12))).toBe(0)
    expect(sourceRank(seed('poutre', 'poutre'))).toBe(1)
    expect(sourceRank(packReview('CCQ.pdf', 5))).toBe(2)
  })
})

describe('coordinateSources — ranking', () => {
  it('classe pack clean précis avant seed avant pack review', () => {
    const out = coordinateSources([packReview('A.pdf', 1), seed('poutre', 'poutre'), packClean('B.pdf', 9)])
    expect(out.map((s) => `${s.kind}:${s.gate ?? ''}`)).toEqual(['pack:clean', 'seed:', 'pack:review'])
  })
  it('stable à rang égal (ordre d entrée préservé)', () => {
    const out = coordinateSources([packClean('A.pdf', 1), packClean('B.pdf', 2)])
    expect(out.map((s) => s.document)).toEqual(['A.pdf', 'B.pdf'])
  })
})

describe('coordinateSources — dédup', () => {
  it('dédup exacte (même kind/document/page/gate)', () => {
    const out = coordinateSources([packClean('CCQ.pdf', 12), packClean('CCQ.pdf', 12)])
    expect(out).toHaveLength(1)
  })
  it('même notion : pack clean précis évince le seed SANS slug', () => {
    const out = coordinateSources([seed('poutre'), packClean('poutre', 3)])
    expect(out.some((s) => s.kind === 'seed')).toBe(false)
    expect(out.some((s) => s.kind === 'pack')).toBe(true)
  })
  it('même notion : seed AVEC slug est conservé (navigation)', () => {
    const out = coordinateSources([seed('poutre', 'poutre'), packClean('poutre', 3)])
    expect(out.some((s) => s.kind === 'seed' && s.slug === 'poutre')).toBe(true)
    expect(out.some((s) => s.kind === 'pack')).toBe(true)
  })
  it('ne masque pas une source review distincte', () => {
    const out = coordinateSources([seed('mur', 'mur'), packReview('CNB.pdf', 40)])
    expect(out.some((s) => s.kind === 'pack' && s.gate === 'review')).toBe(true)
  })
})

describe('coordinateSources — garde-fous', () => {
  it('jamais quarantine (gate ∈ clean|review en entrée)', () => {
    const out = coordinateSources([packClean('A.pdf', 1), packReview('B.pdf', 2)])
    expect(out.every((s) => s.gate === 'clean' || s.gate === 'review')).toBe(true)
  })
  it('ne promeut jamais review en clean', () => {
    const out = coordinateSources([packReview('B.pdf', 2)])
    expect(out[0].gate).toBe('review')
    expect(out[0].toVerify).toBe(true)
  })
  it('plafonne à MAX_SOURCE_CHIPS', () => {
    const many = Array.from({ length: 9 }, (_, i) => packClean(`D${i}.pdf`, i + 1))
    expect(coordinateSources(many)).toHaveLength(MAX_SOURCE_CHIPS)
  })
  it('ne supprime jamais toutes les sources', () => {
    const out = coordinateSources([seed('x')])
    expect(out.length).toBeGreaterThan(0)
  })
  it('liste vide → vide (pas de fausse source)', () => {
    expect(coordinateSources([])).toEqual([])
  })
})
