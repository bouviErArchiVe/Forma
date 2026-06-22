import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { __resetEnsureImport } from './import'
import {
  __resetPackQueryCache,
  entrySourceLabel,
  isHistoricalEntry,
  packDocuments,
  searchPackEntries,
} from './query'
import type { PackKnowledgeEntry } from './types'

function entry(p: Partial<PackKnowledgeEntry> & { id: string }): PackKnowledgeEntry {
  return {
    id: p.id, title: p.title ?? p.id, tags: p.tags ?? [],
    importGate: p.importGate ?? 'clean', sourceDocument: p.sourceDocument ?? 'A.pdf', sourcePage: p.sourcePage ?? 3,
    summary: p.summary ?? '', formaUsefulnessScore: p.formaUsefulnessScore ?? 50, ...p,
  }
}

const SEED: PackKnowledgeEntry[] = [
  entry({ id: 'e1', title: 'Poutre', tags: ['poutre'], importGate: 'clean', sourceDocument: 'A.pdf', formaUsefulnessScore: 90 }),
  entry({ id: 'e2', title: 'Sécurité incendie', tags: ['cnb', 'incendie'], importGate: 'review', sourceDocument: 'CCQ.pdf', formaUsefulnessScore: 80 }),
  entry({ id: 'e3', title: 'Brut quarantine', importGate: 'quarantine', sourceDocument: 'RAW.pdf' }),
  entry({ id: 'e4', title: 'Mot ancien', tags: ['lexique', 'historique'], importGate: 'clean', sourceDocument: 'Academie_1798.pdf', formaUsefulnessScore: 50 }),
]

beforeEach(async () => {
  db.close(); await db.delete(); await db.open()
  __resetEnsureImport(); __resetPackQueryCache()
  await db.formaKnowledgeEntries.bulkPut(SEED)
})

describe('searchPackEntries', () => {
  it('exclut quarantine par défaut', async () => {
    const r = await searchPackEntries({})
    expect(r.items.find((e) => e.id === 'e3')).toBeUndefined()
    expect(r.total).toBe(3)
  })
  it('inclut quarantine seulement si demandé (admin/debug)', async () => {
    const r = await searchPackEntries({ includeQuarantine: true })
    expect(r.items.find((e) => e.id === 'e3')).toBeDefined()
  })
  it('classe clean avant review puis par score', async () => {
    const r = await searchPackEntries({})
    expect(r.items.map((e) => e.id)).toEqual(['e1', 'e4', 'e2'])
  })
  it('filtre par gate', async () => {
    const r = await searchPackEntries({ gate: 'review' })
    expect(r.items.map((e) => e.id)).toEqual(['e2'])
  })
  it('filtre par document', async () => {
    const r = await searchPackEntries({ document: 'A.pdf' })
    expect(r.items.map((e) => e.id)).toEqual(['e1'])
  })
  it('recherche texte (titre/tags)', async () => {
    const r = await searchPackEntries({ text: 'incendie' })
    expect(r.items.map((e) => e.id)).toEqual(['e2'])
  })
})

describe('historique + source', () => {
  it('repère le lexique historique', () => {
    expect(isHistoricalEntry(SEED[3])).toBe(true)
    expect(isHistoricalEntry(SEED[0])).toBe(false)
  })
  it('entrySourceLabel affiche document + page', () => {
    expect(entrySourceLabel(SEED[0])).toBe('A.pdf · p. 3')
  })
  it('packDocuments liste les documents non-quarantine présents', async () => {
    const docs = await packDocuments()
    expect(docs).toContain('A.pdf')
    expect(docs).toContain('CCQ.pdf')
  })
})
