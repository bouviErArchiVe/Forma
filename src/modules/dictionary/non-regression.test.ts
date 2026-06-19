/**
 * Non-régression Dictionnaire — garantit que l'intégration Knowledge Core
 * (lib/knowledge lit le glossaire en seule lecture) ne change rien au
 * comportement public du module Dictionnaire.
 */
import { describe, expect, it } from 'vitest'
import {
  ARCHITECTURE_GLOSSARY,
  getGlossaryEntry,
  glossaryByCategory,
  normalizeQuery,
  searchGlossary,
} from './architecture-glossary'
import { architectureGlossaryProvider } from '../../lib/knowledge'

describe('Dictionnaire — API publique inchangée', () => {
  it('searchGlossary garde son contrat (vide, exact, synonyme, définition)', () => {
    expect(searchGlossary('')).toEqual([])
    expect(searchGlossary('Elevation')[0]?.term).toBe('élévation')
    expect(searchGlossary('placoplâtre').some((e) => e.term === 'panneau de gypse')).toBe(true)
    expect(searchGlossary('compression').length).toBeGreaterThan(0)
  })

  it('getGlossaryEntry et glossaryByCategory inchangés', () => {
    expect(getGlossaryEntry('poutre')?.category).toBe('Structure')
    const groups = glossaryByCategory()
    expect(groups.length).toBeGreaterThan(3)
  })

  it('normalizeQuery toujours exporté et fonctionnel', () => {
    expect(normalizeQuery('  Élévation ')).toBe('elevation')
  })
})

describe('Knowledge Core n’altère pas le glossaire source', () => {
  it('le provider lit le même nombre d’entrées que le glossaire', () => {
    expect(architectureGlossaryProvider.all().length).toBe(ARCHITECTURE_GLOSSARY.length)
  })

  it('les objets GlossaryEntry d’origine ne sont pas mutés', () => {
    const before = JSON.stringify(ARCHITECTURE_GLOSSARY)
    architectureGlossaryProvider.search('mur')
    architectureGlossaryProvider.lookup('poutre')
    architectureGlossaryProvider.all()
    expect(JSON.stringify(ARCHITECTURE_GLOSSARY)).toBe(before)
  })

  it('chaque terme du glossaire est consultable via le provider', () => {
    for (const e of ARCHITECTURE_GLOSSARY) {
      expect(architectureGlossaryProvider.lookup(e.term)?.term, e.term).toBe(e.term)
    }
  })
})
