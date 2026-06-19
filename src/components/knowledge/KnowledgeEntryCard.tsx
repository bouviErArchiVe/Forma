/**
 * KnowledgeEntryCard — affichage en lecture seule d'une `KnowledgeEntry`.
 *
 * Présente terme, définition, domaine/tags et — de façon **toujours visible** —
 * la `source` et le niveau de `confidence`. Composant purement présentationnel,
 * réutilisable par Study (C) et FormAI (D). Aucune logique réseau ni IA.
 */
import {
  KNOWLEDGE_CONFIDENCE_LABEL,
  type KnowledgeConfidence,
  type KnowledgeEntry,
} from '../../lib/knowledge'

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

export function KnowledgeEntryCard({ entry, className }: KnowledgeEntryCardProps) {
  return (
    <article
      className={`rounded-xl border border-forma-border bg-forma-surface p-4 ${className ?? ''}`}
    >
      <header className="flex items-start justify-between gap-2 mb-1">
        <h3 className="text-base font-semibold text-forma-text capitalize">{entry.term}</h3>
        <KnowledgeConfidenceBadge confidence={entry.confidence} />
      </header>
      <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-2">{entry.domain}</p>
      <p className="text-sm text-forma-text leading-relaxed">{entry.definition}</p>

      {entry.tags && entry.tags.length > 0 && (
        <ul className="flex flex-wrap gap-1 mt-3">
          {entry.tags.map((tag) => (
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
        {entry.source}
      </p>
    </article>
  )
}
