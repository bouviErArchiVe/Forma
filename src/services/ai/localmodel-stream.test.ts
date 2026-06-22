import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractSSEDelta, streamLocalModelChat } from './providers/localmodel'
import type { ProviderChatRequest, ProviderSettings } from './types'

const settings: ProviderSettings = {
  providerId: 'localmodel', apiKey: '', model: 'local-model',
  endpoint: 'http://localhost:1234/v1', maxTokens: 256, temperature: 0.2, timeoutMs: 5000,
}
const req = (signal?: AbortSignal): ProviderChatRequest => ({
  messages: [{ role: 'user', content: 'salut' }], settings, ...(signal ? { signal } : {}),
})

/** Construit une Response mock dont le body streame les chunks SSE fournis. */
function sseResponse(chunks: string[], ok = true, status = 200): Response {
  const enc = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c))
      controller.close()
    },
  })
  return { ok, status, body, text: async () => '' } as unknown as Response
}

const data = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n`

afterEach(() => vi.unstubAllGlobals())

describe('extractSSEDelta', () => {
  it('extrait le contenu d un delta', () => {
    expect(extractSSEDelta(data('Bonjour').trim())).toBe('Bonjour')
  })
  it('ignore [DONE], lignes vides et non-data', () => {
    expect(extractSSEDelta('data: [DONE]')).toBe('')
    expect(extractSSEDelta('')).toBe('')
    expect(extractSSEDelta(': keep-alive')).toBe('')
  })
  it('tolère un JSON malformé (renvoie vide)', () => {
    expect(extractSSEDelta('data: {bad json')).toBe('')
  })
})

describe('streamLocalModelChat', () => {
  it('succès : concatène les deltas et appelle onChunk', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([data('Une '), data('poutre '), data('porte.'), 'data: [DONE]\n'])))
    const got: string[] = []
    const r = await streamLocalModelChat(req(), (d) => got.push(d))
    expect(r.text).toBe('Une poutre porte.')
    expect(r.fromLocalModel).toBe(true)
    expect(r.fromCloud).toBe(false)
    expect(got).toEqual(['Une ', 'poutre ', 'porte.'])
  })

  it('chunks partiels : delta scindé entre deux lectures réseau', async () => {
    // La 1re trame coupe une ligne SSE en plein milieu.
    const full = data('Hello world')
    const cut = Math.floor(full.length / 2)
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([full.slice(0, cut), full.slice(cut), 'data: [DONE]\n'])))
    const r = await streamLocalModelChat(req(), () => {})
    expect(r.text).toBe('Hello world')
  })

  it('abort utilisateur : finalise le partiel, interrupted=true, pas de fallback', async () => {
    const ac = new AbortController()
    vi.stubGlobal('fetch', vi.fn(async () => {
      const enc = new TextEncoder()
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(enc.encode(data('Début ')))
          // Comme un vrai fetch : l'abort fait échouer la lecture en cours.
          ac.signal.addEventListener('abort', () => controller.error(new DOMException('Aborted', 'AbortError')))
          setTimeout(() => ac.abort(), 5)
        },
      })
      return { ok: true, status: 200, body, text: async () => '' } as unknown as Response
    }))
    const r = await streamLocalModelChat(req(ac.signal), () => {})
    expect(r.interrupted).toBe(true)
    expect(r.text).toContain('Début')
    expect(r.error).toMatch(/interrompue/i)
  })

  it('erreur réseau : fallback non-stream (mode local #11)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const r = await streamLocalModelChat(req(), () => {})
    expect(r.interrupted).toBeUndefined()
    expect(r.fromLocalModel).toBeFalsy() // vient du fallback extractif, pas du modèle
    expect(r.error).toMatch(/indisponible/i)
    expect(typeof r.text).toBe('string')
  })

  it('HTTP non-ok : fallback non-stream', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([], false, 500)))
    const r = await streamLocalModelChat(req(), () => {})
    expect(r.fromLocalModel).toBeFalsy()
    expect(r.error).toMatch(/500/)
  })

  it('SSE malformé : ignore les fragments invalides, garde le valide', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse([data('OK '), 'data: {oops\n', data('fin'), 'data: [DONE]\n'])))
    const r = await streamLocalModelChat(req(), () => {})
    expect(r.text).toBe('OK fin')
  })

  it('flux vide → fallback', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse(['data: [DONE]\n'])))
    const r = await streamLocalModelChat(req(), () => {})
    expect(r.fromLocalModel).toBeFalsy()
    expect(r.error).toMatch(/vide/i)
  })
})
