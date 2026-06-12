/**
 * Tests Dictionnaire V2 : intégrité du glossaire et recherche.
 */
import { describe, expect, it } from 'vitest'
import {
  ARCHITECTURE_GLOSSARY,
  getGlossaryEntry,
  glossaryByCategory,
  searchGlossary,
} from './architecture-glossary'

const REQUIRED_TERMS = [
  'poutre', 'poteau', 'semelle', 'dalle', 'cloison', 'coupe', 'élévation',
  'accessibilité', 'résistance au feu', 'issue', 'solive', 'linteau',
  'pare-air', 'pare-vapeur', 'pont thermique', 'fondation', 'mur porteur',
  'garde-corps', 'giron', 'contremarche',
]

describe('ARCHITECTURE_GLOSSARY', () => {
  it('contient au moins 40 termes', () => {
    expect(ARCHITECTURE_GLOSSARY.length).toBeGreaterThanOrEqual(40)
  })

  it('termes requis présents', () => {
    for (const term of REQUIRED_TERMS) {
      expect(getGlossaryEntry(term), term).toBeDefined()
    }
  })

  it('pas de doublons, définitions et catégories remplies', () => {
    const terms = ARCHITECTURE_GLOSSARY.map((e) => e.term.toLowerCase())
    expect(new Set(terms).size).toBe(terms.length)
    for (const e of ARCHITECTURE_GLOSSARY) {
      expect(e.definition.length, e.term).toBeGreaterThan(30)
      expect(e.category, e.term).toBeTruthy()
    }
  })
})

describe('searchGlossary', () => {
  it('requête vide → []', () => {
    expect(searchGlossary('')).toEqual([])
    expect(searchGlossary('   ')).toEqual([])
  })

  it('match exact en tête, insensible accents/casse', () => {
    const hits = searchGlossary('Elevation')
    expect(hits[0]?.term).toBe('élévation')
  })

  it('trouve par synonyme', () => {
    // « placoplâtre » est un synonyme de « panneau de gypse »
    const hits = searchGlossary('placoplâtre')
    expect(hits.some((e) => e.term === 'panneau de gypse')).toBe(true)
  })

  it('trouve par contenu de définition', () => {
    const hits = searchGlossary('compression')
    expect(hits.length).toBeGreaterThan(0)
  })
})

describe('glossaryByCategory', () => {
  it('groupes non vides, triés alphabétiquement', () => {
    const groups = glossaryByCategory()
    expect(groups.length).toBeGreaterThan(3)
    for (const g of groups) {
      expect(g.entries.length).toBeGreaterThan(0)
      const sorted = [...g.entries].sort((a, b) => a.term.localeCompare(b.term, 'fr'))
      expect(g.entries.map((e) => e.term)).toEqual(sorted.map((e) => e.term))
    }
  })
})
