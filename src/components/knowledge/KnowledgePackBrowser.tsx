/**
 * KnowledgePackBrowser — navigateur des entrées du pack PDF (Part 10).
 *
 * Source de données : Dexie `formaKnowledgeEntries` (importé paresseusement
 * depuis public/). Affiche badges de gate (clean / À vérifier / Historique),
 * source (document + page), tags, et filtres (gate, document). `quarantine` est
 * caché par défaut. Composant autonome, monté dans /dictionary (onglet PDF).
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ensureKnowledgePackImported,
  type ImportResult,
} from '../../services/knowledge-pack/import'
import {
  entryBadges,
  entrySourceLabel,
  packDocuments,
  searchPackEntries,
} from '../../services/knowledge-pack/query'
import type { ImportGate, PackKnowledgeEntry } from '../../services/knowledge-pack/types'

const PAGE = 24

function GateBadge({ entry }: { entry: PackKnowledgeEntry }) {
  const b = entryBadges(entry)
  if (b.historical) {
    return <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-semibold uppercase tracking-wide">Historique</span>
  }
  if (b.gate === 'review') {
    return <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide">À vérifier</span>
  }
  return <span className="text-[10px] px-1.5 py-0.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wide">Sourcé</span>
}

export function KnowledgePackBrowser({ initialQuery = '' }: { initialQuery?: string }) {
  const [status, setStatus] = useState<'importing' | 'ready' | 'error'>('importing')
  const [query, setQuery] = useState(initialQuery)
  const [gate, setGate] = useState<'' | ImportGate>('')
  const [document, setDocument] = useState('')
  const [docs, setDocs] = useState<string[]>([])
  const [items, setItems] = useState<PackKnowledgeEntry[]>([])
  const [total, setTotal] = useState(0)
  const [shown, setShown] = useState(PAGE)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Import paresseux du pack (une fois) + chargement des documents.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const r: ImportResult = await ensureKnowledgePackImported()
      if (cancelled) return
      if (r.batch.status === 'failed') { setStatus('error'); return }
      setDocs(await packDocuments())
      setStatus('ready')
    })()
    return () => { cancelled = true }
  }, [])

  const run = useMemo(
    () => async (text: string, g: '' | ImportGate, doc: string) => {
      const r = await searchPackEntries({
        text: text.trim() || undefined,
        gate: g || undefined,
        document: doc || undefined,
        limit: 500,
      })
      setItems(r.items)
      setTotal(r.total)
      setShown(PAGE)
    },
    [],
  )

  useEffect(() => {
    if (status !== 'ready') return
    void run(initialQuery, '', '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const onQuery = (v: string) => {
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void run(v, gate, document), 250)
  }
  const onGate = (g: '' | ImportGate) => { setGate(g); void run(query, g, document) }
  const onDoc = (d: string) => { setDocument(d); void run(query, gate, d) }

  if (status === 'importing') {
    return (
      <div className="text-center text-forma-muted mt-16">
        <div className="text-4xl mb-3 animate-pulse">📄</div>
        <p className="text-sm">Import du pack documentaire en cours…</p>
        <p className="text-[11px] mt-1 opacity-70">Chargé une seule fois dans votre navigateur (hors ligne ensuite).</p>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="text-center text-forma-muted mt-16">
        <div className="text-4xl mb-3">⚠️</div>
        <p className="text-sm">Pack documentaire indisponible.</p>
      </div>
    )
  }

  const sel = 'text-xs rounded-lg border border-forma-border bg-forma-surface px-2 py-1.5 text-forma-text outline-none focus:border-forma-accent/60'
  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        placeholder="Rechercher dans les documents (PDF sourcés)…"
        className="w-full text-sm border border-forma-border rounded-xl px-3 py-2 bg-forma-bg outline-none focus:border-forma-accent"
        autoComplete="off"
        spellCheck={false}
      />
      <div className="flex flex-wrap items-center gap-2">
        <select className={sel} value={gate} onChange={(e) => onGate(e.target.value as '' | ImportGate)} aria-label="Filtrer par fiabilité">
          <option value="">Toute fiabilité</option>
          <option value="clean">Sourcé</option>
          <option value="review">À vérifier</option>
        </select>
        <select className={sel} value={document} onChange={(e) => onDoc(e.target.value)} aria-label="Filtrer par document">
          <option value="">Tous les documents</option>
          {docs.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="text-xs text-forma-muted ml-auto">{total} résultat{total !== 1 ? 's' : ''}</span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-forma-muted text-center mt-10">Aucun résultat sourcé pour cette recherche.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.slice(0, shown).map((e) => (
              <li key={e.id} className="rounded-xl border border-forma-border bg-forma-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-forma-text">{e.title}</h3>
                  <GateBadge entry={e} />
                </div>
                {e.summary && <p className="text-xs text-forma-muted mt-1 line-clamp-3">{e.summary}</p>}
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <span className="text-[10px] text-forma-accent">{entrySourceLabel(e)}</span>
                  {(e.tags ?? []).slice(0, 4).map((t) => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-md bg-forma-bg border border-forma-border text-forma-muted">{t}</span>
                  ))}
                </div>
                {entryBadges(e).warn && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2">⚠ À vérifier dans la source officielle/applicable.</p>
                )}
              </li>
            ))}
          </ul>
          {shown < total && (
            <div className="text-center pt-1">
              <button type="button" onClick={() => setShown((s) => s + PAGE)} className="text-xs px-4 py-2 rounded-lg border border-forma-border text-forma-text hover:border-forma-accent/50 transition-colors">
                Charger plus ({Math.min(shown, total)} / {total})
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
