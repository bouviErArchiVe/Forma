/**
 * KnowledgeFilters — barre de filtres + tri du dictionnaire.
 *
 * Combinable : type (13), domaine (dérivé de la base), confiance (3). Plus un
 * sélecteur de tri et des « vues rapides » Favoris / Récents. Affiche des puces
 * de filtres actifs avec retrait individuel et bouton de réinitialisation.
 *
 * Purement contrôlé : tout l'état vit dans la page ; ce composant ne fait que
 * rendre des <select>/boutons et remonter les changements.
 */
import {
  DICTIONARY_SORT_LABEL,
  KNOWLEDGE_TYPE_LABEL,
  isFilterEmpty,
  type DictionaryFilter,
  type DictionarySort,
} from '../../lib/dictionary-filters'
import {
  KNOWLEDGE_CONFIDENCE_LABEL,
  KNOWLEDGE_CONFIDENCE_LEVELS,
  type KnowledgeConfidence,
  type KnowledgeEntryType,
} from '../../lib/knowledge'
import { Icon } from '../ui/Icon'

export interface KnowledgeFiltersProps {
  filter: DictionaryFilter
  onFilterChange: (next: DictionaryFilter) => void
  sort: DictionarySort
  onSortChange: (sort: DictionarySort) => void
  /** Domaines distincts de la base. */
  domains: string[]
  /** Types réellement présents dans la base. */
  types: KnowledgeEntryType[]
  /** Critères de tri proposés (relevance n'apparaît qu'en mode recherche). */
  sorts: DictionarySort[]
  favoritesCount: number
  recentsCount: number
}

const SELECT_CLASS =
  'text-xs rounded-lg border border-forma-border bg-forma-surface px-2 py-1.5 text-forma-text outline-none focus:border-forma-accent/60 transition-colors'

export function KnowledgeFilters({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  domains,
  types,
  sorts,
  favoritesCount,
  recentsCount,
}: KnowledgeFiltersProps) {
  const patch = (p: Partial<DictionaryFilter>) => onFilterChange({ ...filter, ...p })

  const quick = (key: 'favoritesOnly' | 'recentsOnly') => {
    // Les vues rapides s'excluent mutuellement.
    if (filter[key]) {
      onFilterChange({ ...filter, favoritesOnly: false, recentsOnly: false })
    } else {
      onFilterChange({
        ...filter,
        favoritesOnly: key === 'favoritesOnly',
        recentsOnly: key === 'recentsOnly',
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Vues rapides */}
        <button
          type="button"
          onClick={() => quick('favoritesOnly')}
          className={`inline-flex items-center gap-1 text-xs rounded-lg border px-2 py-1.5 transition-colors ${
            filter.favoritesOnly
              ? 'border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'border-forma-border bg-forma-surface text-forma-muted hover:text-forma-text'
          }`}
        >
          <Icon name={filter.favoritesOnly ? 'star' : 'star-outline'} className="w-3.5 h-3.5" />
          Favoris{favoritesCount > 0 ? ` (${favoritesCount})` : ''}
        </button>
        <button
          type="button"
          onClick={() => quick('recentsOnly')}
          className={`inline-flex items-center gap-1 text-xs rounded-lg border px-2 py-1.5 transition-colors ${
            filter.recentsOnly
              ? 'border-forma-accent/60 bg-forma-accent/10 text-forma-accent'
              : 'border-forma-border bg-forma-surface text-forma-muted hover:text-forma-text'
          }`}
        >
          <Icon name="undo" className="w-3.5 h-3.5" />
          Récents{recentsCount > 0 ? ` (${recentsCount})` : ''}
        </button>

        <span className="w-px h-5 bg-forma-border mx-0.5" aria-hidden="true" />

        {/* Type */}
        <select
          className={SELECT_CLASS}
          value={filter.type ?? ''}
          onChange={(e) => patch({ type: (e.target.value || undefined) as KnowledgeEntryType | undefined })}
          aria-label="Filtrer par type"
        >
          <option value="">Tous les types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {KNOWLEDGE_TYPE_LABEL[t]}
            </option>
          ))}
        </select>

        {/* Domaine */}
        <select
          className={SELECT_CLASS}
          value={filter.domain ?? ''}
          onChange={(e) => patch({ domain: e.target.value || undefined })}
          aria-label="Filtrer par domaine"
        >
          <option value="">Tous les domaines</option>
          {domains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        {/* Confiance */}
        <select
          className={SELECT_CLASS}
          value={filter.confidence ?? ''}
          onChange={(e) => patch({ confidence: (e.target.value || undefined) as KnowledgeConfidence | undefined })}
          aria-label="Filtrer par confiance"
        >
          <option value="">Toute confiance</option>
          {KNOWLEDGE_CONFIDENCE_LEVELS.map((c) => (
            <option key={c} value={c}>
              {KNOWLEDGE_CONFIDENCE_LABEL[c]}
            </option>
          ))}
        </select>

        <span className="w-px h-5 bg-forma-border mx-0.5" aria-hidden="true" />

        {/* Tri */}
        <label className="inline-flex items-center gap-1 text-xs text-forma-muted">
          Trier&nbsp;:
          <select
            className={SELECT_CLASS}
            value={sort}
            onChange={(e) => onSortChange(e.target.value as DictionarySort)}
            aria-label="Trier"
          >
            {sorts.map((s) => (
              <option key={s} value={s}>
                {DICTIONARY_SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Puces de filtres actifs */}
      {!isFilterEmpty(filter) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filter.favoritesOnly && (
            <ActiveChip label="Favoris" onClear={() => patch({ favoritesOnly: false })} />
          )}
          {filter.recentsOnly && (
            <ActiveChip label="Récents" onClear={() => patch({ recentsOnly: false })} />
          )}
          {filter.type && (
            <ActiveChip
              label={`Type : ${KNOWLEDGE_TYPE_LABEL[filter.type]}`}
              onClear={() => patch({ type: undefined })}
            />
          )}
          {filter.domain && (
            <ActiveChip label={`Domaine : ${filter.domain}`} onClear={() => patch({ domain: undefined })} />
          )}
          {filter.confidence && (
            <ActiveChip
              label={`Confiance : ${KNOWLEDGE_CONFIDENCE_LABEL[filter.confidence]}`}
              onClear={() => patch({ confidence: undefined })}
            />
          )}
          <button
            type="button"
            onClick={() =>
              onFilterChange({})
            }
            className="text-xs text-forma-accent underline ml-1 hover:text-forma-accent-hover"
          >
            Tout réinitialiser
          </button>
        </div>
      )}
    </div>
  )
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] rounded-full border border-forma-accent/40 bg-forma-accent/10 text-forma-accent pl-2 pr-1 py-0.5">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-forma-accent/20"
        aria-label={`Retirer le filtre ${label}`}
      >
        <Icon name="close" className="w-3 h-3" />
      </button>
    </span>
  )
}
