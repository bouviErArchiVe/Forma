/**
 * ResourceGrid — grille d'aperçus d'un catalogue de ressources graphiques.
 * Chaque vignette rend le SVG de la ressource (via le pipeline bloc) et
 * conserve le ratio d'origine (pas de distortion).
 */
import { blockToSvg } from '../../lib/blocks/types'
import { resourceToBlock } from '../../lib/resources/resourceToBlock'
import type { GraphicResource } from '../../lib/resources/resourceTypes'

export function ResourceGrid({
  resources,
  selectedId,
  onSelect,
  cols = 3,
  emptyLabel = 'Aucune ressource',
}: {
  resources: GraphicResource[]
  selectedId: string | null
  onSelect: (r: GraphicResource) => void
  cols?: 2 | 3
  emptyLabel?: string
}) {
  if (resources.length === 0) {
    return <p className="text-[11px] text-forma-muted text-center py-4">{emptyLabel}</p>
  }
  return (
    <div className={`grid ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5 max-h-[60vh] overflow-y-auto`}>
      {resources.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onSelect(r)}
          className={`text-left p-1.5 rounded-lg border transition-colors ${selectedId === r.id ? 'border-forma-accent bg-forma-accent/5' : 'border-forma-border hover:border-forma-accent/50'}`}
        >
          <span
            className="flex w-full aspect-square items-center justify-center rounded bg-forma-surface text-forma-text overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: blockToSvg(resourceToBlock(r), { stroke: 'currentColor' }) }}
          />
          <span className="block text-[9px] text-forma-text truncate mt-1 leading-tight">{r.name}</span>
        </button>
      ))}
    </div>
  )
}
