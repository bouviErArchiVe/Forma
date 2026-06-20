/**
 * DictionaryPage — navigateur PRO de la base de connaissance Forma (/dictionary).
 *
 * Léger, extractif et HONNÊTE :
 *  - charge la base paresseusement au montage (`loadKnowledgeBase`) — états de
 *    chargement / erreur, jamais bloquant pour le reste de l'app (page lazy-route).
 *  - parcours ET recherche unifiés sous filtres (type / domaine / confiance +
 *    vues rapides Favoris / Récents), tri (A→Z, Z→A, type, confiance, pertinence)
 *    et pagination EN MÉMOIRE (« charger plus »).
 *  - fiche détaillée enrichie (`KnowledgeDetail`) : définition longue, exemples,
 *    synonymes, termes liés, tags, toutes les sources + confiance. Synonymes /
 *    termes liés cliquables (résolus vers une entrée, sinon recherche — jamais de
 *    clic mort) ; exemples cliquables (pré-remplissent la recherche).
 *  - aucun résultat → message honnête (aucune source locale fiable), jamais de
 *    définition fabriquée.
 *  - liens profonds : `?q=<terme>` et `?slug=<slug>` (slug inconnu → no-result).
 *  - favoris / récents persistés en localStorage léger (`useDictionaryStore`).
 *
 * N'IMPORTE rien des seeds au top-level : tout passe par l'API paresseuse.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { KnowledgeEntryCard } from '../components/knowledge/KnowledgeEntryCard'
import { KnowledgeDetail } from '../components/knowledge/KnowledgeDetail'
import { KnowledgeFilters } from '../components/knowledge/KnowledgeFilters'
import {
  applyFilter,
  distinctDomains,
  distinctTypes,
  paginate,
  resolveTerm,
  sortEntries,
  DICTIONARY_PAGE_SIZE,
  type DictionaryFilter,
  type DictionarySort,
} from '../lib/dictionary-filters'
import { useDictionaryStore } from '../stores/dictionaryStore'
import {
  loadKnowledgeBase,
  lookupBySlug,
  searchKnowledgeBase,
  type KnowledgeEntry,
} from '../lib/knowledge'

/** Hits récupérés pour la recherche (les filtres/tri/pagination opèrent en mémoire dessus). */
const SEARCH_FETCH_LIMIT = 200

const BROWSE_SORTS: DictionarySort[] = ['term-asc', 'term-desc', 'type', 'confidence']
const SEARCH_SORTS: DictionarySort[] = ['relevance', 'term-asc', 'term-desc', 'type', 'confidence']

export function DictionaryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const slugParam = searchParams.get('slug') ?? ''

  const [entries, setEntries] = useState<readonly KnowledgeEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [query, setQuery] = useState(initialQ)
  const [hits, setHits] = useState<KnowledgeEntry[]>([])
  const [searching, setSearching] = useState(false)
  const [filter, setFilter] = useState<DictionaryFilter>({})
  const [sort, setSort] = useState<DictionarySort>('term-asc')
  const [page, setPage] = useState(1)
  /** Entrée résolue par `?slug=` ; `null` = pas de slug, `'missing'` = introuvable. */
  const [slugEntry, setSlugEntry] = useState<KnowledgeEntry | null | 'missing'>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const favorites = useDictionaryStore((s) => s.favorites)
  const recents = useDictionaryStore((s) => s.recents)
  const isFavorite = useDictionaryStore((s) => s.isFavorite)
  const toggleFavorite = useDictionaryStore((s) => s.toggleFavorite)
  const pushRecent = useDictionaryStore((s) => s.pushRecent)

  const favoriteSet = useMemo(() => new Set(favorites), [favorites])
  const recentSet = useMemo(() => new Set(recents), [recents])

  // ── Chargement paresseux de la base au montage ──────────────────────────
  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    loadKnowledgeBase()
      .then((all) => {
        if (cancelled) return
        setEntries(all)
        setStatus('ready')
      })
      .catch((err) => {
        console.error('[Forma] Échec du chargement de la base de connaissance:', err)
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // ── Résolution du lien profond ?slug= (+ enregistrement dans les récents) ─
  useEffect(() => {
    if (status !== 'ready') return
    if (!slugParam) {
      setSlugEntry(null)
      return
    }
    let cancelled = false
    void lookupBySlug(slugParam).then((entry) => {
      if (cancelled) return
      setSlugEntry(entry ?? 'missing')
      if (entry) pushRecent(entry.slug)
    })
    return () => {
      cancelled = true
    }
  }, [slugParam, status, pushRecent])

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setHits([])
      setSearching(false)
      return
    }
    setSearching(true)
    try {
      const found = await searchKnowledgeBase(trimmed, { limit: SEARCH_FETCH_LIMIT })
      setHits(found.map((h) => h.entry))
    } finally {
      setSearching(false)
    }
  }, [])

  // ── Recherche initiale depuis ?q= (après chargement) ────────────────────
  useEffect(() => {
    if (status !== 'ready') return
    if (initialQ.trim().length >= 2) void runSearch(initialQ)
    inputRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const isSearching = query.trim().length >= 2

  // Tri par défaut adapté au mode (pertinence en recherche, A→Z en parcours).
  useEffect(() => {
    setSort(isSearching ? 'relevance' : 'term-asc')
  }, [isSearching])

  // Toute nouvelle sélection (filtre / tri / requête / hits) ramène en page 1.
  const filterKey = JSON.stringify(filter)
  useEffect(() => {
    setPage(1)
  }, [filterKey, sort, isSearching, hits])

  const handleQueryChange = (v: string) => {
    setQuery(v)
    const next: Record<string, string> = {}
    if (v) next.q = v
    setSearchParams(next, { replace: true })
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void runSearch(v), 250)
  }

  const openSlug = useCallback(
    (slug: string) => {
      setSearchParams({ slug }, { replace: false })
    },
    [setSearchParams],
  )

  /** Ouvre un terme libre : entrée existante si résolue, sinon bascule en recherche. */
  const openTerm = useCallback(
    (raw: string) => {
      const found = resolveTerm(raw, entries)
      if (found) {
        openSlug(found.slug)
      } else {
        setSearchParams({}, { replace: false })
        handleQueryChange(raw)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entries, openSlug],
  )

  /** Pré-remplit la recherche depuis un exemple (quitte la fiche). */
  const prefillSearch = useCallback(
    (text: string) => {
      setSearchParams({}, { replace: false })
      handleQueryChange(text)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const domains = useMemo(() => distinctDomains(entries), [entries])
  const types = useMemo(() => distinctTypes(entries), [entries])

  // Liste unifiée : base (parcours = toutes, recherche = hits) → filtre → tri → pagination.
  const base = isSearching ? hits : entries
  const filtered = useMemo(
    () => sortEntries(applyFilter(base, filter, favoriteSet, recentSet), sort),
    [base, filter, favoriteSet, recentSet, sort],
  )
  const paged = useMemo(() => paginate(filtered, page, DICTIONARY_PAGE_SIZE, true), [filtered, page])

  const showSlugView = Boolean(slugParam)

  return (
    <div className="min-h-screen bg-forma-bg text-forma-text flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-forma-surface border-b border-forma-border px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
          title="Retour à la bibliothèque"
        >
          <Icon name="chevron-left" className="w-4 h-4" />
        </button>
        <span className="text-forma-muted shrink-0 text-sm">📖</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Rechercher un terme (architecture, construction, matériaux…)"
          className="flex-1 bg-transparent outline-none text-sm"
          autoComplete="off"
          spellCheck={false}
          disabled={status !== 'ready'}
          onKeyDown={(e) => {
            if (e.key === 'Escape') navigate('/')
            if (e.key === 'Enter' && query.trim().length >= 2) {
              if (debounceRef.current) clearTimeout(debounceRef.current)
              void runSearch(query)
            }
          }}
        />
        {searching && <span className="text-xs text-forma-muted shrink-0 animate-pulse">Recherche…</span>}
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {/* ── Chargement de la base ────────────────────────────────────────── */}
        {status === 'loading' && (
          <div className="text-center text-forma-muted mt-20">
            <div className="text-4xl mb-4 animate-pulse">📚</div>
            <p className="text-sm">Chargement du dictionnaire…</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center text-forma-muted mt-20">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-sm">Impossible de charger la base de connaissance.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 text-xs text-forma-accent underline"
            >
              Réessayer
            </button>
          </div>
        )}

        {status === 'ready' && (
          <>
            {/* ── Vue lien profond ?slug= ─────────────────────────────────── */}
            {showSlugView && slugEntry === 'missing' && (
              <NoReliableSource label={slugParam} onBrowse={() => setSearchParams({}, { replace: true })} />
            )}

            {showSlugView && slugEntry && slugEntry !== 'missing' && (
              <KnowledgeDetail
                entry={slugEntry}
                favorite={isFavorite(slugEntry.slug)}
                onToggleFavorite={toggleFavorite}
                onOpenTerm={openTerm}
                onPrefillSearch={prefillSearch}
                onBack={() => setSearchParams({}, { replace: true })}
              />
            )}

            {showSlugView && slugEntry === null && (
              <div className="text-center text-forma-muted mt-20 text-sm animate-pulse">Ouverture de l'entrée…</div>
            )}

            {/* ── Liste unifiée (parcours / recherche) ────────────────────── */}
            {!showSlugView && (
              <div className="space-y-4">
                <KnowledgeFilters
                  filter={filter}
                  onFilterChange={setFilter}
                  sort={sort}
                  onSortChange={setSort}
                  domains={domains}
                  types={types}
                  sorts={isSearching ? SEARCH_SORTS : BROWSE_SORTS}
                  favoritesCount={favorites.length}
                  recentsCount={recents.length}
                />

                <p className="text-xs text-forma-muted">
                  {paged.total} entrée{paged.total !== 1 ? 's' : ''}
                  {isSearching ? ' trouvée' + (paged.total !== 1 ? 's' : '') : ' sourcée' + (paged.total !== 1 ? 's' : '')}
                  {' · '}Forma n'affiche jamais de définition non sourcée.
                </p>

                {paged.total === 0 ? (
                  isSearching ? (
                    <NoReliableSource label={query.trim()} />
                  ) : (
                    <EmptyFilters onReset={() => setFilter({})} />
                  )
                ) : (
                  <>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {paged.items.map((entry) => (
                        <li key={entry.id}>
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openSlug(entry.slug)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                openSlug(entry.slug)
                              }
                            }}
                            className="w-full text-left cursor-pointer h-full"
                          >
                            <KnowledgeEntryCard
                              entry={entry}
                              favorite={isFavorite(entry.slug)}
                              onToggleFavorite={toggleFavorite}
                              className="h-full hover:border-forma-accent/50 transition-colors"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>

                    {paged.hasMore && (
                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => setPage((p) => p + 1)}
                          className="text-xs px-4 py-2 rounded-lg border border-forma-border text-forma-text hover:border-forma-accent/50 transition-colors"
                        >
                          Charger plus ({paged.items.length} / {paged.total})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

/** Message HONNÊTE : aucune source locale fiable — jamais de définition inventée. */
function NoReliableSource({ label, onBrowse }: { label: string; onBrowse?: () => void }) {
  return (
    <div className="text-center text-forma-muted mt-16">
      <div className="text-4xl mb-4">🔍</div>
      <p className="text-sm">
        Forma n'a pas encore de source locale fiable pour <strong>«&nbsp;{label}&nbsp;»</strong>.
      </p>
      <p className="text-xs mt-2 opacity-70 max-w-md mx-auto">
        Aucune définition n'est inventée : seules les entrées sourcées et vérifiées sont affichées.
        Essayez un autre terme ou un synonyme.
      </p>
      {onBrowse && (
        <button type="button" onClick={onBrowse} className="mt-3 text-xs text-forma-accent underline">
          Parcourir le dictionnaire
        </button>
      )}
    </div>
  )
}

/** Aucun résultat sous les filtres actifs (mode parcours). */
function EmptyFilters({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center text-forma-muted mt-12">
      <div className="text-3xl mb-3">🗂️</div>
      <p className="text-sm">Aucune entrée ne correspond à ces filtres.</p>
      <button type="button" onClick={onReset} className="mt-3 text-xs text-forma-accent underline">
        Réinitialiser les filtres
      </button>
    </div>
  )
}
