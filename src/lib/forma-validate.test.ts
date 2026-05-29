import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { FORMA_FORMAT_VERSION } from './forma-types'
import {
  computeFormaPayloadDigest,
  validateFormaManifest,
  validateFormaZip,
  verifyFormaPayloadIntegrity,
} from './forma-validate'

describe('forma-validate', () => {
  it('rejects invalid formatVersion', () => {
    const issues = validateFormaManifest({ formatVersion: 99, appVersion: '0', exportedAt: 1, packageType: 'library' })
    expect(issues.some((i) => i.code === 'format_version')).toBe(true)
  })

  it('accepts valid manifest', () => {
    const issues = validateFormaManifest({
      formatVersion: FORMA_FORMAT_VERSION,
      appVersion: '0.18.0',
      exportedAt: Date.now(),
      packageType: 'library',
    })
    expect(issues.filter((i) => i.severity === 'error')).toHaveLength(0)
  })

  it('validates minimal forma-v1 zip structure', async () => {
    const zip = new JSZip()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: FORMA_FORMAT_VERSION,
        appVersion: '0.18.0',
        exportedAt: Date.now(),
        packageType: 'library',
      }),
    )
    zip.file('metadata.json', JSON.stringify({ notebookCount: 1, pageCount: 1, folderCount: 0 }))
    zip.file('indexes/folders.json', '[]')
    zip.file('indexes/notebooks.json', JSON.stringify([{ id: 'nb1', name: 'A' }]))
    zip.file('indexes/audio.json', '[]')
    zip.file('indexes/study.json', '[]')
    zip.file('indexes/share-links.json', '[]')
    zip.file('indexes/snapshots.json', '[]')
    zip.file('pages/p1.json', JSON.stringify({ id: 'p1', notebookId: 'nb1', order: 0, strokes: [] }))
    zip.file('backup.json', '{}')

    const v = await validateFormaZip(zip)
    expect(v.format).toBe('forma-v1')
    expect(v.ok).toBe(true)
    expect(v.pageFileCount).toBe(1)
  })

  it('computes stable SHA-256 digest excluding manifest.json', async () => {
    const zip = new JSZip()
    zip.file('pages/a.json', '{"id":"a"}')
    zip.file('indexes/notebooks.json', '[]')
    const d1 = await computeFormaPayloadDigest(zip)
    const d2 = await computeFormaPayloadDigest(zip)
    expect(d1).toMatch(/^[a-f0-9]{64}$/)
    expect(d1).toBe(d2)
    zip.file('manifest.json', '{}')
    expect(await computeFormaPayloadDigest(zip)).toBe(d1)
  })

  it('warns when manifest digest does not match payload', async () => {
    const zip = new JSZip()
    zip.file('pages/p1.json', '{}')
    const digest = await computeFormaPayloadDigest(zip)
    const manifest = {
      formatVersion: FORMA_FORMAT_VERSION,
      appVersion: '0.21.0',
      exportedAt: 1,
      packageType: 'library' as const,
      integrity: { algorithm: 'sha256' as const, digest: '0'.repeat(64) },
    }
    zip.file('manifest.json', JSON.stringify(manifest))
    const issues = await verifyFormaPayloadIntegrity(zip, manifest)
    expect(issues.some((i) => i.code === 'integrity_mismatch')).toBe(true)
    expect(digest).not.toBe('0'.repeat(64))
  })

  it('warns on metadata page count mismatch', async () => {
    const zip = new JSZip()
    zip.file(
      'manifest.json',
      JSON.stringify({
        formatVersion: FORMA_FORMAT_VERSION,
        appVersion: '0.18.0',
        exportedAt: 1,
        packageType: 'library',
      }),
    )
    zip.file('metadata.json', JSON.stringify({ notebookCount: 1, pageCount: 99, folderCount: 0 }))
    zip.file('indexes/notebooks.json', '[]')
    zip.file('indexes/folders.json', '[]')
    zip.file('indexes/audio.json', '[]')
    zip.file('indexes/study.json', '[]')
    zip.file('indexes/share-links.json', '[]')
    zip.file('indexes/snapshots.json', '[]')

    const v = await validateFormaZip(zip)
    expect(v.issues.some((i) => i.code === 'page_count_mismatch')).toBe(true)
  })
})
