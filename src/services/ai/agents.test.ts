/**
 * Tests des agents spécialisés FormAI.
 */
import { describe, expect, it } from 'vitest'
import { ICON_NAMES } from '../../components/ui/Icon'
import { DEFAULT_AGENT_ID, FORMAI_AGENTS, getAgent } from './agents'

describe('FORMAI_AGENTS', () => {
  it('contient les 8 agents requis', () => {
    const ids = FORMAI_AGENTS.map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'general',
        'architecture',
        'construction',
        'cnb',
        'gestion',
        'documentation',
        'calculs',
        'recherche',
      ]),
    )
    expect(FORMAI_AGENTS).toHaveLength(8)
  })

  it('ids uniques', () => {
    const ids = FORMAI_AGENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('chaque agent est complet (prompt, capacités, limites, suggestions)', () => {
    for (const agent of FORMAI_AGENTS) {
      expect(agent.name).toBeTruthy()
      expect(agent.description).toBeTruthy()
      expect(agent.role).toBeTruthy()
      expect(agent.systemPrompt.length).toBeGreaterThan(100)
      expect(agent.capabilities.length).toBeGreaterThanOrEqual(3)
      expect(agent.limits.length).toBeGreaterThanOrEqual(2)
      expect(agent.suggestedPrompts.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('les icônes référencées existent dans le composant Icon', () => {
    for (const agent of FORMAI_AGENTS) {
      expect(ICON_NAMES, `icône inconnue : ${agent.icon}`).toContain(agent.icon)
    }
  })

  it("l'agent CNB interdit explicitement l'invention de références", () => {
    const cnb = getAgent('cnb')
    expect(cnb.systemPrompt).toMatch(/n'inventes JAMAIS/i)
    expect(cnb.systemPrompt).toContain('texte officiel')
  })

  it("l'agent Calculs impose les étapes et les unités SI", () => {
    const calculs = getAgent('calculs')
    expect(calculs.systemPrompt).toContain('étapes')
    expect(calculs.systemPrompt).toContain('SI')
    expect(calculs.systemPrompt).toContain('Blondel')
  })
})

describe('getAgent', () => {
  it('retourne l’agent demandé', () => {
    expect(getAgent('architecture').id).toBe('architecture')
  })

  it('retombe sur l’agent général pour un id inconnu/null', () => {
    expect(getAgent('inexistant').id).toBe(DEFAULT_AGENT_ID)
    expect(getAgent(null).id).toBe(DEFAULT_AGENT_ID)
    expect(getAgent(undefined).id).toBe(DEFAULT_AGENT_ID)
  })
})
