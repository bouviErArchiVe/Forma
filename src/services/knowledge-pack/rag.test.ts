import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { __resetEnsureImport } from './import'
import { __resetRagCache, ragAnswer, retrievePackChunks } from './rag'
import { REVIEW_WARNING } from './validate'
import type { PackRagChunk } from './types'

function chunk(p: Partial<PackRagChunk> & { id: string }): PackRagChunk {
  return {
    id: p.id, document_name: p.document_name ?? 'Doc.pdf', page_start: p.page_start ?? 1,
    content: p.content ?? 'contenu', tags: p.tags ?? [], importGate: p.importGate ?? 'clean',
    formaUsefulnessScore: p.formaUsefulnessScore ?? 50, ...p,
  }
}

const SEED: PackRagChunk[] = [
  chunk({ id: 'c1', importGate: 'clean', document_name: 'Ching.pdf', page_start: 14, tags: ['poutre'],
    content: 'Une poutre est un élément horizontal qui reprend les efforts en flexion et les transmet aux poteaux sur ses appuis.' }),
  chunk({ id: 'c2', importGate: 'review', document_name: 'CCQ.pdf', page_start: 30, tags: ['cnb', 'garde-corps'],
    content: 'La hauteur de garde-corps et la résistance des poutres doivent respecter le code de construction applicable selon la situation.' }),
  chunk({ id: 'c3', importGate: 'quarantine', document_name: 'RAW.pdf', page_start: 2, tags: ['brut'],
    content: 'Fragment brut non vérifié issu de la page brute, ne doit jamais être utilisé par défaut dans le RAG FormAI.' }),
]

beforeEach(async () => {
  db.close(); await db.delete(); await db.open()
  __resetEnsureImport(); __resetRagCache()
  await db.formaRagChunks.bulkPut(SEED)
})

describe('retrievePackChunks', () => {
  it('préfère clean (review écarté quand une source clean répond)', async () => {
    const r = await retrievePackChunks('poutre')
    expect(r.map((c) => c.id)).toEqual(['c1'])
    expect(r.find((c) => c.importGate !== 'clean')).toBeUndefined()
  })
  it('bascule sur review seulement si aucune source clean ne correspond', async () => {
    const r = await retrievePackChunks('hauteur garde-corps')
    expect(r.map((c) => c.id)).toEqual(['c2'])
  })
  it('ne retourne jamais un chunk quarantine même si la requête colle', async () => {
    const r = await retrievePackChunks('fragment brut page brute')
    expect(r.find((c) => c.id === 'c3')).toBeUndefined()
  })
})

describe('ragAnswer', () => {
  it('réponse clean : extrait + citation document/page, sans avertissement', async () => {
    const r = await ragAnswer('poutre flexion appuis')
    expect(r.found).toBe(true)
    expect(r.answer).toContain('Ching.pdf · p. 14')
    expect(r.usedReview).toBe(false)
    expect(r.warning).toBeUndefined()
  })
  it('réponse review/normative : avertissement officiel + citation page', async () => {
    const r = await ragAnswer('hauteur garde-corps code')
    expect(r.found).toBe(true)
    expect(r.usedReview).toBe(true)
    expect(r.warning).toBe(REVIEW_WARNING)
    expect(r.answer).toContain('CCQ.pdf · p. 30')
    expect(r.answer).toContain('à vérifier dans la version officielle/applicable')
  })
  it('aucune source pertinente → no-result honnête', async () => {
    const r = await ragAnswer('xkqzwplmno inconnu total')
    expect(r.found).toBe(false)
    expect(r.answer).toBe('')
  })
})
