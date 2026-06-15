/**
 * Conversion canonique d'une ressource graphique en DrawingBlock insérable.
 *
 * Réutilise le pipeline bloc validé (`blockToSvg → raster → asset Dexie →
 * ImageElement`) sans toucher au canvas. Les anciens convertisseurs
 * (`hatchToBlock`, `symbolToBlock`, `detailToBlock`) délèguent ici via leurs
 * adaptateurs `…ToResource`, en produisant exactement le même `id`/contenu.
 */
import type { DrawingBlock } from '../blocks/types'
import type { GraphicResource } from './resourceTypes'

/** Identifiant de bloc déterministe d'une ressource : `<type>-<id>`. */
export function resourceBlockId(resource: Pick<GraphicResource, 'type' | 'id'>): string {
  return `${resource.type}-${resource.id}`
}

/** Convertit une ressource graphique en DrawingBlock (insertion canvas). */
export function resourceToBlock(resource: GraphicResource): DrawingBlock {
  return {
    id: resourceBlockId(resource),
    name: resource.name,
    category: resource.blockCategory,
    unitSystem: 'metric',
    tags: [resource.blockTagPrefix, ...resource.tags],
    description: resource.description,
    defaultWidth: resource.defaultWidth,
    defaultHeight: resource.defaultHeight,
    svgBody: resource.svg,
  }
}
