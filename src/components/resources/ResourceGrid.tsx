/**
 * ResourceGrid — grille d'aperçus d'un catalogue de ressources graphiques.
 * Chaque vignette rend le SVG de la ressource (via le pipeline bloc) et
 * conserve le ratio d'origine (pas de distortion).
 */
import { blockToSvg } from '../../lib/blocks/types'
import { resourceToBlock } from '../../lib/resources/resourceToBlock'
import { groupResourcesByType, type GraphicResource } from '../../lib/resources/resourceTypes'

function ResourceTile({
  resource,
  selectedId,
  onSelect,
}: {
  resource: GraphicResource
  selectedId: string | null
  onSelect: (r: GraphicResource) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(resource)}
      className={`text-left p-1.5 rounded-lg border transition-colors ${selectedId === resource.id ? 'border-forma-accent bg-forma-accent/5' : 'border-forma-border hover:border-forma-accent/50'}`}
    >
      <span
        className="flex w-full aspect-square items-center justify-center rounded bg-forma-surface text-forma-text overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: blockToSvg(resourceToBlock(resource), { stroke: 'currentColor' }) }}
      />
      <span className="block text-[9px] text-forma-text truncate mt-1 leading-tight">{resource.name}</span>
    </button>
  )
}

export function ResourceGrid({
  resources,
  selectedId,
  onSelect,
  cols = 3,
  emptyLabel = 'Aucune ressource',
  grouped = false,
}: {
  resources: GraphicResource[]
  selectedId: string | null
  onSelect: (r: GraphicResource) => void
  cols?: 2 | 3
  emptyLabel?: string
  /** Regroupe les vignettes par type (Hachures / Symboles / Détails…) avec sous-en-têtes. */
  grouped?: boolean
}) {
  if (resources.length === 0) {
    return <p className="text-[11px] text-forma-muted text-center py-4">{emptyLabel}</p>
  }

  const gridClass = `grid ${cols === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-1.5`

  if (grouped) {
    const groups = groupResourcesByType(resources)
    return (
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {groups.map((g) => (
          <div key={g.type}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1.5 sticky top-0 bg-forma-bg/95 py-0.5">
              {g.label} <span className="font-normal opacity-70">({g.resources.length})</span>
            </p>
            <div className={gridClass}>
              {g.resources.map((r) => (
                <ResourceTile key={r.id} resource={r} selectedId={selectedId} onSelect={onSelect} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`${gridClass} max-h-[60vh] overflow-y-auto`}>
      {resources.map((r) => (
        <ResourceTile key={r.id} resource={r} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}
