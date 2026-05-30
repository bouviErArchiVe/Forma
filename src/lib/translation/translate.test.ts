import { describe, expect, it } from 'vitest'
import {
  getTranslationProvider,
  getTranslationText,
  mockTranslate,
  splitText,
  translateText,
  TRANSLATION_LANGUAGES,
} from './translate'

describe('translation helpers', () => {
  it('exposes fr and en languages', () => {
    expect(TRANSLATION_LANGUAGES.map((l) => l.id)).toEqual(['fr', 'en'])
  })

  it('defaults to the browser provider without env config', () => {
    expect(getTranslationProvider()).toBe('browser')
  })

  it('cleans the demo footnote from a result string', () => {
    expect(getTranslationText('Bonjour\n\n— Mode démo')).toBe('Bonjour')
    expect(getTranslationText({ text: '  Salut  ' })).toBe('Salut')
    expect(getTranslationText(null)).toBe('')
  })

  it('splits long text on sensible boundaries', () => {
    const parts = splitText('a'.repeat(300) + '. ' + 'b'.repeat(300), 450)
    expect(parts.length).toBeGreaterThan(1)
    expect(parts.join('').length).toBeGreaterThan(500)
  })

  it('keeps short text as a single chunk', () => {
    expect(splitText('court')).toEqual(['court'])
  })
})

describe('mockTranslate', () => {
  it('translates known EN words to FR', () => {
    expect(mockTranslate('wall and roof', 'en', 'fr')).toBe('mur et toiture')
  })

  it('translates known FR words to EN', () => {
    expect(mockTranslate('mur et toiture', 'fr', 'en')).toBe('wall and roof')
  })

  it('returns text unchanged for same language', () => {
    expect(mockTranslate('hello', 'en', 'en')).toBe('hello')
  })
})

describe('translateText', () => {
  it('returns an error for empty input', async () => {
    const res = await translateText('   ')
    expect(res.error).toBe('Texte source vide')
  })

  it('returns source unchanged when languages match', async () => {
    const res = await translateText('mur', { from: 'fr', to: 'fr' })
    expect(res.text).toBe('mur')
    expect(res.error).toBeUndefined()
  })
})
