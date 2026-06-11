import type { SearchHit } from './search'

const LABELS: Record<SearchHit['type'], string> = {
  title: 'Carnet',
  text: 'Texte',
  stroke: 'Encre',
  pdf: 'PDF',
}

export function searchHitTypeLabel(type: SearchHit['type']): string {
  return LABELS[type]
}
