/**
 * ResourceCatalog — catalogue réutilisable de ressources graphiques (Resource
 * Factory) : recherche + filtres + grille d'aperçus + panneau de détail.
 *
 * Une seule UI pour toutes les familles de ressources insérables (hachures,
 * symboles, et futures). Chaque famille fournit simplement un `GraphicResource[]`.
 */
import { useMemo, useState } from 'react'
import {
  groupResourcesByType,
  searchResources,
  type GraphicResource,
} from '../../lib/resources/resourceTypes'
import { resourceCategoryCounts } from '../../lib/resources/resourceFactory'
import { ResourceFilters } from './ResourceFilters'
import { ResourceGrid } from './ResourceGrid'
import { ResourcePreview } from './ResourcePreview'

export function ResourceCatalog({
  resources,
  searchPlaceholder,
  insertTabLabel,
  emptyLabel,
  gridCols = 3,
  enableGrouping = false,
}: {
  resources: GraphicResource[]
  searchPlaceholder?: string
  /** Onglet de la bibliothèque de blocs pour l'insertion (rappel). */
  insertTabLabel?: string
  emptyLabel?: string
  gridCols?: 2 | 3
  /**
   * Propose une bascule « par type » regroupant les vignettes par famille
   * (Hachures / Symboles / Détails…). N'apparaît que si les ressources
   * couvrent plusieurs types. Désactivé par défaut : les onglets mono-type
   * (Hachures/Symboles/Détails) conservent leur affichage à plat.
   */
  enableGrouping?: boolean
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [grouped, setGrouped] = useState(false)
  const [selected, setSelected] = useState<GraphicResource | null>(null)

  // Catégories + comptes calculés sur le résultat texte (avant filtre catégorie)
  // pour que chaque badge reflète ce qui correspond à la recherche en cours.
  const textMatched = useMemo(() => searchResources(resources, search), [resources, search])
  const categories = useMemo(() => resourceCategoryCounts(textMatched), [textMatched])
  const visible = useMemo(() => searchResources(resources, search, category), [resources, search, category])

  // La bascule n'a de sens que si plusieurs types coexistent dans la sélection.
  const typeCount = useMemo(() => groupResourcesByType(visible).length, [visible])
  const canGroup = enableGrouping && typeCount > 1

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
      <div>
        <ResourceFilters
          search={search}
          onSearch={setSearch}
          category={category}
          onCategory={setCategory}
          categories={categories}
          placeholder={searchPlaceholder}
        />
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] text-forma-muted">
            {visible.length} ressource{visible.length > 1 ? 's' : ''}
            {visible.length !== resources.length ? ` sur ${resources.length}` : ''}
          </p>
          {canGroup && (
            <button
              type="button"
              onClick={() => setGrouped((g) => !g)}
              aria-pressed={grouped}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${grouped ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted hover:text-forma-text'}`}
            >
              {grouped ? 'Vue à plat' : 'Grouper par type'}
            </button>
          )}
        </div>
        <ResourceGrid
          resources={visible}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          cols={gridCols}
          emptyLabel={emptyLabel}
          grouped={canGroup && grouped}
        />
      </div>
      <div>
        <ResourcePreview resource={selected} insertTabLabel={insertTabLabel} />
      </div>
    </div>
  )
}
