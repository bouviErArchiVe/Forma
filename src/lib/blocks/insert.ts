/**
 * Insertion d'un bloc dans une page : rasterisation haute définition du SVG
 * → blob PNG → asset Dexie → ImageElement (réutilise le pipeline image).
 *
 * Le visuel est un raster net (rendu à RASTER_SCALE×) ; les métadonnées de
 * bloc (id/catégorie/unité) sont conservées sur l'ImageElement pour l'identité.
 */
import { db } from '../../db'
import { putAsset } from '../assets'
import { createId } from '../id'
import type { ImageElement, Page } from '../../types'
import { blockToSvg, isAssetBacked, type DrawingBlock } from './types'

/** Facteur de suréchantillonnage du raster (netteté à l'export/zoom). */
const RASTER_SCALE = 4

/** Rasterise le SVG d'un bloc en blob PNG (navigateur uniquement). */
export async function rasterizeBlock(block: DrawingBlock): Promise<Blob> {
  const svg = blockToSvg(block)
  const svgBlob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(svgBlob)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('SVG illisible'))
      img.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(block.defaultWidth * RASTER_SCALE)
    canvas.height = Math.round(block.defaultHeight * RASTER_SCALE)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D indisponible')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    canvas.width = 0
    canvas.height = 0
    if (!blob) throw new Error('Rasterisation échouée')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Construit l'ImageElement d'un bloc inséré (page-op pur, testable) :
 * image centrée sur (cx, cy), référençant l'asset raster, métadonnées de
 * bloc conservées. Ne touche pas la base — voir `addBlockToPage`.
 */
export function buildBlockImageElement(
  page: Page,
  block: DrawingBlock,
  assetId: string,
  cx: number,
  cy: number,
): ImageElement {
  const w = block.defaultWidth
  const h = block.defaultHeight
  return {
    id: createId(),
    x: cx - w / 2,
    y: cy - h / 2,
    width: w,
    height: h,
    assetId,
    pageId: page.id,
    blockId: block.id,
    blockCategory: block.category,
    blockUnit: block.unitSystem,
  }
}

/**
 * Insère un bloc dans `page`, centré sur (cx, cy) en coordonnées canvas.
 * Stocke le raster dans `db.assets` (notebookId) et retourne la page mise à
 * jour. À passer ensuite au `commit` du canvas (historique + persistance).
 */
export async function addBlockToPage(
  page: Page,
  notebookId: string,
  block: DrawingBlock,
  cx: number,
  cy: number,
): Promise<Page> {
  const assetId = createId()
  if (isAssetBacked(block)) {
    // Bloc personnalisé image : copie l'asset source vers un asset propre à la
    // page (l'instance est indépendante de l'entrée de bibliothèque).
    const source = block.assetId ? await db.assets.get(block.assetId) : undefined
    if (!source) throw new Error('Image du bloc personnalisé introuvable')
    await putAsset(assetId, notebookId, source.blob, source.mimeType)
  } else {
    const blob = await rasterizeBlock(block)
    await putAsset(assetId, notebookId, blob, 'image/png')
  }
  const img = buildBlockImageElement(page, block, assetId, cx, cy)
  return { ...page, images: [...page.images, img] }
}
