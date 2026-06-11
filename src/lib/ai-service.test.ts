/**
 * Tests for AI service layer (PACK 7).
 * Covers: local fallback, context extraction, prompt system,
 *         graceful error handling — no real API calls.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { aiChat, PRESET_PROMPTS, SYSTEM_PROMPTS, type AIMessage, type AIMode } from './ai-service'
import { buildPageContext, summarizeContext } from './ai-context'
import type { AIConfig } from '../stores/aiStore'
import type { Page } from '../types'

// ─── Local mode config (no cloud, no API key) ─────────────────────────────────

const LOCAL_CONFIG: AIConfig = {
  provider: 'local',
  apiKey: '',
  model: '',
  endpoint: '',
  cloudEnabled: false,
  maxTokens: 512,
  temperature: 0.7,
}

const CLOUD_CONFIG_NO_KEY: AIConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  endpoint: 'https://api.openai.com/v1',
  cloudEnabled: true,
  maxTokens: 512,
  temperature: 0.7,
}

const CLOUD_CONFIG_WITH_KEY: AIConfig = {
  ...CLOUD_CONFIG_NO_KEY,
  apiKey: 'test-key-xxx',
}

// ─── aiChat — local mode ──────────────────────────────────────────────────────

describe('aiChat (local mode)', () => {
  const messages: AIMessage[] = [
    { role: 'user', content: 'Bonjour' },
  ]

  it('returns a result without calling network', async () => {
    const result = await aiChat(messages, LOCAL_CONFIG, 'chat', 'Texte de test')
    expect(result.text).toBeTruthy()
    expect(result.fromCloud).toBe(false)
    expect(result.error).toBeUndefined()
  })

  it('summarize mode returns non-empty text', async () => {
    const ctx = "Les structures en bois massif offrent d'excellentes performances parasismiques. Le CLT présente une rigidité accrue."
    const result = await aiChat(messages, LOCAL_CONFIG, 'summarize', ctx)
    expect(result.text).toBeTruthy()
    expect(result.fromCloud).toBe(false)
  })

  it('keywords mode returns keyword list', async () => {
    const ctx = 'Architecture parasismique structure bois CLT performance résistance.'
    const result = await aiChat(messages, LOCAL_CONFIG, 'keywords', ctx)
    expect(result.text).toContain('Mots-clés')
    expect(result.fromCloud).toBe(false)
  })

  it('outline mode returns bullet points', async () => {
    const ctx = 'La fondation est en béton. Le mur est en brique. Le toit est en tuile.'
    const result = await aiChat(messages, LOCAL_CONFIG, 'outline', ctx)
    expect(result.text).toContain('•')
    expect(result.fromCloud).toBe(false)
  })

  it('cnb mode returns informative message without cloud', async () => {
    const result = await aiChat(messages, LOCAL_CONFIG, 'cnb', 'notes projet')
    expect(result.text).toContain('local')
    expect(result.fromCloud).toBe(false)
  })

  it('returns fallback for empty context (chat mode)', async () => {
    const result = await aiChat(
      [{ role: 'user', content: 'Résume mes notes' }],
      LOCAL_CONFIG,
      'chat',
      '',
    )
    expect(result.text).toBeTruthy()
    expect(result.fromCloud).toBe(false)
  })
})

// ─── aiChat — cloud disabled (cloudEnabled=false) ────────────────────────────

describe('aiChat (cloud disabled)', () => {
  it('uses local fallback when cloudEnabled is false even with a key', async () => {
    const config: AIConfig = { ...CLOUD_CONFIG_WITH_KEY, cloudEnabled: false }
    const result = await aiChat(
      [{ role: 'user', content: 'test' }],
      config,
      'chat',
      'contexte',
    )
    expect(result.fromCloud).toBe(false)
  })
})

// ─── aiChat — cloud with failed network ──────────────────────────────────────

describe('aiChat (cloud network failure)', () => {
  beforeEach(() => {
    // Mock fetch to simulate network failure
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
  })

  it('falls back to local on network failure and sets error field', async () => {
    const result = await aiChat(
      [{ role: 'user', content: 'Résume' }],
      CLOUD_CONFIG_WITH_KEY,
      'summarize',
      'Texte de test pour résumé local.',
    )
    expect(result.text).toBeTruthy()
    expect(result.error).toBeTruthy()
    expect(result.error).toContain('Erreur cloud')
    expect(result.fromCloud).toBe(false)  // fell back to local
  })

  it('does not throw — always returns AIResult', async () => {
    await expect(
      aiChat([{ role: 'user', content: 'x' }], CLOUD_CONFIG_WITH_KEY, 'chat', '')
    ).resolves.toBeDefined()
  })
})

// ─── PRESET_PROMPTS ───────────────────────────────────────────────────────────

describe('PRESET_PROMPTS', () => {
  it('has required prompts', () => {
    const ids = PRESET_PROMPTS.map((p) => p.id)
    expect(ids).toContain('summarize')
    expect(ids).toContain('keywords')
    expect(ids).toContain('outline')
    expect(ids).toContain('cnb')
    expect(ids).toContain('ccq')
    expect(ids).toContain('rmu')
  })

  it('each preset has icon, label, buildUserPrompt', () => {
    for (const p of PRESET_PROMPTS) {
      expect(p.icon).toBeTruthy()
      expect(p.label).toBeTruthy()
      expect(typeof p.buildUserPrompt).toBe('function')
    }
  })

  it('buildUserPrompt produces non-empty string', () => {
    for (const p of PRESET_PROMPTS) {
      const prompt = p.buildUserPrompt('mon contexte de test', 'ma question')
      expect(prompt.length).toBeGreaterThan(0)
    }
  })
})

// ─── SYSTEM_PROMPTS ───────────────────────────────────────────────────────────

describe('SYSTEM_PROMPTS', () => {
  it('has default, architecture, cnb, ccq, rmu prompts', () => {
    expect(SYSTEM_PROMPTS.default).toBeTruthy()
    expect(SYSTEM_PROMPTS.architecture).toBeTruthy()
    expect(SYSTEM_PROMPTS.cnb).toBeTruthy()
    expect(SYSTEM_PROMPTS.ccq).toBeTruthy()
    expect(SYSTEM_PROMPTS.rmu).toBeTruthy()
  })

  it('CNB prompt mentions article citation', () => {
    expect(SYSTEM_PROMPTS.cnb.toLowerCase()).toContain('cnb')
    expect(SYSTEM_PROMPTS.cnb).toContain('article')
  })
})

// ─── buildPageContext ─────────────────────────────────────────────────────────

describe('buildPageContext', () => {
  function makePage(overrides: Partial<Page> = {}): Page {
    return {
      id: 'p1', notebookId: 'nb1', order: 0,
      template: 'blank', rotation: 0,
      strokes: [], shapes: [], texts: [], images: [], stickers: [], tapes: [],
      ...overrides,
    }
  }

  it('returns empty context for empty page', () => {
    const ctx = buildPageContext(makePage())
    expect(ctx.text).toBe('')
    expect(ctx.sources).toHaveLength(0)
  })

  it('extracts canvas text elements', () => {
    const page = makePage({
      texts: [
        { id: 't1', x: 0, y: 0, width: 100, height: 30, content: 'Texte canvas', fontSize: 14, color: '#000', align: 'left', pageId: 'p1' },
      ],
    })
    const ctx = buildPageContext(page)
    expect(ctx.text).toContain('Texte canvas')
    expect(ctx.sources).toContain('canvas')
  })

  it('extracts FormaDoc HTML content', () => {
    const page = makePage({ content: '<h1>Mon titre</h1><p>Paragraphe de test.</p>' })
    const ctx = buildPageContext(page)
    expect(ctx.text).toContain('Mon titre')
    expect(ctx.text).toContain('Paragraphe de test')
    expect(ctx.sources).toContain('content')
  })

  it('extracts FormaTab cell values', () => {
    const tableData = JSON.stringify({
      rows: 2, cols: 2,
      cells: {
        A1: { value: 'Colonne A' },
        B1: { value: 'Colonne B' },
        A2: { value: 'Alpha' },
      },
    })
    const page = makePage({ tableData })
    const ctx = buildPageContext(page)
    expect(ctx.text).toContain('Colonne A')
    expect(ctx.text).toContain('Alpha')
    expect(ctx.sources).toContain('table')
  })

  it('extracts FMoodboard text items', () => {
    const moodboardData = JSON.stringify({
      items: [
        { id: '1', kind: 'text', text: 'Vision du projet', x: 0, y: 0, width: 150, height: 50, zIndex: 1 },
        { id: '2', kind: 'image', dataUrl: 'data:...', x: 0, y: 0, width: 100, height: 100, zIndex: 2 },
      ],
      groups: [], canvasWidth: 1600, canvasHeight: 1000, background: '#fff',
    })
    const page = makePage({ moodboardData })
    const ctx = buildPageContext(page)
    expect(ctx.text).toContain('Vision du projet')
    expect(ctx.sources).toContain('board')
  })

  it('extracts inkText and pdfText', () => {
    const page = makePage({ inkText: 'Encre manuscrite', pdfText: 'Texte PDF' })
    const ctx = buildPageContext(page)
    expect(ctx.text).toContain('Encre manuscrite')
    expect(ctx.text).toContain('Texte PDF')
    expect(ctx.sources).toContain('ink')
    expect(ctx.sources).toContain('pdf')
  })

  it('truncates long context', () => {
    const longText = 'a'.repeat(10000)
    const page = makePage({ content: `<p>${longText}</p>` })
    const ctx = buildPageContext(page)
    expect(ctx.text.length).toBeLessThanOrEqual(6100) // 6000 + ellipsis
    expect(ctx.rawLength).toBeGreaterThan(6000)
  })
})

// ─── summarizeContext ──────────────────────────────────────────────────────────

describe('summarizeContext', () => {
  it('returns "Aucun contenu" for empty context', () => {
    expect(summarizeContext({ text: '', sources: [], rawLength: 0 })).toBe('Aucun contenu')
  })

  it('returns word count and sources', () => {
    const result = summarizeContext({ text: 'hello world test', sources: ['canvas', 'ink'], rawLength: 16 })
    expect(result).toContain('mots')
    expect(result).toContain('canvas')
    expect(result).toContain('ink')
  })
})
