/**
 * MATRICE QA FormAI (Sprint #20) — verrouille la chaîne sourcée de bout en bout.
 *
 * Couvre, via fake-indexeddb + fixtures pack LÉGÈRES (aucun fetch des 64 MB) :
 * seeds-only · pack clean (citation doc/page) · pack review (badge + avertissement)
 * · normatif (phrase officielle) · quarantine jamais utilisée · no-result honnête
 * · streaming localmodel mocké (SSE assemblé + sources conservées) · Stop/Abort
 * (réponse partielle) · serveur absent → fallback · sources persistées · message
 * legacy sans sources · pack non importé → fallback seeds.
 *
 * Toute régression sur l'un de ces comportements fait échouer ce fichier.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../db'
import { createConversation, getConversation } from './conversations'
import { sendFormAIMessage, sendFormAIMessageStream } from './chat'
import { __resetRagCache } from '../knowledge-pack/rag'
import { __resetEnsureImport } from '../knowledge-pack/import'
import { useAIStore } from '../../stores/aiStore'
import { REVIEW_WARNING } from '../knowledge-pack/validate'
import type { PackRagChunk } from '../knowledge-pack/types'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

function chunk(p: Partial<PackRagChunk> & { id: string; content: string; importGate: PackRagChunk['importGate'] }): PackRagChunk {
  return {
    document_name: p.document_name ?? 'doc.pdf', page_start: p.page_start ?? 1, page_end: p.page_end ?? 1,
    section: p.section, content: p.content, tags: p.tags ?? [], confidence: p.confidence ?? 0.8,
    qualityStatus: p.qualityStatus ?? 'ok', importGate: p.importGate,
    safeForDefaultRag: p.importGate === 'clean', formaUsefulnessScore: p.formaUsefulnessScore ?? 40, ...p,
  } as PackRagChunk
}

// Fixtures avec des tokens UNIQUES (zephyr*) pour router déterministe seeds vs pack.
const CLEAN = chunk({ id: 'fx_clean', document_name: 'REPERTOIRE.pdf', page_start: 1, importGate: 'clean',
  content: 'zephyrclean masterformat répertoire normatif fondation liste maîtresse', tags: ['zephyrclean', 'fondation'] })
const CLEAN_NORM = chunk({ id: 'fx_cleannorm', document_name: 'THERMIQUE.pdf', page_start: 5, importGate: 'clean',
  content: 'zephyrnorm coefficient u valeur thermique enveloppe', tags: ['zephyrnorm'] })
const REVIEW = chunk({ id: 'fx_review', document_name: 'CCQ.pdf', page_start: 120, importGate: 'review',
  content: "zephyrreview exigences accessibilité ccq dégagement largeur", tags: ['zephyrreview', 'accessibilite'] })
const QUAR = chunk({ id: 'fx_quar', document_name: 'raw.pdf', page_start: 9, importGate: 'quarantine',
  content: 'zephyrquar contenu brut non vérifié', tags: ['zephyrquar'] })

const enc = new TextEncoder()
const SSE = (parts: string[]): Response => ({
  ok: true, status: 200, text: async () => '',
  body: new ReadableStream<Uint8Array>({ start(c) { for (const p of parts) c.enqueue(enc.encode(p)); c.close() } }),
} as unknown as Response)
const DELTA = (t: string) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n`

function assistantOf(conv: { messages: Array<{ role: string }> }) {
  return conv.messages.find((m) => m.role === 'assistant') as { content: string; sources?: Array<{ kind: string; gate?: string; document?: string; page?: number; slug?: string; toVerify?: boolean }>; error?: string } | undefined
}

beforeEach(async () => {
  await resetDb()
  __resetRagCache()
  __resetEnsureImport()
  useAIStore.getState().applyProviderDefaults('local')
  // Pack « importé » via fixtures légères (aucun fetch 64 MB).
  await db.formaImportBatches.put({ packName: 'TEST_PACK', version: '1', createdAt: 'now', status: 'completed' })
  await db.formaRagChunks.bulkPut([CLEAN, CLEAN_NORM, REVIEW, QUAR])
})
afterEach(() => vi.unstubAllGlobals())

describe('QA matrix — chemin extractif (provider local)', () => {
  it('seeds-only : réponse + source seed avec slug', async () => {
    const c = await createConversation()
    const a = assistantOf((await sendFormAIMessage(c.id, "c'est quoi une poutre ?", {}))!.conversation)!
    expect(a.sources?.some((s) => s.kind === 'seed' && s.slug === 'poutre')).toBe(true)
  })

  it('pack clean : citation document + page, gate clean', async () => {
    const c = await createConversation()
    const a = assistantOf((await sendFormAIMessage(c.id, 'zephyrclean masterformat', {}))!.conversation)!
    const pack = a.sources?.find((s) => s.kind === 'pack')
    expect(pack?.document).toBe('REPERTOIRE.pdf')
    expect(pack?.page).toBe(1)
    expect(pack?.gate).toBe('clean')
    expect(a.content).toContain('REPERTOIRE.pdf')
  })

  it('pack review : badge À-vérifier + avertissement officiel', async () => {
    const c = await createConversation()
    const a = assistantOf((await sendFormAIMessage(c.id, 'zephyrreview ccq largeur', {}))!.conversation)!
    const pack = a.sources?.find((s) => s.kind === 'pack')
    expect(pack?.gate).toBe('review')
    expect(pack?.toVerify).toBe(true)
    expect(a.content).toContain(REVIEW_WARNING)
  })

  it('normatif sur source clean : avertissement officiel quand même', async () => {
    const c = await createConversation()
    const a = assistantOf((await sendFormAIMessage(c.id, 'zephyrnorm coefficient U', {}))!.conversation)!
    expect(a.content).toContain(REVIEW_WARNING)
  })

  it('quarantine JAMAIS utilisée → no-result honnête', async () => {
    const c = await createConversation()
    const a = assistantOf((await sendFormAIMessage(c.id, 'zephyrquar', {}))!.conversation)!
    expect(a.sources ?? []).toHaveLength(0)
    expect(a.content).not.toContain('raw.pdf')
  })

  it('aucune source → no-result honnête sans fausse citation', async () => {
    const c = await createConversation()
    const a = assistantOf((await sendFormAIMessage(c.id, 'zzqwxkjpzz inconnu total', {}))!.conversation)!
    expect(a.sources).toBeUndefined()
  })

  it('pack non importé → fallback seeds (pas de crash)', async () => {
    await db.formaRagChunks.clear()
    __resetRagCache()
    const c = await createConversation()
    const a = assistantOf((await sendFormAIMessage(c.id, "c'est quoi une poutre ?", {}))!.conversation)!
    expect(a.sources?.some((s) => s.kind === 'seed')).toBe(true)
  })
})

describe('QA matrix — streaming localmodel (mocké)', () => {
  it('SSE assemblé + sources conservées (seeds + pack)', async () => {
    useAIStore.getState().applyProviderDefaults('localmodel')
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('/chat/completions')) return SSE([DELTA('La fondation '), DELTA('porte.'), 'data: [DONE]\n'])
      throw new TypeError('offline') // manifest & co : offline → ensure échoue, fixtures conservées
    }))
    const c = await createConversation()
    const chunks: string[] = []
    const a = assistantOf((await sendFormAIMessageStream(c.id, 'fondation poutre', { onChunk: (x) => chunks.push(x) }))!.conversation)!
    expect(chunks.length).toBeGreaterThan(1)
    expect(a.content).toBe('La fondation porte.')
    expect((a.sources ?? []).length).toBeGreaterThan(0)
    expect(a.sources?.some((s) => s.kind === 'seed')).toBe(true)
  })

  it('Stop/Abort : réponse partielle conservée + interrompue', async () => {
    useAIStore.getState().applyProviderDefaults('localmodel')
    const ac = new AbortController()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (!url.includes('/chat/completions')) throw new TypeError('offline')
      return { ok: true, status: 200, text: async () => '', body: new ReadableStream<Uint8Array>({
        start(c) { c.enqueue(enc.encode(DELTA('Début partiel '))); ac.signal.addEventListener('abort', () => c.error(new DOMException('a', 'AbortError'))); setTimeout(() => ac.abort(), 30) },
      }) } as unknown as Response
    }))
    const c = await createConversation()
    await sendFormAIMessageStream(c.id, 'fondation', { signal: ac.signal, onChunk: () => {} })
    const a = assistantOf((await getConversation(c.id))!)!
    expect(a.content).toContain('Début')
    expect(a.error).toMatch(/interrompue/i)
  })

  it('serveur absent → fallback extractif (réponse non vide)', async () => {
    useAIStore.getState().applyProviderDefaults('localmodel')
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
    const c = await createConversation()
    const a = assistantOf((await sendFormAIMessageStream(c.id, "c'est quoi une poutre ?", { onChunk: () => {} }))!.conversation)!
    expect(a.content.length).toBeGreaterThan(0)
    expect(a.sources?.some((s) => s.kind === 'seed')).toBe(true)
  })
})

describe('QA matrix — persistance & robustesse', () => {
  it('un message legacy sans sources ne casse pas la lecture', async () => {
    const c = await createConversation()
    const conv = await db.aiConversations.get(c.id)
    conv!.messages.push({ id: 'legacy', role: 'assistant', content: 'ancienne réponse', ts: Date.now() })
    await db.aiConversations.put(conv!)
    const fresh = await getConversation(c.id)
    expect(fresh!.messages.find((m) => m.id === 'legacy')!.content).toBe('ancienne réponse')
    expect((fresh!.messages.find((m) => m.id === 'legacy') as { sources?: unknown }).sources).toBeUndefined()
  })
})
