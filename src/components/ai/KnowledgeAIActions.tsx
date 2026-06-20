/**
 * KnowledgeAIActions — surface FormAI ANCRÉE sur une (ou deux) fiche(s) de
 * connaissance (`KnowledgeEntry`).
 *
 * Actions locales-first (aucune clé API requise pour ouvrir/utiliser) :
 *   • Expliquer la fiche
 *   • Résumer la fiche
 *   • Quiz de révision depuis la fiche
 *   • Comparer deux fiches (nécessite une seconde fiche)
 *
 * Garanties (voir src/lib/ai/knowledge-actions.ts) :
 *   • Réponse fondée « uniquement à partir de la/les fiche(s) fournie(s) ».
 *   • Source + niveau de confiance de chaque fiche TOUJOURS affichés (avant et
 *     après la réponse, via le disclaimer).
 *   • Lecture seule : aucune écriture DB, aucune modification de la base de
 *     connaissance (importée en lecture seule depuis `src/lib/knowledge`).
 *
 * Réutilise la même plomberie provider que PageAIActions
 * (getProvider / resolveProviderSettings) pour l'affichage local/cloud honnête.
 */
import { useState } from 'react'
import { Icon } from '../ui/Icon'
import {
  KNOWLEDGE_AI_DISCLAIMER,
  confidenceLabel,
  requiresTwoEntries,
  runKnowledgeAction,
  type KnowledgeActionKind,
  type KnowledgeActionResult,
} from '../../lib/ai/knowledge-actions'
import type { KnowledgeEntry } from '../../lib/knowledge'
import { getProvider, resolveProviderSettings } from '../../services/ai/providers'
import { useToastStore } from '../../stores/toastStore'

export interface KnowledgeAIActionsProps {
  /** Fiche principale ciblée par les actions. */
  entry: KnowledgeEntry
  /**
   * Seconde fiche, requise pour l'action « comparer ». Quand absente, le bouton
   * « Comparer » est désactivé (avec une note explicite).
   */
  compareWith?: KnowledgeEntry
  className?: string
}

/** Libellé court d'une action (titre du bloc résultat). */
const RESULT_LABEL: Record<KnowledgeActionKind, string> = {
  explain: 'Explication',
  summarize: 'Résumé',
  quiz: 'Quiz de révision',
  compare: 'Comparaison',
}

/** Petite ligne sourcée affichée sous chaque fiche utilisée. */
function EntrySource({ entry }: { entry: KnowledgeEntry }) {
  return (
    <p className="text-[10px] text-forma-muted leading-snug">
      <span className="font-medium text-forma-text">{entry.term}</span>
      {' — '}
      <span>Source : {entry.source}</span>
      {' · '}
      <span>Confiance : {confidenceLabel(entry)}</span>
    </p>
  )
}

export function KnowledgeAIActions({
  entry,
  compareWith,
  className = '',
}: KnowledgeAIActionsProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<KnowledgeActionResult | null>(null)
  const [resultKind, setResultKind] = useState<KnowledgeActionKind>('explain')

  // Provider actif (affichage local / cloud honnête).
  const settings = resolveProviderSettings()
  const providerLabel = getProvider(settings.providerId).label
  const fromCloud =
    settings.providerId !== 'local'
    && settings.providerId !== 'mock'
    && settings.providerId !== 'ollama'

  const canCompare = compareWith !== undefined

  const run = async (kind: KnowledgeActionKind) => {
    const entries: KnowledgeEntry[] = requiresTwoEntries(kind) && compareWith
      ? [entry, compareWith]
      : [entry]
    setLoading(true)
    setResultKind(kind)
    setResult(null)
    try {
      const res = await runKnowledgeAction({ kind, entries })
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => setResult(null)

  return (
    <div
      className={
        className
        || 'bg-forma-surface border border-forma-border rounded-xl p-3 w-full max-w-sm'
      }
    >
      {/* En-tête */}
      <div className="flex items-center gap-1.5 mb-2">
        <Icon name="sparkles" className="w-4 h-4 text-forma-accent" />
        <h3 className="text-sm font-semibold text-forma-text">FormAI · Fiche</h3>
        <span className="flex-1" />
        <span
          className="text-[10px] text-forma-muted inline-flex items-center gap-1"
          title={fromCloud ? 'Réponses envoyées au fournisseur cloud configuré' : 'Analyse locale, sans cloud'}
        >
          <Icon name={fromCloud ? 'cloud' : 'monitor'} className="w-3 h-3" />
          {providerLabel}
        </span>
      </div>

      {/* Fiche(s) sourcée(s) : source + confiance toujours visibles */}
      <div className="mb-2 space-y-1 rounded-lg border border-forma-border bg-forma-bg px-2.5 py-2">
        <EntrySource entry={entry} />
        {compareWith && <EntrySource entry={compareWith} />}
      </div>

      {/* Boutons d'action */}
      <div className="grid grid-cols-1 gap-1.5">
        <button
          type="button"
          onClick={() => void run('explain')}
          disabled={loading}
          className="text-left text-xs px-3 py-2 rounded-lg border border-forma-border hover:border-forma-accent/60 hover:bg-forma-accent/5 text-forma-text disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          <Icon name="help" className="w-3.5 h-3.5 text-forma-accent" />
          Expliquer la fiche
        </button>
        <button
          type="button"
          onClick={() => void run('summarize')}
          disabled={loading}
          className="text-left text-xs px-3 py-2 rounded-lg border border-forma-border hover:border-forma-accent/60 hover:bg-forma-accent/5 text-forma-text disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          <Icon name="file-text" className="w-3.5 h-3.5 text-forma-accent" />
          Résumer la fiche
        </button>
        <button
          type="button"
          onClick={() => void run('quiz')}
          disabled={loading}
          className="text-left text-xs px-3 py-2 rounded-lg border border-forma-border hover:border-forma-accent/60 hover:bg-forma-accent/5 text-forma-text disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          <Icon name="check" className="w-3.5 h-3.5 text-forma-accent" />
          Quiz de révision
        </button>
        <button
          type="button"
          onClick={() => void run('compare')}
          disabled={loading || !canCompare}
          title={canCompare ? undefined : 'Sélectionnez une seconde fiche pour comparer'}
          className="text-left text-xs px-3 py-2 rounded-lg border border-forma-border hover:border-forma-accent/60 hover:bg-forma-accent/5 text-forma-text disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          <Icon name="layout" className="w-3.5 h-3.5 text-forma-accent" />
          {canCompare ? `Comparer avec « ${compareWith.term} »` : 'Comparer (2 fiches requises)'}
        </button>
      </div>

      {/* Indicateur de chargement */}
      {loading && (
        <div className="flex items-center gap-1 text-forma-muted text-xs px-1 py-3">
          <span className="animate-pulse">●</span>
          <span className="animate-pulse" style={{ animationDelay: '200ms' }}>●</span>
          <span className="animate-pulse" style={{ animationDelay: '400ms' }}>●</span>
          <span className="ml-1">Analyse en cours…</span>
        </div>
      )}

      {/* Résultat */}
      {result && !loading && (
        <div className="mt-3 space-y-2">
          <div className="text-[10px] text-forma-muted uppercase tracking-wide">
            {RESULT_LABEL[resultKind]}
          </div>
          <div className="text-xs text-forma-text whitespace-pre-wrap break-words leading-relaxed max-h-72 overflow-y-auto rounded-lg border border-forma-border bg-forma-bg p-2.5">
            {result.text}
          </div>
          {/* Rappel source + confiance des fiches utilisées */}
          {result.entries.length > 0 && (
            <div className="space-y-0.5">
              {result.entries.map((e) => (
                <EntrySource key={e.id} entry={e} />
              ))}
            </div>
          )}
          {result.error && (
            <p className="text-[10px] text-amber-500 inline-flex items-center gap-1">
              <Icon name="alert" className="w-3 h-3" />
              {result.error}
            </p>
          )}
          <p className="text-[10px] text-forma-muted leading-snug inline-flex items-start gap-1">
            <Icon name="alert" className="w-3 h-3 mt-px shrink-0" />
            {KNOWLEDGE_AI_DISCLAIMER}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(result.text)
                useToastStore.getState().show('Copié')
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-forma-border text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1"
            >
              <Icon name="copy" className="w-3 h-3" />
              Copier
            </button>
            <button
              type="button"
              onClick={reset}
              className="text-[11px] px-2.5 py-1 rounded-lg border border-forma-border text-forma-muted hover:text-forma-text transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
