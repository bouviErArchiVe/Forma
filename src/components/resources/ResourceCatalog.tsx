/**
 * ResourceCatalog — catalogue réutilisable de ressources graphiques (Resource
 * Factory) : recherche + filtres + grille d'aperçus + panneau de détail.
 *
 * Une seule UI pour toutes les familles de ressources insérables (hachures,
 * symboles, et futures). Chaque famille fournit simplement un `GraphicResource[]`.
 */
import { useMemo, useState } from 'react'
import {
  resourceCategories,
  searchResources,
  type GraphicResource,
} from '../../lib/resources/resourceTypes'
import { ResourceFilters } from './ResourceFilters'
import { ResourceGrid } from './ResourceGrid'
import { ResourcePreview } from './ResourcePreview'

export function ResourceCatalog({
  resources,
  searchPlaceholder,
  insertTabLabel,
  emptyLabel,
  gridCols = 3,
}: {
  resources: GraphicResource[]
  searchPlaceholder?: string
  /** Onglet de la bibliothèque de blocs pour l'insertion (rappel). */
  insertTabLabel?: string
  emptyLabel?: string
  gridCols?: 2 | 3
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [selected, setSelected] = useState<GraphicResource | null>(null)

  const categories = useMemo(() => resourceCategories(resources), [resources])
  const visible = useMemo(() => searchResources(resources, search, category), [resources, search, category])

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
        <ResourceGrid
          resources={visible}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          cols={gridCols}
          emptyLabel={emptyLabel}
        />
      </div>
      <div>
        <ResourcePreview resource={selected} insertTabLabel={insertTabLabel} />
      </div>
    </div>
  )
}
