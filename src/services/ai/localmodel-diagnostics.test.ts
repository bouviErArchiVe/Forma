import { afterEach, describe, expect, it, vi } from 'vitest'
import { diagnoseLocalModelConnection } from './providers/localmodel'
import type { ProviderSettings } from './types'

const base: ProviderSettings = {
  providerId: 'localmodel', apiKey: '', model: '',
  endpoint: 'http://localhost:1234/v1', maxTokens: 512, temperature: 0.2, timeoutMs: 10000,
}

afterEach(() => vi.unstubAllGlobals())

function stubFetch(impl: () => unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => impl()))
}

describe('diagnoseLocalModelConnection', () => {
  it('OK avec liste de modèles', async () => {
    stubFetch(() => ({ ok: true, status: 200, json: async () => ({ data: [{ id: 'phi-3' }, { id: 'qwen2' }] }) }))
    const d = await diagnoseLocalModelConnection({ ...base, model: 'phi-3' })
    expect(d.status).toBe('ok')
    expect(d.ok).toBe(true)
    expect(d.models).toEqual(['phi-3', 'qwen2'])
  })

  it('connecté mais aucun modèle chargé → no-models (ok mais averti)', async () => {
    stubFetch(() => ({ ok: true, status: 200, json: async () => ({ data: [] }) }))
    const d = await diagnoseLocalModelConnection(base)
    expect(d.status).toBe('no-models')
    expect(d.ok).toBe(true)
    expect(d.message.toLowerCase()).toContain('aucun modèle')
  })

  it('modèle ciblé absent → model-missing avec liste', async () => {
    stubFetch(() => ({ ok: true, status: 200, json: async () => ({ data: [{ id: 'qwen2' }] }) }))
    const d = await diagnoseLocalModelConnection({ ...base, model: 'gemma-2b' })
    expect(d.status).toBe('model-missing')
    expect(d.ok).toBe(false)
    expect(d.message).toContain('gemma-2b')
    expect(d.models).toEqual(['qwen2'])
  })

  it('404 → endpoint invalide', async () => {
    stubFetch(() => ({ ok: false, status: 404, text: async () => 'not found' }))
    const d = await diagnoseLocalModelConnection(base)
    expect(d.status).toBe('endpoint-invalid')
    expect(d.message).toContain('/v1')
  })

  it('autre HTTP → http-error', async () => {
    stubFetch(() => ({ ok: false, status: 500, text: async () => 'boom' }))
    const d = await diagnoseLocalModelConnection(base)
    expect(d.status).toBe('http-error')
    expect(d.httpStatus).toBe(500)
  })

  it('échec réseau opaque → unreachable-or-cors (prudent, sans affirmer la cause)', async () => {
    stubFetch(() => { throw new TypeError('Failed to fetch') })
    const d = await diagnoseLocalModelConnection(base)
    expect(d.status).toBe('unreachable-or-cors')
    expect(d.ok).toBe(false)
    expect(d.message.toLowerCase()).toContain('cors')
    expect(d.message.toLowerCase()).toContain('injoignable')
  })

  it('timeout → statut timeout', async () => {
    stubFetch(() => { const e = new Error('timed out'); e.name = 'TimeoutError'; throw e })
    const d = await diagnoseLocalModelConnection(base)
    expect(d.status).toBe('timeout')
  })

  it('réponse non-JSON → invalid-response', async () => {
    stubFetch(() => ({ ok: true, status: 200, json: async () => { throw new Error('bad json') } }))
    const d = await diagnoseLocalModelConnection(base)
    expect(d.status).toBe('invalid-response')
  })
})
