/**
 * Tests Knowledge Core — providers : extractif, sourcé, honnête sur l'inconnu.
 */
import { describe, expect, it } from 'vitest'
import { ARCHITECTURE_GLOSSARY } from '../../modules/dictionary/architecture-glossary'
import { isValidKnowledgeEntry } from './model'
import {
  allKnowledge,
  answerKnowledge,
  architectureGlossaryProvider,
  glossaryEntryToKnowledge,
  lookupKnowledge,
  scoreEntries,
  searchKnowledge,
} from './providers'

describe('architectureGlossaryProvider', () => {
  it('adapte tout le glossaire en entrées valides (source + confidence)', () => {
    const entries = architectureGlossaryProvider.all()
    expect(entries.length).toBe(ARCHITECTURE_GLOSSARY.length)
    for (const e of entries) {
      expect(isValidKnowledgeEntry(e), e.term).toBe(true)
      expect(e.source.trim().length).toBeGreaterThan(0)
      expect(e.confidence).toBe('indicatif')
      expect(e.domain).toBe('architecture')
    }
  })

  it('ids uniques', () => {
    const ids = architectureGlossaryProvider.all().map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('glossaryEntryToKnowledge préserve la définition et indexe synonymes/catégorie', () => {
    const src = ARCHITECTURE_GLOSSARY.find((e) => e.term === 'poutre')!
    const k = glossaryEntryToKnowledge(src)
    expect(k.definition).toBe(src.definition)
    expect(k.tags).toContain(src.category)
    for (const syn of src.synonyms) expect(k.tags).toContain(syn)
  })
})

describe('lookup (honnêteté)', () => {
  it('trouve un terme connu, insensible casse/accents', () => {
    expect(architectureGlossaryProvider.lookup('LINTEAU')?.term).toBe('linteau')
    expect(lookupKnowledge('élévation')?.term).toBe('élévation')
  })

  it('retourne undefined pour un terme inconnu (ne fabrique rien)', () => {
    expect(architectureGlossaryProvider.lookup('blockchain quantique')).toBeUndefined()
    expect(lookupKnowledge('xyzzy')).toBeUndefined()
  })

  it('answerKnowledge signale l’inconnu sans inventer', () => {
    const known = answerKnowledge('poteau')
    expect(known.found).toBe(true)
    if (known.found) expect(known.entry.source.trim()).not.toBe('')

    const unknown = answerKnowledge('terme totalement absent')
    expect(unknown).toEqual({ found: false, term: 'terme totalement absent', reason: 'unknown' })
  })
})

describe('search / scoreEntries', () => {
  it('requête vide → []', () => {
    expect(searchKnowledge('')).toEqual([])
    expect(scoreEntries(architectureGlossaryProvider.all(), '   ')).toEqual([])
  })

  it('terme exact en tête', () => {
    const hits = searchKnowledge('elevation')
    expect(hits[0]?.term).toBe('élévation')
  })

  it('trouve par tag (synonyme indexé)', () => {
    const hits = searchKnowledge('placoplatre')
    expect(hits.some((e) => e.term === 'panneau de gypse')).toBe(true)
  })

  it('trouve par contenu de définition', () => {
    expect(searchKnowledge('compression').length).toBeGreaterThan(0)
  })

  it('dédoublonne par id à travers les providers', () => {
    const ids = searchKnowledge('mur').map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('allKnowledge', () => {
  it('agrège sans doublon', () => {
    const all = allKnowledge()
    expect(all.length).toBe(architectureGlossaryProvider.all().length)
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length)
  })
})
