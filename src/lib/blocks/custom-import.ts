/**
 * Import d'un bloc personnalisé : SVG, PNG ou JPG → asset Dexie + métadonnées.
 *
 * Stockage local uniquement (pas de cloud, pas de partage). L'image source
 * est conservée dans `db.assets` ; les métadonnées du bloc vont dans le store
 * (persistées). À l'insertion, l'asset est copié vers la page (voir insert.ts).
 */
import { putAsset } from '../assets'
import { createId } from '../id'
import type { CustomBlockMeta } from '../../stores/blockLibraryStore'
import type { DrawingBlockCategory, DrawingBlockUnitSystem } from './types'

/** Taille max d'un fichier de bloc personnalisé (2 Mo). */
export const CUSTOM_BLOCK_MAX_BYTES = 2 * 1024 * 1024

const ACCEPTED = ['image/svg+xml', 'image/png', 'image/jpeg']

export interface CustomBlockInput {
  file: File
  name: string
  category: DrawingBlockCategory
  unitSystem: DrawingBlockUnitSystem
  tags: string[]
}

/** Dimensions naturelles d'un fichier image, bornées pour l'insertion canvas. */
async function readDimensions(file: File): Promise<{ width: number; height: number }> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image illisible'))
      img.src = url
    })
    let w = img.naturalWidth || 120
    let h = img.naturalHeight || 120
    const MAX = 200
    if (w > MAX || h > MAX) {
      const r = Math.min(MAX / w, MAX / h)
      w = Math.round(w * r)
      h = Math.round(h * r)
    }
    return { width: Math.max(20, w), height: Math.max(20, h) }
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Valide et importe un bloc personnalisé. Stocke l'asset (notebookId fourni
 * pour le rattachement de stockage) et retourne ses métadonnées à ajouter au
 * store. Lève une erreur claire si format/taille invalides.
 */
export async function importCustomBlock(
  input: CustomBlockInput,
  notebookId: string,
): Promise<CustomBlockMeta> {
  const { file } = input
  if (!ACCEPTED.includes(file.type)) {
    throw new Error('Format non supporté (SVG, PNG ou JPG uniquement)')
  }
  if (file.size > CUSTOM_BLOCK_MAX_BYTES) {
    throw new Error('Fichier trop volumineux (max 2 Mo)')
  }
  const name = input.name.trim() || file.name.replace(/\.[^.]+$/, '') || 'Bloc personnalisé'

  const { width, height } = await readDimensions(file)
  const assetId = createId()
  await putAsset(assetId, notebookId, file, file.type)

  return {
    id: `custom-${createId()}`,
    name,
    category: input.category,
    unitSystem: input.unitSystem,
    tags: [...new Set(['personnalisé', ...input.tags.map((t) => t.trim()).filter(Boolean)])],
    defaultWidth: width,
    defaultHeight: height,
    svgBody: '',
    custom: true,
    assetId,
    createdAt: Date.now(),
  }
}
