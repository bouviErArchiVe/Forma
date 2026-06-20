/**
 * DictionaryPage — navigateur de la base de connaissance Forma (/dictionary).
 *
 * Léger, extractif et HONNÊTE :
 *  - charge la base paresseusement au montage (`loadKnowledgeBase`) — états de
 *    chargement / erreur, jamais bloquant pour le reste de l'app (page lazy-route).
 *  - recherche → `searchKnowledgeBase(q)` ; rendu via `KnowledgeEntryCard`
 *    (source + confiance TOUJOURS visibles, badge explicite « À vérifier »).
 *  - requête vide → mode parcours (échantillon groupé par domaine).
 *  - aucun résultat → message honnête (aucune source locale fiable) — jamais de
 *    définition fabriquée (`answerKnowledgeBase` honnête).
 *  - liens profonds : `?q=<terme>` (pré-remplit) et `?slug=<slug>` (ouvre une
 *    entrée précise via `lookupBySlug` ; slug inconnu → no-result, pas de crash).
 *
 * N'IMPORTE rien des seeds au top-level : tout passe par l'API paresseuse.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { KnowledgeEntryCard } from '../components/knowledge/KnowledgeEntryCard'
import {
  loadKnowledgeBase,
  lookupBySlug,
  searchKnowledgeBase,
  type KnowledgeEntry,
} from '../lib/knowledge'

/** Nombre d'entrées d'échantillon par domaine en mode parcours. */
const BROWSE_PER_DOMAIN = 6
/** Nombre maximum de domaines affichés en mode parcours. */
const BROWSE_MAX_DOMAINS = 8
/** Nombre maximum de hits de recherche rendus. */
const SEARCH_LIMIT = 40

interface BrowseGroup {
  domain: string
  entries: KnowledgeEntry[]
}

/** Groupe un échantillon d'entrées par domaine (ordre d'apparition). */
function buildBrowseGroups(entries: readonly KnowledgeEntry[]): BrowseGroup[] {
  const byDomain = new Map<string, KnowledgeEntry[]>()
  for (const entry of entries) {
    const key = entry.domain || 'Autres'
    const list = byDomain.get(key)
    if (list) {
      if (list.length < BROWSE_PER_DOMAIN) list.push(entry)
    } else {
      byDomain.set(key, [entry])
    }
  }
  return [...byDomain.entries()]
    .slice(0, BROWSE_MAX_DOMAINS)
    .map(([domain, list]) => ({ domain, entries: list }))
}

export function DictionaryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const slugParam = searchParams.get('slug') ?? ''

  const [entries, setEntries] = useState<readonly KnowledgeEntry[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [query, setQuery] = useState(initialQ)
  const [hits, setHits] = useState<KnowledgeEntry[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  /** Entrée résolue par `?slug=` ; `null` = pas de slug, `'missing'` = introuvable. */
  const [slugEntry, setSlugEntry] = useState<KnowledgeEntry | null | 'missing'>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  // ── Résolution du lien profond ?slug= ───────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return
    if (!slugParam) {
      setSlugEntry(null)
      return
    }
    let cancelled = false
    void lookupBySlug(slugParam).then((entry) => {
      if (!cancelled) setSlugEntry(entry ?? 'missing')
    })
    return () => {
      cancelled = true
    }
  }, [slugParam, status])

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setHits([])
      setSearched(false)
      setSearching(false)
      return
    }
    setSearching(true)
    try {
      const found = await searchKnowledgeBase(trimmed, { limit: SEARCH_LIMIT })
      setHits(found.map((h) => h.entry))
      setSearched(true)
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

  const handleQueryChange = (v: string) => {
    setQuery(v)
    // Une nouvelle recherche annule un éventuel lien profond ?slug=.
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

  const browseGroups = useMemo(() => buildBrowseGroups(entries), [entries])

  const showSlugView = Boolean(slugParam)
  const isSearching = query.trim().length >= 2

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
        {!searching && searched && (
          <span className="text-xs text-forma-muted shrink-0">
            {hits.length} résultat{hits.length !== 1 ? 's' : ''}
          </span>
        )}
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
              <div className="mb-6">
                <button
                  type="button"
                  onClick={() => setSearchParams({}, { replace: true })}
                  className="text-xs text-forma-accent underline mb-3 inline-block"
                >
                  ← Parcourir le dictionnaire
                </button>
                <KnowledgeEntryCard entry={slugEntry} />
                <RelatedTerms entry={slugEntry} onOpen={openSlug} />
              </div>
            )}

            {showSlugView && slugEntry === null && (
              <div className="text-center text-forma-muted mt-20 text-sm animate-pulse">Ouverture de l'entrée…</div>
            )}

            {/* ── Recherche ───────────────────────────────────────────────── */}
            {!showSlugView && isSearching && searched && hits.length > 0 && (
              <ul className="grid gap-3 sm:grid-cols-2">
                {hits.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => openSlug(entry.slug)}
                      className="w-full text-left"
                    >
                      <KnowledgeEntryCard entry={entry} className="h-full hover:border-forma-accent/50 transition-colors" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* ── No-result HONNÊTE ───────────────────────────────────────── */}
            {!showSlugView && isSearching && searched && hits.length === 0 && (
              <NoReliableSource label={query.trim()} />
            )}

            {/* ── Mode parcours (requête vide) ────────────────────────────── */}
            {!showSlugView && !isSearching && (
              <div className="space-y-6">
                <p className="text-sm text-forma-muted">
                  {entries.length} entrées sourcées · parcourez par domaine ou recherchez un terme.
                  Forma n'affiche jamais de définition non sourcée.
                </p>
                {browseGroups.map((group) => (
                  <section key={group.domain}>
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-forma-accent mb-2">
                      {group.domain}
                    </h2>
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {group.entries.map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onClick={() => openSlug(entry.slug)}
                            className="w-full text-left"
                          >
                            <KnowledgeEntryCard
                              entry={entry}
                              className="h-full hover:border-forma-accent/50 transition-colors"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
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

/** Liste cliquable des termes liés (navigation interne par slug). */
function RelatedTerms({
  entry,
  onOpen,
}: {
  entry: KnowledgeEntry
  onOpen: (slug: string) => void
}) {
  if (!entry.relatedTerms || entry.relatedTerms.length === 0) return null
  return (
    <div className="mt-3">
      <p className="text-[10px] uppercase tracking-wide text-forma-muted mb-1.5">Termes liés</p>
      <ul className="flex flex-wrap gap-1.5">
        {entry.relatedTerms.map((rel) => (
          <li key={rel}>
            <button
              type="button"
              onClick={() => onOpen(rel)}
              className="text-xs px-2 py-1 rounded-md border border-forma-border text-forma-muted hover:border-forma-accent/50 hover:text-forma-text transition-colors"
            >
              {rel}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
