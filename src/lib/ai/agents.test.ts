/**
 * Tests du registre des agents de page FormAI V2 (presets de prompt système).
 *
 * Couvre : registre + résolution d'agent, composition de la persona sur un
 * prompt système (non-régression du `generic`), garde anti-invention renforcée
 * des agents normatifs, et disclaimers (générique + vérification officielle).
 *
 * Intégration avec les builders de `canvas-actions.ts` : on vérifie que
 * `buildPrompt` applique la persona ET conserve l'ancrage (GROUNDING_RULES).
 */
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PAGE_AGENT_ID,
  NORMATIVE_DISCLAIMER,
  NORMATIVE_GROUNDING,
  PAGE_AGENTS,
  applyAgentToSystemPrompt,
  getPageAgent,
  isNormativeAgent,
} from './agents'
import { AI_DISCLAIMER, buildPrompt } from './canvas-actions'

// ─── Registre ─────────────────────────────────────────────────────────────────

describe('registre PAGE_AGENTS', () => {
  it('contient les agents attendus (générique + 4 spécialisés)', () => {
    const ids = PAGE_AGENTS.map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining(['generic', 'architecture', 'normes', 'structure', 'etudes']),
    )
    expect(PAGE_AGENTS.length).toBeGreaterThanOrEqual(5)
  })

  it('chaque agent expose nom, icône, description', () => {
    for (const a of PAGE_AGENTS) {
      expect(a.name.trim().length).toBeGreaterThan(0)
      expect(a.icon.trim().length).toBeGreaterThan(0)
      expect(a.description.trim().length).toBeGreaterThan(0)
    }
  })

  it('le premier agent est le défaut (generic) et sa persona est vide', () => {
    expect(PAGE_AGENTS[0].id).toBe('generic')
    expect(DEFAULT_PAGE_AGENT_ID).toBe('generic')
    expect(getPageAgent('generic').persona).toBe('')
  })

  it('les ids sont uniques', () => {
    const ids = PAGE_AGENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('getPageAgent', () => {
  it('résout un agent connu', () => {
    expect(getPageAgent('architecture').id).toBe('architecture')
  })

  it('retombe sur generic pour un id inconnu / nul', () => {
    expect(getPageAgent('inconnu').id).toBe('generic')
    expect(getPageAgent(undefined).id).toBe('generic')
    expect(getPageAgent(null).id).toBe('generic')
  })
})

// ─── Agents normatifs ──────────────────────────────────────────────────────────

describe('agents normatifs', () => {
  it('normes et structure sont normatifs ; les autres non', () => {
    expect(isNormativeAgent('normes')).toBe(true)
    expect(isNormativeAgent('structure')).toBe(true)
    expect(isNormativeAgent('generic')).toBe(false)
    expect(isNormativeAgent('architecture')).toBe(false)
    expect(isNormativeAgent('etudes')).toBe(false)
  })

  it('la persona des agents normatifs porte la garde anti-invention renforcée', () => {
    for (const a of PAGE_AGENTS.filter((x) => x.normative)) {
      expect(a.persona).toContain(NORMATIVE_GROUNDING)
      expect(a.persona.toLowerCase()).toContain('inventes jamais')
    }
  })

  it('NORMATIVE_DISCLAIMER impose la vérification dans le texte officiel', () => {
    expect(NORMATIVE_DISCLAIMER.toLowerCase()).toContain('officiel')
    expect(NORMATIVE_DISCLAIMER.toLowerCase()).toMatch(/vérifi/)
    expect(NORMATIVE_DISCLAIMER.toLowerCase()).toContain('fait foi')
  })
})

// ─── Composition de prompt (pur) ───────────────────────────────────────────────

describe('applyAgentToSystemPrompt', () => {
  it('generic : prompt système inchangé (non-régression)', () => {
    const base = 'Prompt système de base.'
    expect(applyAgentToSystemPrompt(base, 'generic')).toBe(base)
    expect(applyAgentToSystemPrompt(base, undefined)).toBe(base)
  })

  it('agent spécialisé : préfixe la persona, conserve la base', () => {
    const base = 'Prompt système de base.'
    const out = applyAgentToSystemPrompt(base, 'architecture')
    expect(out).toContain(getPageAgent('architecture').persona)
    expect(out).toContain(base)
    expect(out.startsWith(getPageAgent('architecture').persona)).toBe(true)
  })
})

// ─── Intégration avec les builders canvas-actions ──────────────────────────────

describe('buildPrompt + agent', () => {
  it('sans agentId : comportement historique (générique)', () => {
    const withDefault = buildPrompt('explain', 'Mur', 'texte')
    const explicit = buildPrompt('explain', 'Mur', 'texte', 'page', 'generic')
    expect(withDefault.system).toBe(explicit.system)
    // L'ancrage anti-hallucination des builders reste présent.
    expect(withDefault.system).toContain('UNIQUEMENT sur le texte')
  })

  it('agent normatif : persona injectée ET ancrage conservé', () => {
    const { system } = buildPrompt('explain', 'Issue', 'texte', 'page', 'normes')
    expect(system).toContain(NORMATIVE_GROUNDING)
    // GROUNDING_RULES du builder toujours là (double garde).
    expect(system).toContain('UNIQUEMENT sur le texte')
    expect(system.toLowerCase()).toContain('invente')
  })

  it('agent architecture appliqué au résumé document', () => {
    const { system, user } = buildPrompt('summarize', 'Carnet', 'c', 'document', 'architecture')
    expect(system).toContain(getPageAgent('architecture').persona)
    expect(user.toLowerCase()).toContain('document')
  })

  it('explain-selection reste cible et accepte un agent', () => {
    const { system, user } = buildPrompt('explain-selection', 'Mur', 'extrait', 'page', 'etudes')
    expect(user.toLowerCase()).toContain('extrait')
    expect(system).toContain(getPageAgent('etudes').persona)
  })
})

// ─── Disclaimers ───────────────────────────────────────────────────────────────

describe('disclaimers', () => {
  it('AI_DISCLAIMER générique reste exporté et inchangé d’esprit', () => {
    expect(AI_DISCLAIMER.toLowerCase()).toContain('vérifier')
  })

  it('le disclaimer normatif est distinct du générique', () => {
    expect(NORMATIVE_DISCLAIMER).not.toBe(AI_DISCLAIMER)
  })
})
