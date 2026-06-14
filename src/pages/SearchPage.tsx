/**
 * SearchPage — recherche globale dédiée avec aperçu des résultats.
 *
 * Accessible via /search?q=…
 * Fonctionnalités :
 * - Recherche dans tous les carnets, documents, tableaux, moodboards
 * - Sources : titre, texte canvas, encre OCR, PDF, FormaDoc, FormaTab, FMoodboard
 * - Debounce 300 ms
 * - Filtrage par type de source
 * - Navigation directe vers le document/page
 * - Indicateur de chargement
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import {
  globalHitSourceLabel,
  searchGlobalPages,
  type GlobalPageHit,
} from '../lib/global-search'
import { searchEcosystem, type EcosystemHit } from '../lib/ecosystem-search'

const SOURCE_ICONS: Record<GlobalPageHit['source'], string> = {
  title: '📓',
  text: '✏️',
  ink: '🖊',
  pdf: '📄',
  content: '📝',
  table: '📊',
  board: '🎨',
  module: '🧩',
}

const SOURCE_COLORS: Record<GlobalPageHit['source'], string> = {
  title: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  text: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  ink: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  pdf: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  content: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  table: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  board: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  module: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
}

const ALL_SOURCES: GlobalPageHit['source'][] = ['title', 'content', 'text', 'table', 'board', 'module', 'pdf', 'ink']

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const q = query.toLowerCase()
  const idx = text.toLowerCase().indexOf(q)
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 dark:bg-amber-700/60 text-inherit rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''

  const [query, setQuery] = useState(initialQ)
  const [results, setResults] = useState<GlobalPageHit[]>([])
  const [ecoHits, setEcoHits] = useState<EcosystemHit[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [filterSource, setFilterSource] = useState<GlobalPageHit['source'] | 'all'>('all')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      setEcoHits([])
      setSearched(false)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [hits, eco] = await Promise.all([searchGlobalPages(q, 50), searchEcosystem(q, 20)])
      setResults(hits)
      setEcoHits(eco)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // Run search from URL param on mount (setState après microtâche — jamais synchrone)
  useEffect(() => {
    if (initialQ.trim().length >= 2) void Promise.resolve().then(() => runSearch(initialQ))
    inputRef.current?.focus()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleQueryChange = (v: string) => {
    setQuery(v)
    setSearchParams(v ? { q: v } : {}, { replace: true })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void runSearch(v), 300)
  }

  const openHit = (h: GlobalPageHit) => {
    if (h.pageId) navigate(`/document/${h.notebookId}?page=${h.pageId}`)
    else navigate(`/document/${h.notebookId}`)
  }

  const filtered = filterSource === 'all'
    ? results
    : results.filter((h) => h.source === filterSource)

  const counts = results.reduce<Record<string, number>>((acc, h) => {
    acc[h.source] = (acc[h.source] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-forma-bg text-forma-text flex flex-col">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-forma-surface border-b border-forma-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
          title="Retour à la bibliothèque"
        >
          <Icon name="chevron-left" className="w-4 h-4" />
        </button>
        <span className="text-forma-muted shrink-0 text-sm">🔍</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Rechercher dans tous les documents…"
          className="flex-1 bg-transparent outline-none text-sm"
          autoComplete="off"
          spellCheck={false}
          onKeyDown={(e) => {
            if (e.key === 'Escape') navigate('/')
            if (e.key === 'Enter' && query.trim().length >= 2) {
              if (debounceRef.current) clearTimeout(debounceRef.current)
              void runSearch(query)
            }
          }}
        />
        {loading && (
          <span className="text-xs text-forma-muted shrink-0 animate-pulse">Recherche…</span>
        )}
        {!loading && searched && (
          <span className="text-xs text-forma-muted shrink-0">
            {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      {searched && results.length > 0 && (
        <div className="sticky top-[57px] z-10 bg-forma-surface/90 backdrop-blur border-b border-forma-border px-4 py-2 flex gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterSource('all')}
            className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
              filterSource === 'all'
                ? 'bg-forma-accent text-white border-forma-accent'
                : 'border-forma-border hover:border-forma-accent/40 text-forma-muted hover:text-forma-text'
            }`}
          >
            Tout ({results.length})
          </button>
          {ALL_SOURCES.filter((s) => counts[s]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilterSource(s)}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                filterSource === s
                  ? 'bg-forma-accent text-white border-forma-accent'
                  : 'border-forma-border hover:border-forma-accent/40 text-forma-muted hover:text-forma-text'
              }`}
            >
              {SOURCE_ICONS[s]} {globalHitSourceLabel(s)} ({counts[s]})
            </button>
          ))}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">

        {/* Empty state */}
        {!searched && !loading && (
          <div className="text-center text-forma-muted mt-20">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-sm">Tapez au moins 2 caractères pour rechercher</p>
            <p className="text-xs mt-2 opacity-60">Carnets · Documents · Tableaux · Moodboards · PDF · Encre OCR</p>
          </div>
        )}

        {searched && !loading && filtered.length === 0 && ecoHits.length === 0 && (
          <div className="text-center text-forma-muted mt-20">
            <div className="text-4xl mb-4">😶</div>
            <p className="text-sm">Aucun résultat pour <strong>«{query}»</strong></p>
            {filterSource !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterSource('all')}
                className="mt-3 text-xs text-forma-accent underline"
              >
                Voir tous les types de résultats
              </button>
            )}
          </div>
        )}

        {/* ── Écosystème : tâches, projets, normes, détails ─────────────────── */}
        {searched && !loading && ecoHits.length > 0 && filterSource === 'all' && (
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1.5">
              Écosystème ({ecoHits.length})
            </p>
            <ul className="space-y-1.5">
              {ecoHits.map((h) => (
                <li key={`${h.kind}-${h.id}`}>
                  <button
                    type="button"
                    onClick={() => navigate(h.to)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/50 transition-colors"
                  >
                    <span className="text-base shrink-0">
                      {h.kind === 'task' ? '✅'
                        : h.kind === 'project' ? '📁'
                        : h.kind === 'norme' ? '📋'
                        : h.kind === 'material' ? '🧱'
                        : h.kind === 'quiz' ? '❓'
                        : h.kind === 'checklist' ? '☑️'
                        : h.kind === 'session' ? '📅'
                        : '📐'}
                    </span>
                    <span className="text-sm text-forma-text truncate flex-1">{h.title}</span>
                    <span className="text-[10px] text-forma-muted shrink-0">{h.subtitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {filtered.length > 0 && (
          <ul className="space-y-2">
            {filtered.map((h, i) => (
              <li key={`${h.notebookId}-${h.pageId}-${h.source}-${i}`}>
                <button
                  type="button"
                  onClick={() => openHit(h)}
                  className="w-full text-left rounded-xl border border-forma-border bg-forma-surface hover:border-forma-accent/40 hover:shadow-md transition-all duration-150 p-4 flex flex-col gap-1.5 group"
                >
                  {/* Top row: notebook name + source badge */}
                  <div className="flex items-center gap-2 justify-between">
                    <span className="font-medium text-sm truncate group-hover:text-forma-accent transition-colors">
                      {highlight(h.notebookName, query)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${SOURCE_COLORS[h.source]}`}>
                      {SOURCE_ICONS[h.source]} {globalHitSourceLabel(h.source)}
                    </span>
                  </div>

                  {/* Page reference */}
                  {h.pageId && (
                    <span className="text-xs text-forma-muted">
                      Page {h.pageIndex}
                    </span>
                  )}

                  {/* Snippet */}
                  {h.snippet && h.source !== 'title' && (
                    <p className="text-xs text-forma-muted leading-relaxed line-clamp-2">
                      {highlight(h.snippet, query)}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Load-more hint */}
        {filtered.length >= 20 && (
          <p className="text-center text-xs text-forma-muted mt-6">
            Affinage de la requête pour des résultats plus précis.
          </p>
        )}
      </main>
    </div>
  )
}
