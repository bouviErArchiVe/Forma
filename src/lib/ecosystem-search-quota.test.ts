import { describe, expect, it } from 'vitest'
import { mergeWithKnowledgeQuota, KNOWLEDGE_MIN_SLOTS, type EcosystemHit } from './ecosystem-search'

const other = (n: number): EcosystemHit[] =>
  Array.from({ length: n }, (_, i) => ({ kind: 'task', id: 'o' + i, title: 'o' + i, subtitle: '', to: '/tasks' }))
const know = (n: number): EcosystemHit[] =>
  Array.from({ length: n }, (_, i) => ({ kind: 'knowledge', id: 'k' + i, title: 'k' + i, subtitle: '', to: '/dictionary' }))

describe('mergeWithKnowledgeQuota', () => {
  it('garantit la présence de fiches knowledge même sous un cap saturé par les autres', () => {
    const res = mergeWithKnowledgeQuota(other(50), know(5), 20)
    expect(res).toHaveLength(20)
    const k = res.filter((h) => h.kind === 'knowledge')
    expect(k).toHaveLength(KNOWLEDGE_MIN_SLOTS)
  })

  it('ne supprime pas les autres résultats au-delà du quota réservé', () => {
    const res = mergeWithKnowledgeQuota(other(50), know(5), 20)
    expect(res.filter((h) => h.kind === 'task')).toHaveLength(20 - KNOWLEDGE_MIN_SLOTS)
  })

  it('préserve l’ordre relatif des autres résultats', () => {
    const res = mergeWithKnowledgeQuota(other(50), know(5), 20)
    const ids = res.filter((h) => h.kind === 'task').map((h) => h.id)
    expect(ids).toEqual(other(17).map((h) => h.id))
  })

  it('comble avec le surplus knowledge quand il y a peu d’autres résultats', () => {
    const res = mergeWithKnowledgeQuota(other(1), know(5), 20)
    expect(res).toHaveLength(6)
    expect(res.filter((h) => h.kind === 'knowledge')).toHaveLength(5)
  })

  it('sans knowledge, renvoie simplement les autres tronqués', () => {
    const res = mergeWithKnowledgeQuota(other(30), [], 20)
    expect(res).toHaveLength(20)
    expect(res.every((h) => h.kind === 'task')).toBe(true)
  })

  it('limit ≤ 0 renvoie une liste vide', () => {
    expect(mergeWithKnowledgeQuota(other(5), know(5), 0)).toEqual([])
  })

  it('ne duplique pas un hit lors du comblement', () => {
    const res = mergeWithKnowledgeQuota(other(2), know(2), 20)
    const keys = res.map((h) => `${h.kind}:${h.id}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
