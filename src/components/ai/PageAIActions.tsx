/**
 * PageAIActions — surface FormAI contextuelle pour une page / un document.
 *
 * Actions locales-first (aucune clé API requise pour ouvrir/utiliser) :
 *   • Expliquer cette page
 *   • Expliquer la sélection (si un extrait est fourni — sinon repli page)
 *   • Résumer le contenu (page ou document)
 *   • Créer une tâche depuis une note (confirmation OBLIGATOIRE avant création)
 *
 * Lecture seule des données (Dexie) — n'écrit jamais sur le canvas. La logique
 * vit dans src/lib/ai/canvas-actions.ts ; ce composant orchestre l'UI.
 *
 * Réutilisable : menu de la liseuse, panneau latéral d'un document, etc.
 *
 * Note « sélection » : `getSelectionText` est une prop OPTIONNELLE fournie par
 * l'appelant (futur accesseur read-only de Lane B). Tant qu'elle n'est pas
 * passée, l'action « expliquer la sélection » retombe proprement sur la page
 * entière (voir contrat documenté dans canvas-actions.ts).
 */
import { useState } from 'react'
import { Icon, type IconName } from '../ui/Icon'
import {
  AI_DISCLAIMER,
  runDocumentAction,
  runPageAction,
  runSelectionAction,
  suggestTaskFromText,
  type CanvasActionKind,
  type CanvasActionResult,
} from '../../lib/ai/canvas-actions'
import {
  DEFAULT_PAGE_AGENT_ID,
  NORMATIVE_DISCLAIMER,
  PAGE_AGENTS,
  getPageAgent,
  isNormativeAgent,
  type PageAgentId,
} from '../../lib/ai/agents'
import { createTask } from '../../services/tasks'
import type { TaskSuggestion } from '../../lib/study-generators'
import { getProvider, resolveProviderSettings } from '../../services/ai/providers'
import { useToastStore } from '../../stores/toastStore'

export interface PageAIActionsProps {
  /** Page ciblée (mode page unique). Requis sauf si `scope` = 'document'. */
  pageId?: string
  /** Carnet ciblé (mode document complet). Requis si `scope` = 'document'. */
  notebookId?: string
  /** Titre affiché et injecté dans le prompt (nom du carnet / page). */
  title: string
  /** 'page' (défaut) analyse une page ; 'document' agrège toutes les pages. */
  scope?: 'page' | 'document'
  /**
   * Accesseur read-only OPTIONNEL du texte sélectionné sur le canvas (fourni
   * par l'appelant ; futur accesseur de Lane B). Lu au clic, jamais conservé.
   * Doit être pur/synchrone et NE rien modifier. Quand absent ou renvoyant une
   * chaîne vide, « expliquer la sélection » retombe sur la page entière.
   */
  getSelectionText?: () => string | undefined
  /** Liens optionnels propagés à la tâche créée. */
  taskDefaults?: { subjectId?: string; projectId?: string; documentId?: string }
  /**
   * Agent spécialisé initial appliqué aux actions (défaut `generic`). Un
   * sélecteur permet d'en changer ; `generic` laisse le comportement inchangé.
   */
  agentId?: PageAgentId
  className?: string
}

type Mode = 'idle' | 'result' | 'task'

export function PageAIActions({
  pageId,
  notebookId,
  title,
  scope = 'page',
  getSelectionText,
  taskDefaults = {},
  agentId: initialAgentId = DEFAULT_PAGE_AGENT_ID,
  className = '',
}: PageAIActionsProps) {
  const [mode, setMode] = useState<Mode>('idle')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CanvasActionResult | null>(null)
  const [resultKind, setResultKind] = useState<CanvasActionKind>('explain')

  // Agent spécialisé actif (preset de prompt système). `generic` = défaut.
  const [agentId, setAgentId] = useState<PageAgentId>(initialAgentId)
  const agent = getPageAgent(agentId)

  // Tâche depuis note
  const [note, setNote] = useState('')
  const [suggestion, setSuggestion] = useState<TaskSuggestion | null>(null)

  // Provider actif (affichage local / cloud honnête)
  const settings = resolveProviderSettings()
  const providerLabel = getProvider(settings.providerId).label
  const fromCloud =
    settings.providerId !== 'local'
    && settings.providerId !== 'mock'
    && settings.providerId !== 'ollama'

  const run = async (kind: CanvasActionKind) => {
    setLoading(true)
    setResultKind(kind)
    setMode('result')
    setResult(null)
    try {
      let res: CanvasActionResult | undefined
      if (kind === 'explain-selection' && pageId) {
        // Lecture de la sélection au clic (jamais conservée). Fallback page
        // entière géré par runSelectionAction si la sélection est vide/absente.
        const selectionText = getSelectionText?.()
        res = await runSelectionAction(pageId, title, {
          ...(selectionText ? { selectionText } : {}),
          agentId,
        })
      } else if (scope === 'document' && notebookId) {
        res = await runDocumentAction(notebookId, kind, title, { agentId })
      } else if (pageId) {
        res = await runPageAction(pageId, kind, title, { agentId })
      }
      if (!res) {
        useToastStore.getState().show('Page introuvable')
        setMode('idle')
        return
      }
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  const analyzeNote = () => {
    const s = suggestTaskFromText(note)
    if (!s) {
      useToastStore.getState().show('Écrivez une note (ex. « remettre le rapport lundi »)')
      return
    }
    setSuggestion(s)
  }

  const confirmCreateTask = async () => {
    if (!suggestion) return
    await createTask({
      title: suggestion.title,
      priority: suggestion.priority,
      ...(suggestion.dueDate ? { dueDate: suggestion.dueDate } : {}),
      ...taskDefaults,
    })
    useToastStore.getState().show('Tâche créée')
    setNote('')
    setSuggestion(null)
    setMode('idle')
  }

  const reset = () => {
    setMode('idle')
    setResult(null)
    setNote('')
    setSuggestion(null)
  }

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
        <h3 className="text-sm font-semibold text-forma-text">FormAI</h3>
        <span className="flex-1" />
        <span
          className="text-[10px] text-forma-muted inline-flex items-center gap-1"
          title={fromCloud ? 'Réponses envoyées au fournisseur cloud configuré' : 'Analyse locale, sans cloud'}
        >
          <Icon name={fromCloud ? 'cloud' : 'monitor'} className="w-3 h-3" />
          {providerLabel}
        </span>
      </div>

      {/* Sélecteur d'agent spécialisé (défaut : Général) */}
      <div className="mb-2">
        <label className="sr-only" htmlFor="formai-agent">Agent FormAI</label>
        <div className="relative">
          <Icon
            name={agent.icon as IconName}
            className="w-3.5 h-3.5 text-forma-accent absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <select
            id="formai-agent"
            value={agentId}
            disabled={loading}
            onChange={(e) => setAgentId(e.target.value as PageAgentId)}
            title={agent.description}
            className="w-full text-xs pl-7 pr-2 py-1.5 rounded-lg border border-forma-border bg-forma-bg text-forma-text disabled:opacity-40 focus:outline-none focus:border-forma-accent"
          >
            {PAGE_AGENTS.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        {isNormativeAgent(agentId) && (
          <p className="mt-1 text-[10px] text-amber-500 leading-snug inline-flex items-start gap-1">
            <Icon name="alert" className="w-3 h-3 mt-px shrink-0" />
            {NORMATIVE_DISCLAIMER}
          </p>
        )}
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
          {scope === 'document' ? 'Expliquer ce document' : 'Expliquer cette page'}
        </button>
        {scope !== 'document' && pageId && (
          <button
            type="button"
            onClick={() => void run('explain-selection')}
            disabled={loading}
            className="text-left text-xs px-3 py-2 rounded-lg border border-forma-border hover:border-forma-accent/60 hover:bg-forma-accent/5 text-forma-text disabled:opacity-40 transition-colors inline-flex items-center gap-2"
          >
            <Icon name="help" className="w-3.5 h-3.5 text-forma-accent" />
            Expliquer la sélection
          </button>
        )}
        <button
          type="button"
          onClick={() => void run('summarize')}
          disabled={loading}
          className="text-left text-xs px-3 py-2 rounded-lg border border-forma-border hover:border-forma-accent/60 hover:bg-forma-accent/5 text-forma-text disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          <Icon name="file-text" className="w-3.5 h-3.5 text-forma-accent" />
          Résumer le contenu
        </button>
        <button
          type="button"
          onClick={() => { setMode('task'); setSuggestion(null) }}
          disabled={loading}
          className="text-left text-xs px-3 py-2 rounded-lg border border-forma-border hover:border-forma-accent/60 hover:bg-forma-accent/5 text-forma-text disabled:opacity-40 transition-colors inline-flex items-center gap-2"
        >
          <Icon name="check" className="w-3.5 h-3.5 text-forma-accent" />
          Créer une tâche depuis une note
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

      {/* Résultat explication / résumé */}
      {mode === 'result' && result && !loading && (
        <div className="mt-3 space-y-2">
          <div className="text-[10px] text-forma-muted uppercase tracking-wide">
            {resultKind === 'summarize'
              ? 'Résumé'
              : resultKind === 'explain-selection'
                ? 'Explication de la sélection'
                : 'Explication'}
          </div>
          <div className="text-xs text-forma-text whitespace-pre-wrap break-words leading-relaxed max-h-72 overflow-y-auto rounded-lg border border-forma-border bg-forma-bg p-2.5">
            {result.text}
          </div>
          {result.note && <p className="text-[10px] text-amber-500">{result.note}</p>}
          {result.error && (
            <p className="text-[10px] text-amber-500 inline-flex items-center gap-1">
              <Icon name="alert" className="w-3 h-3" />
              {result.error}
            </p>
          )}
          {!result.empty && (
            <p className="text-[10px] text-forma-muted leading-snug inline-flex items-start gap-1">
              <Icon name="alert" className="w-3 h-3 mt-px shrink-0" />
              {AI_DISCLAIMER}
            </p>
          )}
          {!result.empty && isNormativeAgent(agentId) && (
            <p className="text-[10px] text-amber-500 leading-snug inline-flex items-start gap-1">
              <Icon name="alert" className="w-3 h-3 mt-px shrink-0" />
              {NORMATIVE_DISCLAIMER}
            </p>
          )}
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

      {/* Tâche depuis une note (confirmation obligatoire) */}
      {mode === 'task' && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-forma-muted">
            Décrivez l’action ; la date et la priorité sont détectées. Vous confirmez avant création.
          </p>
          <textarea
            value={note}
            autoFocus
            onChange={(e) => { setNote(e.target.value); setSuggestion(null) }}
            rows={2}
            placeholder="Ex. : remettre le rapport lundi"
            className="w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg resize-none focus:outline-none focus:border-forma-accent"
          />
          {suggestion && (
            <div className="p-2.5 rounded-lg border border-forma-accent/30 bg-forma-accent/5 text-xs space-y-0.5">
              <p className="text-forma-text"><span className="text-forma-muted">Titre :</span> {suggestion.title}</p>
              <p className="text-forma-text"><span className="text-forma-muted">Échéance :</span> {suggestion.dueDate ?? '—'}</p>
              <p className="text-forma-text">
                <span className="text-forma-muted">Priorité :</span>{' '}
                {suggestion.priority === 'high' ? 'haute' : suggestion.priority === 'low' ? 'basse' : 'moyenne'}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reset}
              className="flex-1 text-xs py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Annuler
            </button>
            {suggestion ? (
              <button
                type="button"
                onClick={() => void confirmCreateTask()}
                className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors"
              >
                Créer la tâche
              </button>
            ) : (
              <button
                type="button"
                onClick={analyzeNote}
                disabled={note.trim() === ''}
                className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors"
              >
                Analyser
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
