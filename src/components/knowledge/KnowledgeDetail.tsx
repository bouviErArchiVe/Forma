/**
 * KnowledgeDetail — fiche détaillée (lecture seule) d'une `KnowledgeEntry`.
 *
 * Affiche l'intégralité d'une entrée : terme, type, domaine/sous-domaine,
 * définition longue, exemples, synonymes, termes liés, tags et TOUTES les
 * sources (label + note + url) avec le badge de confiance — TOUJOURS visible
 * (badge explicite « À vérifier »). Aucune définition fabriquée.
 *
 * Interactions sans clic mort :
 *  - synonymes / termes liés → `onOpenTerm(raw)` (l'appelant résout vers une
 *    entrée existante, sinon bascule en recherche).
 *  - exemples → `onPrefillSearch(text)` (pré-remplit la recherche).
 */
import {
  entryDefinition,
  type KnowledgeEntry,
} from '../../lib/knowledge'
import { Icon } from '../ui/Icon'
import { KnowledgeConfidenceBadge, KnowledgeTypeBadge } from './KnowledgeEntryCard'

export interface KnowledgeDetailProps {
  entry: KnowledgeEntry
  favorite: boolean
  onToggleFavorite: (slug: string) => void
  /** Ouvre un terme (synonyme / terme lié) : résolu vers une entrée ou recherche. */
  onOpenTerm: (raw: string) => void
  /** Pré-remplit la recherche avec le texte d'un exemple. */
  onPrefillSearch: (text: string) => void
  onBack: () => void
}

export function KnowledgeDetail({
  entry,
  favorite,
  onToggleFavorite,
  onOpenTerm,
  onPrefillSearch,
  onBack,
}: KnowledgeDetailProps) {
  return (
    <article className="rounded-2xl border border-forma-border bg-forma-surface p-5 sm:p-6">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-forma-accent hover:text-forma-accent-hover inline-flex items-center gap-1 mb-4"
      >
        <Icon name="chevron-left" className="w-3.5 h-3.5" />
        Parcourir le dictionnaire
      </button>

      <header className="flex items-start justify-between gap-3 mb-2">
        <h1 className="text-xl font-semibold text-forma-text capitalize">{entry.term}</h1>
        <div className="flex items-center gap-2 shrink-0">
          <KnowledgeConfidenceBadge confidence={entry.confidence} />
          <button
            type="button"
            onClick={() => onToggleFavorite(entry.slug)}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
              favorite ? 'text-amber-500 hover:text-amber-600' : 'text-forma-muted hover:text-forma-text'
            }`}
            title={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={favorite}
          >
            <Icon name={favorite ? 'star' : 'star-outline'} className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <KnowledgeTypeBadge type={entry.type} />
        <span className="text-[11px] uppercase tracking-wide text-forma-accent">
          {entry.domain}
          {entry.subdomain ? ` · ${entry.subdomain}` : ''}
        </span>
      </div>

      <p className="text-sm text-forma-text leading-relaxed whitespace-pre-line">
        {entryDefinition(entry)}
      </p>

      {entry.examples && entry.examples.length > 0 && (
        <Section title="Exemples">
          <ul className="space-y-1.5">
            {entry.examples.map((ex, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onPrefillSearch(ex)}
                  className="text-sm text-left text-forma-muted hover:text-forma-text transition-colors flex gap-2"
                  title="Explorer dans la recherche"
                >
                  <span className="text-forma-accent shrink-0">·</span>
                  <span>{ex}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {entry.synonyms && entry.synonyms.length > 0 && (
        <Section title="Synonymes">
          <TermChips terms={entry.synonyms} onOpen={onOpenTerm} />
        </Section>
      )}

      {entry.relatedTerms && entry.relatedTerms.length > 0 && (
        <Section title="Termes liés">
          <TermChips terms={entry.relatedTerms} onOpen={onOpenTerm} />
        </Section>
      )}

      {entry.tags && entry.tags.length > 0 && (
        <Section title="Tags">
          <ul className="flex flex-wrap gap-1.5">
            {entry.tags.map((tag) => (
              <li
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-md bg-forma-bg border border-forma-border text-forma-muted"
              >
                {tag}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Sources — TOUJOURS présentes (politique anti-hallucination). */}
      <Section title={entry.sources.length > 1 ? 'Sources' : 'Source'}>
        <ul className="space-y-2">
          {entry.sources.map((src, i) => (
            <li key={i} className="text-xs text-forma-muted">
              <span className="font-medium text-forma-text">{src.label}</span>
              {src.url && (
                <>
                  {' · '}
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-forma-accent underline break-all"
                  >
                    {src.url}
                  </a>
                </>
              )}
              {src.note && <span className="block opacity-80 mt-0.5">{src.note}</span>}
            </li>
          ))}
        </ul>
      </Section>
    </article>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4 border-t border-forma-border">
      <h2 className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-2">{title}</h2>
      {children}
    </div>
  )
}

function TermChips({ terms, onOpen }: { terms: string[]; onOpen: (raw: string) => void }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {terms.map((t) => (
        <li key={t}>
          <button
            type="button"
            onClick={() => onOpen(t)}
            className="text-xs px-2 py-1 rounded-md border border-forma-border text-forma-muted hover:border-forma-accent/50 hover:text-forma-text transition-colors"
          >
            {t}
          </button>
        </li>
      ))}
    </ul>
  )
}
