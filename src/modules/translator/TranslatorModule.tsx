/**
 * TranslatorModule — traduction FR ↔ EN (module V2).
 *
 * Deux zones côte à côte (source / cible), inversion du sens, trois modes
 * (Simple / Professionnel / Technique) qui changent le prompt système.
 * Mode local honnête : pas d'appel au provider extractif — encart explicatif,
 * mais historique / favoris / copie / envoi FormaDoc restent disponibles.
 */
import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { db } from '../../db'
import { getProvider, resolveProviderSettings } from '../../services/ai/providers'
import { createFormaDoc } from '../../services/library'
import { useToastStore } from '../../stores/toastStore'
import type { ModuleProps } from '../ModuleHost'
import {
  addHistoryEntry,
  buildFormaDocContent,
  buildTranslationMessages,
  MODE_LABELS,
  parseTranslatorState,
  removeHistoryEntry,
  sortHistory,
  toggleHistoryFavorite,
  type TranslationEntry,
  type TranslationLang,
  type TranslationMode,
  type TranslatorState,
} from './translator-core'

const MODES: TranslationMode[] = ['simple', 'professionnel', 'technique']

const MODE_HINTS: Record<TranslationMode, string> = {
  simple: 'Registre courant, naturel',
  professionnel: 'Registre soutenu, correspondance d’affaires',
  technique: 'Terminologie bâtiment / architecture, unités inchangées',
}

function langLabel(lang: TranslationLang): string {
  return lang === 'fr' ? 'Français' : 'Anglais'
}

export function TranslatorModule({ data, onDataChange }: ModuleProps) {
  const navigate = useNavigate()
  const toast = useToastStore((s) => s.show)

  // État persisté (historique) — source de vérité locale, persistée via onDataChange.
  const [state, setState] = useState<TranslatorState>(() => parseTranslatorState(data))

  // État de session (non persisté)
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [from, setFrom] = useState<TranslationLang>('fr')
  const [mode, setMode] = useState<TranslationMode>('simple')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Provider résolu une fois par montage — 'local' = pas de traduction IA.
  const settings = useMemo(() => resolveProviderSettings(), [])
  const isLocal = settings.providerId === 'local'
  const providerLabel = useMemo(() => getProvider(settings.providerId).label, [settings.providerId])

  const persist = (next: TranslatorState) => {
    setState(next)
    onDataChange(JSON.stringify(next))
  }

  const to: TranslationLang = from === 'fr' ? 'en' : 'fr'
  const sortedHistory = useMemo(() => sortHistory(state.history), [state.history])

  // ── Actions ─────────────────────────────────────────────────────────────────

  const swap = () => {
    setFrom(to)
    // Inversion pratique : la traduction devient la source.
    setSource(target)
    setTarget(source)
  }

  const translate = async () => {
    const text = source.trim()
    if (text === '' || loading || isLocal) return
    setLoading(true)
    setError(null)
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    try {
      const provider = getProvider(settings.providerId)
      const res = await provider.chat({
        messages: buildTranslationMessages(text, from, mode),
        settings,
        signal: abortRef.current.signal,
      })
      if (res.error) {
        setError(res.error)
        return
      }
      const dst = res.text.trim()
      setTarget(dst)
      const entry: TranslationEntry = { src: text, dst, from, mode, ts: Date.now() }
      persist({ ...state, history: addHistoryEntry(state.history, entry) })
    } finally {
      setLoading(false)
    }
  }

  const copyText = async (text: string, label: string) => {
    if (text.trim() === '') return
    await navigator.clipboard.writeText(text)
    toast(label)
  }

  const loadEntry = (entry: TranslationEntry) => {
    setSource(entry.src)
    setTarget(entry.dst)
    setFrom(entry.from)
    if (entry.mode === 'simple' || entry.mode === 'professionnel' || entry.mode === 'technique') {
      setMode(entry.mode)
    }
  }

  const sendToFormaDoc = async (entry: TranslationEntry) => {
    const title = `Traduction — ${entry.src.slice(0, 40)}${entry.src.length > 40 ? '…' : ''}`
    const doc = await createFormaDoc(title, null)
    const page = await db.pages.where('notebookId').equals(doc.id).first()
    if (page) {
      await db.pages.update(page.id, { content: buildFormaDocContent(entry) })
    }
    navigate(`/document/${doc.id}`)
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Sens + mode */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-forma-text">
            <span className="px-2.5 py-1 rounded-lg bg-forma-surface border border-forma-border">
              {langLabel(from)}
            </span>
            <button
              type="button"
              onClick={swap}
              title="Inverser le sens de traduction"
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-forma-border bg-forma-surface hover:border-forma-accent/60 hover:text-forma-accent transition-colors"
            >
              ⇄
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-forma-surface border border-forma-border">
              {langLabel(to)}
            </span>
          </div>

          <div className="flex-1" />

          <div
            className="flex items-center gap-1 bg-forma-surface border border-forma-border rounded-lg p-0.5"
            role="group"
            aria-label="Mode de traduction"
          >
            {MODES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                title={MODE_HINTS[m]}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  mode === m
                    ? 'bg-forma-accent text-white'
                    : 'text-forma-muted hover:text-forma-text'
                }`}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* Zones source / cible */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="translator-source" className="text-[11px] font-medium text-forma-muted uppercase tracking-wide">
              Source — {langLabel(from)}
            </label>
            <textarea
              id="translator-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={from === 'fr' ? 'Texte en français à traduire…' : 'English text to translate…'}
              rows={7}
              className="text-sm border border-forma-border rounded-xl px-3 py-2.5 bg-forma-surface resize-y min-h-32 focus:outline-none focus:border-forma-accent focus:ring-1 focus:ring-forma-accent/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="translator-target" className="text-[11px] font-medium text-forma-muted uppercase tracking-wide">
                Traduction — {langLabel(to)}
              </label>
              <button
                type="button"
                onClick={() => void copyText(target, 'Traduction copiée')}
                disabled={target.trim() === ''}
                title="Copier la traduction"
                className="inline-flex items-center gap-1 text-[11px] text-forma-muted hover:text-forma-accent disabled:opacity-40 transition-colors"
              >
                <Icon name="copy" className="w-3 h-3" />
                Copier
              </button>
            </div>
            <textarea
              id="translator-target"
              value={target}
              readOnly
              placeholder="La traduction apparaîtra ici…"
              rows={7}
              className="text-sm border border-forma-border rounded-xl px-3 py-2.5 bg-forma-bg text-forma-text resize-y min-h-32 focus:outline-none"
            />
          </div>
        </div>

        {/* Action traduire + état provider */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void translate()}
            disabled={isLocal || loading || source.trim() === ''}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors"
          >
            <Icon name="sparkles" className="w-4 h-4" />
            {loading ? 'Traduction…' : 'Traduire'}
          </button>
          {!isLocal && (
            <span className="text-[10px] text-forma-muted inline-flex items-center gap-1">
              <Icon name="cloud" className="w-3 h-3" />
              {providerLabel} — le texte est envoyé à ce fournisseur
            </span>
          )}
        </div>

        {/* Encart mode local */}
        {isLocal && (
          <div className="rounded-xl border border-amber-300/60 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3.5 py-3 flex items-start gap-2.5">
            <Icon name="alert" className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-forma-text leading-relaxed">
              <p className="font-medium">Mode local — traduction automatique indisponible</p>
              <p className="text-forma-muted mt-0.5">
                Le mode local est extractif et ne sait pas traduire. Configurez un fournisseur IA
                dans Paramètres › IA pour la traduction automatique. L’historique, les favoris,
                la copie et l’envoi vers FormaDoc restent disponibles.
              </p>
            </div>
          </div>
        )}

        {/* Erreur provider */}
        {error && (
          <p className="text-xs text-amber-500 inline-flex items-center gap-1">
            <Icon name="alert" className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        {/* Historique */}
        <section>
          <h2 className="text-xs font-semibold text-forma-muted uppercase tracking-wide mb-2">
            Historique ({state.history.length})
          </h2>
          {sortedHistory.length === 0 ? (
            <p className="text-xs text-forma-muted">
              Aucune traduction pour l’instant. Les traductions apparaîtront ici (50 max).
            </p>
          ) : (
            <ul className="space-y-2">
              {sortedHistory.map((entry) => (
                <li
                  key={entry.ts}
                  className="rounded-xl border border-forma-border bg-forma-surface px-3 py-2.5"
                >
                  <button
                    type="button"
                    onClick={() => loadEntry(entry)}
                    title="Recharger cette traduction"
                    className="block w-full text-left group"
                  >
                    <p className="text-sm text-forma-text truncate group-hover:text-forma-accent transition-colors">
                      {entry.src}
                    </p>
                    <p className="text-sm text-forma-muted truncate">{entry.dst}</p>
                  </button>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-forma-muted">
                      {entry.from === 'fr' ? 'FR → EN' : 'EN → FR'}
                      {' · '}
                      {MODE_LABELS[entry.mode as TranslationMode] ?? entry.mode}
                      {' · '}
                      {new Date(entry.ts).toLocaleDateString('fr-CA')}
                    </span>
                    <div className="flex-1" />
                    <button
                      type="button"
                      title={entry.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      onClick={() => persist({ ...state, history: toggleHistoryFavorite(state.history, entry.ts) })}
                      className={entry.favorite ? 'text-amber-400' : 'text-forma-muted hover:text-amber-400'}
                    >
                      <Icon name={entry.favorite ? 'star' : 'star-outline'} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Copier la traduction"
                      onClick={() => void copyText(entry.dst, 'Traduction copiée')}
                      className="text-forma-muted hover:text-forma-accent"
                    >
                      <Icon name="copy" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Envoyer vers FormaDoc"
                      onClick={() => void sendToFormaDoc(entry)}
                      className="text-forma-muted hover:text-forma-accent"
                    >
                      <Icon name="file-text" className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Supprimer de l’historique"
                      onClick={() => persist({ ...state, history: removeHistoryEntry(state.history, entry.ts) })}
                      className="text-forma-muted hover:text-red-500"
                    >
                      <Icon name="trash" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
