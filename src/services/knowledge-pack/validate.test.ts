import { describe, expect, it } from 'vitest'
import sampleEntries from './__fixtures__/sample_core_entries.json'
import sampleChunks from './__fixtures__/sample_core_chunks.json'
import {
  entryDocument,
  entryPage,
  isNormativeItem,
  isNormativeText,
  REVIEW_WARNING,
  validatePackChunk,
  validatePackEntry,
} from './validate'
import { IMPORT_GATES, type PackKnowledgeEntry, type PackRagChunk } from './types'

const entries = sampleEntries as unknown as PackKnowledgeEntry[]
const chunks = sampleChunks as unknown as PackRagChunk[]

// Reflète data/tests/knowledge_schema_tests.json du pack.
describe('schéma pack — entrées (échantillon)', () => {
  it('chaque entrée a un id non vide', () => {
    expect(entries.every((e) => typeof e.id === 'string' && e.id.trim() !== '')).toBe(true)
  })
  it('chaque entrée a une source (document)', () => {
    expect(entries.every((e) => typeof entryDocument(e) === 'string')).toBe(true)
  })
  it('importGate ∈ {clean, review, quarantine}', () => {
    expect(entries.every((e) => (IMPORT_GATES as readonly string[]).includes(e.importGate))).toBe(true)
  })
  it('page ≥ 1 quand présente', () => {
    expect(entries.every((e) => { const p = entryPage(e); return p === undefined || p >= 1 })).toBe(true)
  })
  it('toutes les entrées de l’échantillon passent la validation', () => {
    const invalid = entries.filter((e) => validatePackEntry(e).length > 0)
    expect(invalid).toEqual([])
  })
})

describe('schéma pack — chunks RAG (échantillon)', () => {
  it('chaque chunk a id + document_name + content > 80', () => {
    const invalid = chunks.filter((c) => validatePackChunk(c).length > 0)
    expect(invalid).toEqual([])
  })
  it('aucun chunk quarantine dans le core', () => {
    expect(chunks.some((c) => c.importGate === 'quarantine')).toBe(false)
  })
})

describe('détection normative', () => {
  it('repère les sujets normatifs/techniques', () => {
    expect(isNormativeText('Hauteur de garde-corps selon le code')).toBe(true)
    expect(isNormativeText('coefficient U de la paroi')).toBe(true)
    expect(isNormativeText('accessibilité et sécurité incendie')).toBe(true)
    expect(isNormativeText('CCQ chapitre 3')).toBe(true)
  })
  it('ignore un sujet non normatif', () => {
    expect(isNormativeText('histoire de la couleur en peinture')).toBe(false)
  })
  it('isNormativeItem combine titre + tags', () => {
    expect(isNormativeItem({ title: 'Définition', tags: ['cnb', 'incendie'] })).toBe(true)
    expect(isNormativeItem({ title: 'Atrium', tags: ['composition'] })).toBe(false)
  })
  it('le warning review est le texte officiel imposé', () => {
    expect(REVIEW_WARNING).toContain('à vérifier dans la version officielle/applicable')
  })
})
