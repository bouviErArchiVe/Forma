/**
 * Bibliothèque de blocs de dessin — modèle de données.
 *
 * Un bloc est un symbole technique vectoriel (SVG) déposable sur un canvas
 * Forma. À l'insertion, le SVG est rasterisé en haute définition et stocké
 * comme `ImageElement` (réutilise tout le pipeline image : rendu, lasso,
 * déplacement/redim./rotation, sauvegarde, export PDF). Les métadonnées de
 * bloc (id/catégorie/unité) sont conservées sur l'ImageElement.
 *
 * NB : à NE PAS confondre avec la Library principale des documents.
 */

export type DrawingBlockUnitSystem = 'metric' | 'imperial'

export type DrawingBlockCategory =
  | 'steel'
  | 'wood'
  | 'concrete'
  | 'masonry'
  | 'doors-windows'
  | 'stairs'
  | 'furniture'
  | 'sanitary'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'symbols'
  | 'annotations'
  | 'site'
  | 'landscape'

/** Libellés français des catégories (ordre d'affichage du panneau). */
export const BLOCK_CATEGORY_LABELS: Record<DrawingBlockCategory, string> = {
  steel: 'Acier',
  wood: 'Bois',
  concrete: 'Béton',
  masonry: 'Maçonnerie',
  'doors-windows': 'Portes / Fenêtres',
  stairs: 'Escaliers',
  furniture: 'Mobilier',
  sanitary: 'Sanitaire',
  electrical: 'Électrique',
  plumbing: 'Plomberie',
  hvac: 'CVC / HVAC',
  symbols: 'Symboles',
  annotations: 'Annotations',
  site: 'Site',
  landscape: 'Paysage',
}

export interface DrawingBlock {
  id: string
  name: string
  category: DrawingBlockCategory
  unitSystem: DrawingBlockUnitSystem
  tags: string[]
  description?: string
  /** Dimensions par défaut à l'insertion (px canvas). */
  defaultWidth: number
  defaultHeight: number
  /**
   * Corps SVG du bloc (sans la balise <svg> englobante) dessiné dans un
   * viewBox `0 0 defaultWidth defaultHeight`. Vectoriel = net à tout zoom.
   */
  svgBody: string
  /** Libellé d'échelle/dimension indicatif (ex. « 2x4 », « Ø 100 »). */
  scaleLabel?: string
}

/** Construit le document SVG complet d'un bloc (thumbnail + rasterisation). */
export function blockToSvg(block: DrawingBlock, opts: { stroke?: string; background?: string } = {}): string {
  const stroke = opts.stroke ?? '#1f2937'
  const bg = opts.background ?? 'none'
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${block.defaultWidth} ${block.defaultHeight}" ` +
    `width="${block.defaultWidth}" height="${block.defaultHeight}">` +
    (bg !== 'none' ? `<rect width="100%" height="100%" fill="${bg}"/>` : '') +
    `<g fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
    `vector-effect="non-scaling-stroke">${block.svgBody}</g></svg>`
  )
}
