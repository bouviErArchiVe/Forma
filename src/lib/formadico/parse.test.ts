import { describe, expect, it } from 'vitest'
import { parseWiktionaryEntry } from './parse'

const SAMPLE_FR = `
== {{langue|fr}} ==
=== {{S|nom|fr}} ===
'''mur''' {{m}}
# Ouvrage de [[maçonnerie]] qui sépare ou clôt un espace.
# Paroi verticale d'un bâtiment.

=== Synonymes ===
* [[cloison]]
* [[paroi]]
`

describe('parseWiktionaryEntry', () => {
  it('extracts definitions and marks the entry found', () => {
    const entry = parseWiktionaryEntry(SAMPLE_FR, 'mur', 'fr')
    expect(entry.word).toBe('mur')
    expect(entry.lang).toBe('fr')
    expect(entry.found).toBe(true)
    expect(entry.definitions && entry.definitions.length).toBeGreaterThan(0)
    expect(entry.definitions?.[0].text).toContain('maçonnerie')
    expect(entry.source).toBe('wiktionary')
    expect(entry.url).toContain('fr.wiktionary.org')
  })

  it('extracts synonyms section', () => {
    const entry = parseWiktionaryEntry(SAMPLE_FR, 'mur', 'fr')
    expect(entry.synonyms).toContain('cloison')
  })

  it('returns found=false for empty wikitext', () => {
    const entry = parseWiktionaryEntry('', 'inconnu', 'fr')
    expect(entry.found).toBe(false)
    expect(entry.definitions).toEqual([])
  })
})
