/**
 * Tests Combine V2 : fusion PDF/images (pdf-lib, sans UI).
 */
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { mergeToPdf, type MergeInputItem } from './merge-pdf'

/** PDF minimal d'une page généré par pdf-lib. */
async function makePdfBlob(pages = 1): Promise<Blob> {
  const doc = await PDFDocument.create()
  for (let i = 0; i < pages; i++) doc.addPage([200, 200])
  const bytes = await doc.save()
  return new Blob([bytes as BlobPart], { type: 'application/pdf' })
}

/** PNG 1×1 transparent (base64 fixe). */
function makePngBlob(): Blob {
  const b64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  return new Blob([bytes], { type: 'image/png' })
}

async function pageCount(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes)
  return doc.getPageCount()
}

describe('mergeToPdf', () => {
  it('fusionne deux PDF dans l’ordre', async () => {
    const items: MergeInputItem[] = [
      { blob: await makePdfBlob(1), kind: 'pdf', name: 'a' },
      { blob: await makePdfBlob(2), kind: 'pdf', name: 'b' },
    ]
    const out = await mergeToPdf(items)
    expect(await pageCount(out)).toBe(3)
  })

  it('PDF + image PNG → pages combinées', async () => {
    const items: MergeInputItem[] = [
      { blob: await makePdfBlob(1), kind: 'pdf', name: 'doc' },
      { blob: makePngBlob(), kind: 'image', name: 'photo' },
    ]
    const out = await mergeToPdf(items)
    expect(await pageCount(out)).toBe(2)
  })

  it('liste vide → erreur propre', async () => {
    await expect(mergeToPdf([])).rejects.toThrow('Aucun élément')
  })

  it('item corrompu sans onItemError → erreur nommant l’item', async () => {
    const items: MergeInputItem[] = [
      { blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'application/pdf' }), kind: 'pdf', name: 'corrompu' },
    ]
    await expect(mergeToPdf(items)).rejects.toThrow('corrompu')
  })

  it('item corrompu avec onItemError → signalé puis ignoré', async () => {
    const failures: string[] = []
    const items: MergeInputItem[] = [
      { blob: await makePdfBlob(1), kind: 'pdf', name: 'ok' },
      { blob: new Blob([new Uint8Array([9, 9])], { type: 'application/pdf' }), kind: 'pdf', name: 'mauvais' },
    ]
    const out = await mergeToPdf(items, { onItemError: (f) => failures.push(f.name) })
    expect(failures).toEqual(['mauvais'])
    expect(await pageCount(out)).toBe(1)
  })
})
