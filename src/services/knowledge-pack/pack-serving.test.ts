/**
 * Contrat de service du pack distant (Sprint #31).
 *
 * Verrouille la cohérence entre `vercel.json` (rewrite prod), le miroir proxy
 * dev/preview (`vite.config.ts`) et le loader (`pack-source`) : le chemin
 * same-origin `/remote-pack/part10/<file>` doit servir les fichiers À PLAT de
 * la release GitHub `pack-part10-v1`, avec repli same-origin local préservé.
 * Fixtures légères uniquement — jamais les 64 Mo en CI.
 */
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  configurePackSource,
  fetchPackJson,
  resolvePackBaseUrl,
  SAME_ORIGIN_PACK_BASE,
  __resetPackSource,
} from './pack-source'

const REMOTE_BASE = '/remote-pack/part10'
const RELEASE_BASE = 'https://github.com/bouviErArchiVe/Forma/releases/download/pack-part10-v1'

interface VercelRewrite { source: string; destination: string }
const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as { rewrites?: VercelRewrite[] }

afterEach(() => { vi.unstubAllGlobals(); __resetPackSource() })

describe('vercel.json — contrat du rewrite pack', () => {
  const rw = (vercel.rewrites ?? []).find((r) => r.source.startsWith(REMOTE_BASE))

  it('expose /remote-pack/part10/:file (chemin same-origin attendu par le loader)', () => {
    expect(rw).toBeDefined()
    expect(rw!.source).toBe(`${REMOTE_BASE}/:file`)
  })

  it('cible la release pack-part10-v1 à plat (:file, pas de sous-dossier)', () => {
    expect(rw!.destination).toBe(`${RELEASE_BASE}/:file`)
  })

  it('ne définit aucune autre règle (pas d effet de bord sur le routing)', () => {
    expect(vercel.rewrites).toHaveLength(1)
  })
})

describe('loader via le chemin same-origin /remote-pack/part10', () => {
  it('résout la base distante configurée et fetch le fichier à plat', async () => {
    const seen: string[] = []
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      seen.push(String(url))
      return { ok: true, status: 200, text: async () => '{"ok":true}' } as unknown as Response
    }))
    configurePackSource({ remoteBaseUrl: REMOTE_BASE })
    expect(resolvePackBaseUrl()).toBe(REMOTE_BASE)
    const r = await fetchPackJson<{ ok: boolean }>('offline_manifest.json')
    expect(seen[0]).toBe(`${REMOTE_BASE}/offline_manifest.json`)
    expect(r.usedFallback).toBe(false)
  })

  it('rewrite indisponible (404/panne) → repli same-origin local automatique', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const u = String(url)
      if (u.startsWith(REMOTE_BASE)) return { ok: false, status: 404, text: async () => '' } as unknown as Response
      return { ok: true, status: 200, text: async () => '{"ok":true}' } as unknown as Response
    }))
    configurePackSource({ remoteBaseUrl: REMOTE_BASE, allowSameOriginFallback: true })
    const r = await fetchPackJson<{ ok: boolean }>('offline_manifest.json')
    expect(r.usedFallback).toBe(true)
    expect(r.baseUrl).toBe(SAME_ORIGIN_PACK_BASE)
  })
})
