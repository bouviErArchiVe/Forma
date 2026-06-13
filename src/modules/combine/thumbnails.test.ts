/**
 * Tests thumbnails Combine : gardes et cache (jsdom — pas de vrai rendu pdfjs,
 * ensurePdfWorker / pdfjs-dist / assets / db sont mockés).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearThumbCache,
  getThumbCacheSize,
  imageThumbUrl,
  pdfThumbDataUrl,
  thumbUrlForAsset,
} from './thumbnails'

const mocks = vi.hoisted(() => ({
  ensurePdfWorker: vi.fn(),
  getDocument: vi.fn(),
  resolveAssetUrl: vi.fn(),
  assetsGet: vi.fn(),
}))

vi.mock('../../lib/pdf-worker-setup', () => ({ ensurePdfWorker: mocks.ensurePdfWorker }))
vi.mock('pdfjs-dist', () => ({ getDocument: mocks.getDocument }))
vi.mock('../../lib/assets', () => ({ resolveAssetUrl: mocks.resolveAssetUrl }))
vi.mock('../../db', () => ({ db: { assets: { get: mocks.assetsGet } } }))

/** Blob factice : seuls size et arrayBuffer sont lus par pdfThumbDataUrl. */
function fakeBlob(size: number): Blob {
  return {
    size,
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  } as unknown as Blob
}

beforeEach(() => {
  clearThumbCache()
  vi.clearAllMocks()
  mocks.resolveAssetUrl.mockImplementation(async (id: string) => `blob:fake-${id}`)
})

describe('pdfThumbDataUrl — gardes', () => {
  it('blob > 50 Mo → null direct, sans aucun appel pdfjs', async () => {
    const big = fakeBlob(50 * 1024 * 1024 + 1)
    expect(await pdfThumbDataUrl(big)).toBeNull()
    expect(mocks.ensurePdfWorker).not.toHaveBeenCalled()
    expect(mocks.getDocument).not.toHaveBeenCalled()
  })

  it('blob corrompu (getDocument rejette) → null, jamais de throw', async () => {
    mocks.getDocument.mockReturnValue({ promise: Promise.reject(new Error('PDF corrompu')) })
    expect(await pdfThumbDataUrl(fakeBlob(3))).toBeNull()
    expect(mocks.ensurePdfWorker).toHaveBeenCalledOnce()
    expect(mocks.getDocument).toHaveBeenCalledOnce()
  })

  it('getDocument qui throw en synchrone → null aussi', async () => {
    mocks.getDocument.mockImplementation(() => {
      throw new Error('boom')
    })
    expect(await pdfThumbDataUrl(fakeBlob(3))).toBeNull()
  })
})

describe('cache LRU (imageThumbUrl)', () => {
  it('borné à 50 entrées', async () => {
    for (let i = 0; i < 60; i++) await imageThumbUrl(`asset-${i}`)
    expect(getThumbCacheSize()).toBe(50)
  })

  it('hit en cache → resolveAssetUrl pas rappelé ; entrée évincée → rechargée', async () => {
    for (let i = 0; i < 60; i++) await imageThumbUrl(`asset-${i}`)
    expect(mocks.resolveAssetUrl).toHaveBeenCalledTimes(60)
    // asset-59 est en cache → pas de nouvel appel
    expect(await imageThumbUrl('asset-59')).toBe('blob:fake-asset-59')
    expect(mocks.resolveAssetUrl).toHaveBeenCalledTimes(60)
    // asset-3 a été évincé (parmi les 10 plus anciens) → rechargé
    await imageThumbUrl('asset-3')
    expect(mocks.resolveAssetUrl).toHaveBeenCalledTimes(61)
  })

  it('réinsertion LRU : un accès récent protège de l’éviction', async () => {
    for (let i = 0; i < 50; i++) await imageThumbUrl(`a${i}`)
    await imageThumbUrl('a0') // réinsertion → a0 redevient le plus récent
    await imageThumbUrl('a50') // dépasse la borne → évince a1 (le plus ancien)
    expect(getThumbCacheSize()).toBe(50)
    const calls = mocks.resolveAssetUrl.mock.calls.length
    await imageThumbUrl('a0') // toujours en cache
    expect(mocks.resolveAssetUrl.mock.calls.length).toBe(calls)
    await imageThumbUrl('a1') // évincé → rechargé
    expect(mocks.resolveAssetUrl.mock.calls.length).toBe(calls + 1)
  })

  it('asset introuvable (URL vide) → pas mis en cache', async () => {
    mocks.resolveAssetUrl.mockResolvedValue('')
    expect(await imageThumbUrl('manquant')).toBe('')
    expect(getThumbCacheSize()).toBe(0)
  })
})

describe('thumbUrlForAsset', () => {
  it('image → URL objet via resolveAssetUrl', async () => {
    expect(await thumbUrlForAsset('img-1', 'image')).toBe('blob:fake-img-1')
  })

  it('image introuvable → null (fallback icône)', async () => {
    mocks.resolveAssetUrl.mockResolvedValue('')
    expect(await thumbUrlForAsset('img-x', 'image')).toBeNull()
  })

  it('pdf : asset manquant en DB → null', async () => {
    mocks.assetsGet.mockResolvedValue(undefined)
    expect(await thumbUrlForAsset('pdf-x', 'pdf')).toBeNull()
    expect(mocks.getDocument).not.toHaveBeenCalled()
  })

  it('pdf > 50 Mo → null sans rendu', async () => {
    mocks.assetsGet.mockResolvedValue({ blob: fakeBlob(51 * 1024 * 1024) })
    expect(await thumbUrlForAsset('pdf-big', 'pdf')).toBeNull()
    expect(mocks.getDocument).not.toHaveBeenCalled()
  })

  it('pdf corrompu → null, jamais de throw', async () => {
    mocks.assetsGet.mockResolvedValue({ blob: fakeBlob(3) })
    mocks.getDocument.mockReturnValue({ promise: Promise.reject(new Error('corrompu')) })
    expect(await thumbUrlForAsset('pdf-bad', 'pdf')).toBeNull()
  })

  it('erreur DB → null, jamais de throw', async () => {
    mocks.assetsGet.mockRejectedValue(new Error('db down'))
    expect(await thumbUrlForAsset('pdf-err', 'pdf')).toBeNull()
  })
})
