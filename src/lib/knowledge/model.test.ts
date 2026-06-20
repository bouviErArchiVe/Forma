/**
 * Tests Knowledge Core — modèle : source(s) + confidence obligatoires.
 */
import { describe, expect, it } from 'vitest'
import {
  entryDefinition,
  entrySourceLabel,
  hasUsableSource,
  isKnowledgeConfidence,
  isKnowledgeEntryType,
  isValidKnowledgeEntry,
  KNOWLEDGE_CONFIDENCE_LABEL,
  KNOWLEDGE_CONFIDENCE_LEVELS,
  KNOWLEDGE_ENTRY_TYPES,
  makeKnowledgeEntry,
  normalizeKnowledgeEntry,
  validateKnowledgeEntry,
  type KnowledgeEntry,
} from './model'

const VALID: KnowledgeEntry = {
  id: 'architecture:linteau',
  slug: 'linteau',
  term: 'linteau',
  language: 'fr',
  type: 'concept',
  domain: 'architecture',
  shortDefinition: 'Élément structural placé au-dessus d’une ouverture.',
  longDefinition: 'Élément structural placé au-dessus d’une ouverture, qui reprend les charges.',
  examples: [],
  synonyms: [],
  relatedTerms: [],
  tags: [],
  sources: [{ label: 'Base intégrée', type: 'internal' }],
  confidence: 'indicatif',
  createdAt: '2026-06-20',
  updatedAt: '2026-06-20',
}

describe('confidence levels', () => {
  it('expose les trois niveaux attendus', () => {
    expect([...KNOWLEDGE_CONFIDENCE_LEVELS]).toEqual(['indicatif', 'concept', 'à-vérifier'])
  })

  it('isKnowledgeConfidence valide les niveaux connus', () => {
    expect(isKnowledgeConfidence('indicatif')).toBe(true)
    expect(isKnowledgeConfidence('concept')).toBe(true)
    expect(isKnowledgeConfidence('à-vérifier')).toBe(true)
    expect(isKnowledgeConfidence('inventé')).toBe(false)
    expect(isKnowledgeConfidence(undefined)).toBe(false)
  })

  it('chaque niveau a un libellé', () => {
    for (const lvl of KNOWLEDGE_CONFIDENCE_LEVELS) {
      expect(KNOWLEDGE_CONFIDENCE_LABEL[lvl]).toBeTruthy()
    }
  })
})

describe('entry types', () => {
  it('reconnaît les 13 types canoniques', () => {
    expect(KNOWLEDGE_ENTRY_TYPES).toHaveLength(13)
    for (const t of KNOWLEDGE_ENTRY_TYPES) expect(isKnowledgeEntryType(t)).toBe(true)
  })

  it('rejette un type inconnu', () => {
    expect(isKnowledgeEntryType('gadget')).toBe(false)
    expect(isKnowledgeEntryType(undefined)).toBe(false)
  })
})

describe('hasUsableSource', () => {
  it('exige au moins une source au label non vide', () => {
    expect(hasUsableSource([{ label: 'X', type: 'internal' }])).toBe(true)
    expect(hasUsableSource([{ label: '  ', type: 'internal' }])).toBe(false)
    expect(hasUsableSource([])).toBe(false)
    expect(hasUsableSource(undefined)).toBe(false)
  })
})

describe('validateKnowledgeEntry', () => {
  it('accepte une entrée complète', () => {
    expect(validateKnowledgeEntry(VALID)).toEqual([])
    expect(isValidKnowledgeEntry(VALID)).toBe(true)
  })

  it('exige au moins une source utilisable (anti-hallucination)', () => {
    expect(validateKnowledgeEntry({ ...VALID, sources: [] })).toEqual(
      expect.arrayContaining([expect.stringContaining('source obligatoire')]),
    )
    expect(validateKnowledgeEntry({ ...VALID, sources: [{ label: '', type: 'internal' }] })).toEqual(
      expect.arrayContaining([expect.stringContaining('source obligatoire')]),
    )
    const { sources: _omit, ...noSource } = VALID
    void _omit
    expect(validateKnowledgeEntry(noSource)).toEqual(
      expect.arrayContaining([expect.stringContaining('source obligatoire')]),
    )
  })

  it('exige une confidence valide', () => {
    const { confidence: _omit, ...noConf } = VALID
    void _omit
    expect(validateKnowledgeEntry(noConf)).toContain('confidence obligatoire invalide ou manquante')
    expect(
      validateKnowledgeEntry({ ...VALID, confidence: 'sûr' as never }),
    ).toContain('confidence obligatoire invalide ou manquante')
  })

  it('exige id, slug, term, type, domain, shortDefinition', () => {
    expect(validateKnowledgeEntry({})).toEqual(
      expect.arrayContaining([
        'id manquant',
        'slug manquant',
        'term manquant',
        'type invalide ou manquant',
        'domain manquant',
        'shortDefinition manquante',
        'confidence obligatoire invalide ou manquante',
      ]),
    )
  })
})

describe('normalizeKnowledgeEntry', () => {
  it('remplit les tableaux optionnels et la langue par défaut', () => {
    const n = normalizeKnowledgeEntry({
      id: 'x',
      term: 'X',
      type: 'word',
      domain: 'études',
      shortDefinition: 'def',
      sources: [{ label: 'S', type: 'internal' }],
      confidence: 'indicatif',
    })
    expect(n.language).toBe('fr')
    expect(n.examples).toEqual([])
    expect(n.synonyms).toEqual([])
    expect(n.relatedTerms).toEqual([])
    expect(n.tags).toEqual([])
    expect(n.slug).toBe('x') // dérivé de l'id
    expect(n.longDefinition).toBe('def') // fallback sur shortDefinition
  })

  it('ne fabrique ni définition ni source (entrée incomplète reste invalide)', () => {
    const n = normalizeKnowledgeEntry({ id: 'y', term: 'Y' })
    expect(isValidKnowledgeEntry(n)).toBe(false)
  })
})

describe('makeKnowledgeEntry', () => {
  it('retourne l’entrée normalisée si valide', () => {
    expect(makeKnowledgeEntry(VALID)).toEqual(VALID)
  })

  it('lance si source manquante', () => {
    expect(() => makeKnowledgeEntry({ ...VALID, sources: [] })).toThrow(/source/)
  })

  it('lance si confidence invalide', () => {
    expect(() => makeKnowledgeEntry({ ...VALID, confidence: 'x' as never })).toThrow(/confidence/)
  })
})

describe('accesseurs de compatibilité', () => {
  it('entryDefinition privilégie longDefinition puis retombe sur shortDefinition', () => {
    expect(entryDefinition(VALID)).toBe(VALID.longDefinition)
    expect(entryDefinition({ ...VALID, longDefinition: '' })).toBe(VALID.shortDefinition)
  })

  it('entrySourceLabel renvoie le libellé de la première source', () => {
    expect(entrySourceLabel(VALID)).toBe('Base intégrée')
    expect(entrySourceLabel({ sources: [] })).toBe('')
  })
})
