/**
 * DictionaryModule — Dictionnaire V2.
 *
 * Base architecture intégrée (≥40 termes, hors ligne), recherche
 * instantanée, favoris, historique de consultation, notes personnelles
 * par terme, et enrichissement FormAI si un provider cloud est configuré.
 */
import { useMemo, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { getProvider, resolveProviderSettings } from '../../services/ai/providers'
import { useToastStore } from '../../stores/toastStore'
import type { ModuleProps } from '../ModuleHost'
import {
  ARCHITECTURE_GLOSSARY,
  glossaryByCategory,
  searchGlossary,
  type GlossaryEntry,
} from './architecture-glossary'

interface DictionaryState {
  v: 1
  favorites: string[]
  history: string[]
  notes: Record<string, string>
  aiEnrichments: Record<string, string>
}

function parseState(json: string): DictionaryState {
  const empty: DictionaryState = { v: 1, favorites: [], history: [], notes: {}, aiEnrichments: {} }
  if (json.trim() === '') return empty
  try {
    const parsed = JSON.parse(json) as Partial<DictionaryState>
    return {
      v: 1,
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
      notes: parsed.notes && typeof parsed.notes === 'object' ? parsed.notes : {},
      aiEnrichments:
        parsed.aiEnrichments && typeof parsed.aiEnrichments === 'object' ? parsed.aiEnrichments : {},
    }
  } catch {
    return empty
  }
}

const HISTORY_MAX = 30

export function DictionaryModule({ data, onDataChange }: ModuleProps) {
  const [state, setState] = useState<DictionaryState>(() => parseState(data))
  const [query, setQuery] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null)
  const [enriching, setEnriching] = useState(false)

  const settings = resolveProviderSettings()
  const cloudReady = settings.providerId !== 'local' && settings.providerId !== 'mock'

  const update = (next: DictionaryState) => {
    setState(next)
    onDataChange(JSON.stringify(next))
  }

  const results = useMemo(() => (query.trim() !== '' ? searchGlossary(query) : null), [query])
  const categories = useMemo(() => glossaryByCategory(), [])
  const selected: GlossaryEntry | undefined = ARCHITECTURE_GLOSSARY.find((e) => e.term === selectedTerm)

  const openTerm = (term: string) => {
    setSelectedTerm(term)
    const history = [term, ...state.history.filter((t) => t !== term)].slice(0, HISTORY_MAX)
    update({ ...state, history })
  }

  const toggleFavorite = (term: string) => {
    const favorites = state.favorites.includes(term)
      ? state.favorites.filter((t) => t !== term)
      : [...state.favorites, term]
    update({ ...state, favorites })
  }

  const enrich = async (entry: GlossaryEntry) => {
    setEnriching(true)
    try {
      const provider = getProvider(settings.providerId)
      const res = await provider.chat({
        messages: [
          {
            role: 'system',
            content:
              'Tu es un terminologue de l’architecture et de la construction au Canada/Québec. Réponds en français, de façon concise (5-8 lignes), sans inventer de références réglementaires.',
          },
          {
            role: 'user',
            content: `Enrichis cette fiche de dictionnaire : « ${entry.term} » — ${entry.definition}\nDonne : origine/étymologie si pertinente, usage en contexte québécois/canadien, termes liés, et une précision technique utile.`,
          },
        ],
        settings,
      })
      if (res.error || res.text.trim() === '') {
        useToastStore.getState().show(`Enrichissement impossible : ${res.error ?? 'réponse vide'}`)
      } else {
        update({ ...state, aiEnrichments: { ...state.aiEnrichments, [entry.term]: res.text } })
      }
    } finally {
      setEnriching(false)
    }
  }

  // ── Liste latérale : résultats de recherche, favoris/récents, catégories ────
  const listEntries: { title: string; entries: GlossaryEntry[] }[] = results
    ? [{ title: `Résultats (${results.length})`, entries: results }]
    : [
        ...(state.favorites.length > 0
          ? [{
              title: '★ Favoris',
              entries: ARCHITECTURE_GLOSSARY.filter((e) => state.favorites.includes(e.term)),
            }]
          : []),
        ...(state.history.length > 0
          ? [{
              title: 'Récents',
              entries: state.history
                .map((t) => ARCHITECTURE_GLOSSARY.find((e) => e.term === t))
                .filter((e): e is GlossaryEntry => e !== undefined)
                .slice(0, 6),
            }]
          : []),
        ...categories.map((c) => ({ title: c.category, entries: c.entries })),
      ]

  return (
    <div className="h-full flex min-h-0">
      {/* ── Liste ──────────────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-r border-forma-border bg-forma-surface flex flex-col min-h-0">
        <div className="p-2 shrink-0">
          <div className="relative">
            <Icon name="search" className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-forma-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher un terme…"
              className="w-full text-xs border border-forma-border rounded-lg pl-7 pr-2 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-2">
          {listEntries.map((group) => (
            <div key={group.title}>
              <p className="px-1 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-forma-muted">
                {group.title}
              </p>
              {group.entries.map((e) => (
                <button
                  key={`${group.title}-${e.term}`}
                  type="button"
                  onClick={() => openTerm(e.term)}
                  className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    selectedTerm === e.term
                      ? 'bg-forma-accent/10 text-forma-accent font-medium'
                      : 'text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {state.favorites.includes(e.term) && <span className="text-amber-400 shrink-0">★</span>}
                  <span className="truncate">{e.term}</span>
                </button>
              ))}
            </div>
          ))}
          {results && results.length === 0 && (
            <p className="text-[11px] text-forma-muted text-center py-6">Aucun terme trouvé</p>
          )}
        </div>
      </aside>

      {/* ── Fiche ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6">
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-forma-accent/10 text-forma-accent flex items-center justify-center mb-3">
              <Icon name="book" className="w-6 h-6" />
            </div>
            <h2 className="text-base font-semibold text-forma-text mb-1">Dictionnaire d’architecture</h2>
            <p className="text-xs text-forma-muted max-w-sm">
              {ARCHITECTURE_GLOSSARY.length} termes de construction et d’architecture, disponibles hors ligne.
              Cherchez un terme ou parcourez les catégories.
            </p>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h2 className="text-xl font-semibold text-forma-text capitalize">{selected.term}</h2>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title="Copier la fiche (Markdown)"
                  onClick={async () => {
                    const e = selected
                    const md = [
                      `## ${e.term}`,
                      '',
                      e.definition,
                      e.synonyms.length > 0 ? `\n**Synonymes :** ${e.synonyms.join(', ')}` : '',
                      e.antonyms && e.antonyms.length > 0 ? `**Antonymes :** ${e.antonyms.join(', ')}` : '',
                      e.example ? `\n*${e.example}*` : '',
                      state.notes[e.term]?.trim() ? `\n**Mes notes :** ${state.notes[e.term].trim()}` : '',
                    ].filter(Boolean).join('\n')
                    try {
                      await navigator.clipboard.writeText(md)
                      useToastStore.getState().show('Fiche copiée (Markdown)')
                    } catch {
                      useToastStore.getState().show('Copie impossible')
                    }
                  }}
                  className="p-1 text-forma-muted hover:text-forma-accent"
                >
                  <Icon name="copy" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title={state.favorites.includes(selected.term) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  onClick={() => toggleFavorite(selected.term)}
                  className="p-1 text-forma-muted hover:text-amber-400"
                >
                  <Icon
                    name={state.favorites.includes(selected.term) ? 'star' : 'star-outline'}
                    className={`w-4 h-4 ${state.favorites.includes(selected.term) ? 'text-amber-400' : ''}`}
                  />
                </button>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-3">{selected.category}</p>
            <p className="text-sm text-forma-text leading-relaxed mb-4">{selected.definition}</p>

            {selected.synonyms.length > 0 && (
              <p className="text-xs text-forma-muted mb-1">
                <span className="font-medium text-forma-text">Synonymes : </span>
                {selected.synonyms.join(', ')}
              </p>
            )}
            {selected.antonyms && selected.antonyms.length > 0 && (
              <p className="text-xs text-forma-muted mb-1">
                <span className="font-medium text-forma-text">Antonymes : </span>
                {selected.antonyms.join(', ')}
              </p>
            )}
            {selected.example && (
              <p className="text-xs text-forma-muted italic border-l-2 border-forma-border pl-2 mt-3">
                {selected.example}
              </p>
            )}

            {/* Enrichissement IA */}
            {state.aiEnrichments[selected.term] ? (
              <div className="mt-4 p-3 rounded-xl border border-forma-accent/30 bg-forma-accent/5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-accent mb-1 inline-flex items-center gap-1">
                  <Icon name="sparkles" className="w-3 h-3" />
                  Complément FormAI
                </p>
                <p className="text-xs text-forma-text whitespace-pre-wrap leading-relaxed">
                  {state.aiEnrichments[selected.term]}
                </p>
              </div>
            ) : cloudReady ? (
              <button
                type="button"
                disabled={enriching}
                onClick={() => void enrich(selected)}
                className="mt-4 text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Icon name="sparkles" className="w-3.5 h-3.5" />
                {enriching ? 'Enrichissement…' : 'Enrichir avec FormAI'}
              </button>
            ) : null}

            {/* Notes personnelles */}
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1">
                Mes notes
              </p>
              <textarea
                value={state.notes[selected.term] ?? ''}
                onChange={(e) =>
                  update({ ...state, notes: { ...state.notes, [selected.term]: e.target.value } })
                }
                placeholder="Ajouter une note personnelle sur ce terme…"
                rows={3}
                className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-2 bg-forma-bg resize-y focus:outline-none focus:border-forma-accent"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
