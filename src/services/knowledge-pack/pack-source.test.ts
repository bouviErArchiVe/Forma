import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  __resetPackSource,
  configurePackSource,
  fetchPackJson,
  PackChecksumError,
  resolvePackBaseUrl,
  sha256Hex,
  SAME_ORIGIN_PACK_BASE,
} from './pack-source'

const PAYLOAD = { hello: 'monde', n: 3 }
const RAW = JSON.stringify(PAYLOAD)

/** Mock fetch : `routes` mappe une fin d'URL → 'ok' | 'fail'. */
function stubFetch(routes: Array<{ match: string; ok: boolean; body?: string }>) {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    const r = routes.find((x) => String(url).includes(x.match))
    if (!r || !r.ok) return { ok: false, status: 404, text: async () => 'nf' } as unknown as Response
    const body = r.body ?? RAW
    return { ok: true, status: 200, text: async () => body, json: async () => JSON.parse(body) } as unknown as Response
  }))
}

afterEach(() => { vi.unstubAllGlobals(); __resetPackSource() })

describe('resolvePackBaseUrl', () => {
  it('défaut = same-origin', () => {
    expect(resolvePackBaseUrl()).toBe(SAME_ORIGIN_PACK_BASE)
  })
  it('remote configurée prioritaire, explicit encore prioritaire', () => {
    configurePackSource({ remoteBaseUrl: 'https://cdn.example.com/pack/' })
    expect(resolvePackBaseUrl()).toBe('https://cdn.example.com/pack')
    expect(resolvePackBaseUrl('https://other/x/')).toBe('https://other/x')
  })
  it('__resetPackSource ramène au same-origin', () => {
    configurePackSource({ remoteBaseUrl: 'https://cdn/x' })
    __resetPackSource()
    expect(resolvePackBaseUrl()).toBe(SAME_ORIGIN_PACK_BASE)
  })
})

describe('fetchPackJson — source & fallback', () => {
  it('same-origin par défaut', async () => {
    stubFetch([{ match: SAME_ORIGIN_PACK_BASE, ok: true }])
    const r = await fetchPackJson<typeof PAYLOAD>('x.json')
    expect(r.data).toEqual(PAYLOAD)
    expect(r.usedFallback).toBe(false)
    expect(r.baseUrl).toBe(SAME_ORIGIN_PACK_BASE)
  })

  it('remote OK → pas de fallback', async () => {
    configurePackSource({ remoteBaseUrl: 'https://cdn/x' })
    stubFetch([{ match: 'https://cdn/x', ok: true }, { match: SAME_ORIGIN_PACK_BASE, ok: true }])
    const r = await fetchPackJson<typeof PAYLOAD>('x.json')
    expect(r.usedFallback).toBe(false)
    expect(r.baseUrl).toBe('https://cdn/x')
  })

  it('remote échoue → repli same-origin (si autorisé)', async () => {
    configurePackSource({ remoteBaseUrl: 'https://cdn/x', allowSameOriginFallback: true })
    stubFetch([{ match: 'https://cdn/x', ok: false }, { match: SAME_ORIGIN_PACK_BASE, ok: true }])
    const r = await fetchPackJson<typeof PAYLOAD>('x.json')
    expect(r.usedFallback).toBe(true)
    expect(r.baseUrl).toBe(SAME_ORIGIN_PACK_BASE)
    expect(r.data).toEqual(PAYLOAD)
  })

  it('remote échoue + fallback interdit → throw', async () => {
    configurePackSource({ remoteBaseUrl: 'https://cdn/x', allowSameOriginFallback: false })
    stubFetch([{ match: 'https://cdn/x', ok: false }, { match: SAME_ORIGIN_PACK_BASE, ok: true }])
    await expect(fetchPackJson('x.json')).rejects.toThrow()
  })
})

describe('fetchPackJson — checksum fail-safe', () => {
  it('checksum correct → OK', async () => {
    stubFetch([{ match: SAME_ORIGIN_PACK_BASE, ok: true }])
    const good = await sha256Hex(RAW)
    const r = await fetchPackJson<typeof PAYLOAD>('x.json', { expectedChecksum: good })
    expect(r.data).toEqual(PAYLOAD)
  })

  it('checksum mismatch → PackChecksumError (jamais de fallback)', async () => {
    configurePackSource({ remoteBaseUrl: 'https://cdn/x' })
    stubFetch([{ match: 'https://cdn/x', ok: true }, { match: SAME_ORIGIN_PACK_BASE, ok: true }])
    await expect(fetchPackJson('x.json', { expectedChecksum: 'deadbeef' })).rejects.toBeInstanceOf(PackChecksumError)
  })
})
