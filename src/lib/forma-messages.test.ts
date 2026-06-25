import { describe, expect, it } from 'vitest'
import {
  FORMAI_EMPTY_FALLBACK,
  FORMAI_INTERRUPTED,
  FORMAI_LOCAL_LIMITS,
  FORMAI_NO_KNOWLEDGE,
  REVIEW_SHORT_NOTE,
  REVIEW_WARNING,
} from './forma-messages'
import { REVIEW_WARNING as VALIDATE_REVIEW_WARNING } from '../services/knowledge-pack/validate'
import { NO_KNOWLEDGE_MESSAGE } from '../services/ai/providers/local'

describe('forma-messages — phrase officielle review', () => {
  it('conserve EXACTEMENT la phrase officielle de prudence', () => {
    expect(REVIEW_WARNING).toBe(
      'Selon la source disponible dans Forma, cette information est à vérifier dans la version officielle/applicable avant usage réglementaire ou professionnel.',
    )
  })
  it('réexporte la source canonique (validate) sans divergence', () => {
    expect(REVIEW_WARNING).toBe(VALIDATE_REVIEW_WARNING)
  })
  it('note courte « à vérifier » uniforme et concise', () => {
    expect(REVIEW_SHORT_NOTE).toBe('À vérifier dans la source officielle/applicable.')
  })
})

describe('forma-messages — wiring FormAI (pas de divergence)', () => {
  it('le provider local réexporte le même no-result centralisé', () => {
    expect(NO_KNOWLEDGE_MESSAGE).toBe(FORMAI_NO_KNOWLEDGE)
  })
  it('no-result mentionne la base Knowledge locale (honnêteté)', () => {
    expect(FORMAI_NO_KNOWLEDGE.toLowerCase()).toContain('base knowledge locale')
  })
  it('messages d’état non vides', () => {
    for (const m of [FORMAI_EMPTY_FALLBACK, FORMAI_LOCAL_LIMITS, FORMAI_INTERRUPTED]) {
      expect(m.trim().length).toBeGreaterThan(0)
    }
  })
})
