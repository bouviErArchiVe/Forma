import { describe, expect, it } from 'vitest'
import { buildKnowledgeGrounding } from './knowledge-grounding'

describe('buildKnowledgeGrounding', () => {
  it('injecte la fiche pertinente avec source, confiance et lien (poutre)', async () => {
    const g = await buildKnowledgeGrounding("c'est quoi une poutre ?")
    expect(g).not.toBeNull()
    expect(g!.slug).toBe('poutre')
    expect(g!.block).toContain('poutre')
    expect(g!.block.toLowerCase()).toContain('source')
    expect(g!.block.toLowerCase()).toContain('confiance')
    expect(g!.block).toContain('/dictionary?slug=poutre')
    expect(g!.block).toContain("N'invente AUCUNE")
  })

  it('marque la prudence « à vérifier » (garde-corps)', async () => {
    const g = await buildKnowledgeGrounding("c'est quoi un garde-corps ?")
    expect(g).not.toBeNull()
    expect(g!.toVerify).toBe(true)
    expect(g!.block.toLowerCase()).toContain('à vérifier')
  })

  it('renvoie null si aucune fiche pertinente (pas d’invention)', async () => {
    expect(await buildKnowledgeGrounding('zzqwxkjpzz blarg')).toBeNull()
  })
})
