/**
 * Tests Knowledge Core — modèle : source + confidence obligatoires.
 */
import { describe, expect, it } from 'vitest'
import {
  KNOWLEDGE_CONFIDENCE_LABEL,
  KNOWLEDGE_CONFIDENCE_LEVELS,
  isKnowledgeConfidence,
  isValidKnowledgeEntry,
  makeKnowledgeEntry,
  validateKnowledgeEntry,
  type KnowledgeEntry,
} from './model'

const VALID: KnowledgeEntry = {
  id: 'architecture:linteau',
  term: 'linteau',
  domain: 'architecture',
  definition: 'Élément structural placé au-dessus d’une ouverture.',
  source: 'Base intégrée',
  confidence: 'indicatif',
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

describe('validateKnowledgeEntry', () => {
  it('accepte une entrée complète', () => {
    expect(validateKnowledgeEntry(VALID)).toEqual([])
    expect(isValidKnowledgeEntry(VALID)).toBe(true)
  })

  it('exige une source non vide (anti-hallucination)', () => {
    expect(validateKnowledgeEntry({ ...VALID, source: '' })).toContain('source obligatoire manquante')
    const { source: _omit, ...noSource } = VALID
    void _omit
    expect(validateKnowledgeEntry(noSource)).toContain('source obligatoire manquante')
  })

  it('exige une confidence valide', () => {
    const { confidence: _omit, ...noConf } = VALID
    void _omit
    expect(validateKnowledgeEntry(noConf)).toContain('confidence obligatoire invalide ou manquante')
    expect(
      validateKnowledgeEntry({ ...VALID, confidence: 'sûr' as never }),
    ).toContain('confidence obligatoire invalide ou manquante')
  })

  it('exige id, term, domain, definition', () => {
    expect(validateKnowledgeEntry({})).toEqual(
      expect.arrayContaining([
        'id manquant',
        'term manquant',
        'domain manquant',
        'definition manquante',
        'source obligatoire manquante',
        'confidence obligatoire invalide ou manquante',
      ]),
    )
  })
})

describe('makeKnowledgeEntry', () => {
  it('retourne l’entrée si valide', () => {
    expect(makeKnowledgeEntry(VALID)).toEqual(VALID)
  })

  it('lance si source manquante', () => {
    expect(() => makeKnowledgeEntry({ ...VALID, source: '   ' })).toThrow(/source/)
  })

  it('lance si confidence invalide', () => {
    expect(() => makeKnowledgeEntry({ ...VALID, confidence: 'x' as never })).toThrow(/confidence/)
  })
})
