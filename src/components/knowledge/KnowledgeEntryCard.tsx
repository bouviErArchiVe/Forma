/**
 * KnowledgeEntryCard — affichage en lecture seule d'une `KnowledgeEntry`.
 *
 * Présente terme, type, définition, domaine/tags et — de façon **toujours
 * visible** — la `source` et le niveau de `confidence`. Composant purement
 * présentationnel, réutilisable par Study (C) et FormAI (D). Aucune logique
 * réseau ni IA.
 *
 * Une étoile de favori optionnelle peut être branchée via `favorite` +
 * `onToggleFavorite` (l'état/persistance reste à la charge de l'appelant).
 */
import {
  entryDefinition,
  entrySourceLabel,
  KNOWLEDGE_CONFIDENCE_LABEL,
  type KnowledgeConfidence,
  type KnowledgeEntry,
} from '../../lib/knowledge'
import { KNOWLEDGE_TYPE_LABEL } from '../../lib/dictionary-filters'
import { Icon } from '../ui/Icon'

/** Classes de badge par niveau de confiance (thème Forma + dark). */
const CONFIDENCE_BADGE: Record<KnowledgeConfidence, string> = {
  indicatif:
    'bg-forma-accent/10 text-forma-accent border-forma-accent/30',
  concept:
    'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
  'à-vérifier':
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40',
}

export interface KnowledgeEntryCardProps {
  entry: KnowledgeEntry
  className?: string
  /** État favori (contrôlé par l'appelant). Si omis, pas d'étoile. */
  favorite?: boolean
  /** Bascule le favori. Stoppe la propagation pour ne pas ouvrir la fiche. */
  onToggleFavorite?: (slug: string) => void
}

export function KnowledgeConfidenceBadge({ confidence }: { confidence: KnowledgeConfidence }) {
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-semibold uppercase tracking-wide ${CONFIDENCE_BADGE[confidence]}`}
    >
      {KNOWLEDGE_CONFIDENCE_LABEL[confidence]}
    </span>
  )
}

/** Petit badge de type d'entrée (Mot, Matériau, Norme…). */
export function KnowledgeTypeBadge({ type }: { type: KnowledgeEntry['type'] }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md border border-forma-border bg-forma-bg text-[10px] font-medium text-forma-muted">
      {KNOWLEDGE_TYPE_LABEL[type] ?? type}
    </span>
  )
}

export function KnowledgeEntryCard({
  entry,
  className,
  favorite,
  onToggleFavorite,
}: KnowledgeEntryCardProps) {
  const showStar = onToggleFavorite !== undefined
  return (
    <article
      className={`relative rounded-xl border border-forma-border bg-forma-surface p-4 ${className ?? ''}`}
    >
      <header className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-base font-semibold text-forma-text capitalize pr-1">{entry.term}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <KnowledgeConfidenceBadge confidence={entry.confidence} />
          {showStar && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onToggleFavorite(entry.slug)
              }}
              className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                favorite
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-forma-muted hover:text-forma-text'
              }`}
              title={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              aria-pressed={favorite ?? false}
            >
              <Icon name={favorite ? 'star' : 'star-outline'} className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <KnowledgeTypeBadge type={entry.type} />
        <span className="text-[10px] uppercase tracking-wide text-forma-accent">{entry.domain}</span>
      </div>
      <p className="text-sm text-forma-text leading-relaxed line-clamp-4">{entryDefinition(entry)}</p>

      {entry.tags && entry.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1 mt-3">
          {entry.tags.slice(0, 6).map((tag) => (
            <li
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded-md bg-forma-bg border border-forma-border text-forma-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-forma-muted mt-3 pt-2 border-t border-forma-border">
        <span className="font-medium text-forma-text">Source : </span>
        {entrySourceLabel(entry)}
      </p>
    </article>
  )
}
