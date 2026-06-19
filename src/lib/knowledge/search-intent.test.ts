/**
 * Tests Knowledge Core — search-intent.
 */
import { describe, expect, it } from 'vitest'
import {
  extractKeywords,
  normalizeKnowledgeQuery,
  parseSearchIntent,
} from './search-intent'

describe('normalizeKnowledgeQuery', () => {
  it('minuscules, accents, ponctuation, espaces', () => {
    expect(normalizeKnowledgeQuery('  Élévation ! ')).toBe('elevation')
    expect(normalizeKnowledgeQuery('Mur   porteur ?')).toBe('mur porteur')
    expect(normalizeKnowledgeQuery('porte-à-faux')).toBe('porte-a-faux')
  })

  it('apostrophe typographique normalisée', () => {
    expect(normalizeKnowledgeQuery('quest-ce')).toBe('quest-ce')
    expect(normalizeKnowledgeQuery('d’échiffre')).toBe("d'echiffre")
  })

  it('chaîne vide / espaces → vide', () => {
    expect(normalizeKnowledgeQuery('   ')).toBe('')
    expect(normalizeKnowledgeQuery('')).toBe('')
  })
})

describe('extractKeywords', () => {
  it('retire mots vides et tokens < 2 caractères', () => {
    expect(extractKeywords("qu'est-ce que le mur porteur")).toEqual(['mur', 'porteur'])
  })

  it('conserve les termes signifiants', () => {
    expect(extractKeywords('définition du linteau')).toEqual(['linteau'])
  })
})

describe('parseSearchIntent', () => {
  it('vide → empty', () => {
    const i = parseSearchIntent('   ')
    expect(i.kind).toBe('empty')
    expect(i.keywords).toEqual([])
    expect(i.normalized).toBe('')
  })

  it('mot unique → lookup', () => {
    const i = parseSearchIntent('Linteau')
    expect(i.kind).toBe('lookup')
    expect(i.normalized).toBe('linteau')
    expect(i.raw).toBe('Linteau')
  })

  it('plusieurs mots → search', () => {
    const i = parseSearchIntent('résistance au feu')
    expect(i.kind).toBe('search')
    expect(i.keywords).toContain('resistance')
    expect(i.keywords).toContain('feu')
    // « au » est un mot vide
    expect(i.keywords).not.toContain('au')
  })

  it('conserve la requête brute intacte', () => {
    expect(parseSearchIntent('  Mur Porteur  ').raw).toBe('  Mur Porteur  ')
  })
})
