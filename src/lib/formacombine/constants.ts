import type { FormaCombinePageType } from '../../types'

export const A4_PX = { width: 794, height: 1123 }

export const COMBINE_PAGE_TYPES: Record<FormaCombinePageType, string> = {
  raster: 'Image / PDF',
  text: 'Texte',
  blank: 'Page blanche',
  separator: 'Séparation',
  title: 'Titre',
}
