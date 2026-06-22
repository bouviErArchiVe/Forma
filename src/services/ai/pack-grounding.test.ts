import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import { buildPackGrounding } from './pack-grounding'
import { __resetRagCache } from '../knowledge-pack/rag'
import { __resetEnsureImport } from '../knowledge-pack/import'
import type { PackRagChunk } from '../knowledge-pack/types'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

function chunk(p: Partial<PackRagChunk> & { id: string; content: string; importGate: PackRagChunk['importGate'] }): PackRagChunk {
  return {
    document_name: p.document_name ?? 'doc.pdf',
    page_start: p.page_start ?? 1,
    page_end: p.page_end ?? 1,
    section: p.section,
    content: p.content,
    tags: p.tags ?? [],
    confidence: p.confidence ?? 0.8,
    qualityStatus: p.qualityStatus ?? 'ok',
    importGate: p.importGate,
    safeForDefaultRag: p.importGate === 'clean',
    formaUsefulnessScore: p.formaUsefulnessScore ?? 40,
    ...p,
  } as PackRagChunk
}

const CLEAN = chunk({
  id: 'c_clean', document_name: 'ching 3e.pdf', page_start: 53, importGate: 'clean',
  content: 'La fondation transmet les charges du bâtiment au sol porteur. La semelle filante répartit la charge.',
  tags: ['fondation', 'structure'],
})
const REVIEW = chunk({
  id: 'c_review', document_name: 'CCQ.pdf', page_start: 120, importGate: 'review',
  content: "Les exigences d'accessibilité du CCQ imposent des largeurs de dégagement minimales.",
  tags: ['accessibilite', 'ccq'],
})
const QUARANTINE = chunk({
  id: 'c_quar', document_name: 'raw.pdf', page_start: 9, importGate: 'quarantine',
  content: 'Texte fondation brut non vérifié quarantine accessibilité CCQ.',
  tags: ['fondation', 'accessibilite'],
})

beforeEach(async () => {
  await resetDb()
  __resetRagCache()
  __resetEnsureImport()
  // Batch déjà importé → ensure ne refait pas de fetch réseau.
  await db.formaImportBatches.put({ packName: 'TEST_PACK', version: '1', createdAt: 'now', status: 'completed' })
  await db.formaRagChunks.bulkPut([CLEAN, REVIEW, QUARANTINE])
})

describe('buildPackGrounding (grounding génératif RAG pack)', () => {
  it('injecte un extrait clean avec citation document + page', async () => {
    const g = await buildPackGrounding('fondation semelle')
    expect(g).not.toBeNull()
    expect(g!.block).toContain('ching 3e.pdf · p. 53')
    expect(g!.block).toMatch(/\[clean\]/)
    expect(g!.usedReview).toBe(false)
    expect(g!.warn).toBe(false)
  })

  it('ne descend sur review (avec avertissement) que si aucun clean pertinent', async () => {
    const g = await buildPackGrounding('exigences accessibilité CCQ dégagement')
    expect(g).not.toBeNull()
    expect(g!.usedReview).toBe(true)
    expect(g!.warn).toBe(true)
    expect(g!.block).toContain('à vérifier dans la version officielle')
    expect(g!.block).toMatch(/\[review\]/)
  })

  it("n'injecte JAMAIS de chunk quarantine", async () => {
    const g = await buildPackGrounding('fondation accessibilité CCQ')
    expect(g!.block).not.toMatch(/\[quarantine\]/)
    expect(g!.block).not.toContain('raw.pdf')
  })

  it('question normative → avertissement même sur source clean', async () => {
    const g = await buildPackGrounding('coefficient U et sécurité incendie fondation')
    expect(g!.warn).toBe(true)
    expect(g!.block).toContain('à vérifier dans la version officielle')
  })

  it('aucun extrait pertinent → null (le provider répond sans contexte pack)', async () => {
    const g = await buildPackGrounding('xyzzyqwerty')
    expect(g).toBeNull()
  })

  it('borne le nombre d’extraits et la longueur (prompt borné)', async () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      chunk({ id: 'm' + i, document_name: 'd' + i + '.pdf', importGate: 'clean', content: 'fondation '.repeat(200), tags: ['fondation'] }),
    )
    await db.formaRagChunks.bulkPut(many)
    __resetRagCache()
    const g = await buildPackGrounding('fondation')
    const blocks = (g!.block.match(/"""/g) ?? []).length / 2
    expect(blocks).toBeLessThanOrEqual(3)
  })
})
