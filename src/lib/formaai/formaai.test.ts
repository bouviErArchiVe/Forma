import { describe, expect, it } from 'vitest'
import { extractSnippet, highlightParts, norm, scoreMatch, splitSearchTerms } from './normalize'
import { rankItems } from './search'
import type { SearchItem } from './indexer'
import { runAIAction } from './provider'

describe('formaai normalize', () => {
  it('strips diacritics and lowercases', () => {
    expect(norm('Élévation FAÇADE')).toBe('elevation facade')
  })

  it('splits terms ignoring empties', () => {
    expect(splitSearchTerms('  mur   coupe-feu ')).toEqual(['mur', 'coupe-feu'])
  })

  it('scores full-query and per-term matches', () => {
    expect(scoreMatch('mur coupe-feu RF60', 'mur coupe')).toBeGreaterThan(scoreMatch('mur', 'mur coupe'))
    expect(scoreMatch('rien', 'absent')).toBe(0)
  })

  it('extracts a snippet around the first match', () => {
    const text = 'a'.repeat(200) + ' blondel ' + 'b'.repeat(200)
    const snip = extractSnippet(text, 'blondel', 20)
    expect(snip).toContain('blondel')
    expect(snip.startsWith('…')).toBe(true)
  })

  it('highlights matching parts ignoring accents', () => {
    const parts = highlightParts('Élévation', 'elevation')
    expect(parts.some((p) => p.match)).toBe(true)
    expect(parts.map((p) => p.text).join('')).toBe('Élévation')
  })
})

describe('formaai rankItems', () => {
  const index: SearchItem[] = [
    { id: 'doc:1', source: 'doc', type: 'doc', title: 'Mur coupe-feu', text: 'détail RF60', route: '/formadoc', updatedAt: 2 },
    { id: 'sheet:1', source: 'sheet', type: 'sheet', title: 'Métré', text: 'mur béton', route: '/formatab', updatedAt: 5 },
    { id: 'f:1', source: 'formula', type: 'formula', title: 'Blondel', text: 'escalier giron', route: '/formulas', updatedAt: 0 },
    {
      id: 'fh:1',
      source: 'formula',
      type: 'formula-history',
      title: 'Loi de Blondel (calcul)',
      text: 'Loi de Blondel 2H + G = 62 cm 280',
      route: '/formulas',
      updatedAt: 1000,
    },
  ]

  it('returns nothing for empty query', () => {
    expect(rankItems(index, '   ')).toEqual([])
  })

  it('ranks title matches above body matches', () => {
    const res = rankItems(index, 'mur')
    expect(res[0].id).toBe('doc:1')
    expect(res.map((r) => r.id)).toContain('sheet:1')
  })

  it('respects the source filter', () => {
    const res = rankItems(index, 'mur', { sourceFilter: 'sheet' })
    expect(res).toHaveLength(1)
    expect(res[0].id).toBe('sheet:1')
  })

  it('attaches a snippet to each result', () => {
    const res = rankItems(index, 'escalier')
    expect(res[0].snippet).toContain('escalier')
  })

  it('finds saved formula calculations under the formula source filter', () => {
    const res = rankItems(index, '62 cm', { sourceFilter: 'formula' })
    expect(res).toHaveLength(1)
    expect(res[0].type).toBe('formula-history')
  })
})

describe('formaai provider local fallback', () => {
  it('summarizes locally without network', async () => {
    const out = await runAIAction('summarize', 'Phrase une. Phrase deux. Phrase trois.')
    expect(out).toContain('Résumé')
  })

  it('classifies architecture content with tags', async () => {
    const out = await runAIAction('classify', 'escalier giron blondel')
    expect(out).toContain('#escaliers')
  })

  it('rejects unknown actions', async () => {
    await expect(runAIAction('unknown', 'x')).rejects.toThrow()
  })

  it('rejects empty input', async () => {
    await expect(runAIAction('summarize', '   ')).rejects.toThrow()
  })
})
