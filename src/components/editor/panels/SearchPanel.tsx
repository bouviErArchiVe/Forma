import { useCallback, useEffect, useState } from 'react'
import { searchNotebookPages, type DocumentSearchHit } from '../../../lib/search'
import { getPages } from '../../../services/pages'

interface SearchPanelProps {
  notebookId: string
  pageId: string
  onSelectPage?: (pageId: string) => void
  onHighlight?: (hit: DocumentSearchHit | null) => void
}

export function SearchPanel({ notebookId, pageId, onSelectPage, onHighlight }: SearchPanelProps) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<DocumentSearchHit[]>([])
  const [cursor, setCursor] = useState(0)

  const runSearch = useCallback(async () => {
    const query = q.trim()
    if (!query) {
      setHits([])
      setCursor(0)
      onHighlight?.(null)
      return
    }
    const pages = await getPages(notebookId)
    const results = searchNotebookPages(pages, query)
    setHits(results)
    setCursor(0)
    onHighlight?.(results[0] ?? null)
  }, [q, notebookId, onHighlight])

  useEffect(() => {
    const t = setTimeout(() => void runSearch(), 320)
    return () => clearTimeout(t)
  }, [runSearch])

  const goHit = (idx: number) => {
    if (!hits.length) return
    const i = ((idx % hits.length) + hits.length) % hits.length
    setCursor(i)
    const h = hits[i]
    onHighlight?.(h)
    if (h.pageId !== pageId) onSelectPage?.(h.pageId)
  }

  return (
    <div>
      <h3 className="font-medium text-sm mb-2">Recherche dans le document</h3>
      <div className="flex gap-1 mb-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQ('')
              onHighlight?.(null)
            }
          }}
          placeholder="Mot-clé…"
          className="forma-input flex-1"
        />
        {q.trim() && (
          <button
            type="button"
            className="text-xs px-2 border rounded hover:bg-gray-50"
            onClick={() => {
              setQ('')
              onHighlight?.(null)
            }}
          >
            Effacer
          </button>
        )}
      </div>
      {hits.length > 0 && (
        <div className="flex gap-1 mb-2">
          <button
            type="button"
            onClick={() => goHit(cursor - 1)}
            className="flex-1 text-xs py-1 border rounded hover:bg-gray-50"
          >
            ‹ Préc.
          </button>
          <span className="text-xs text-forma-muted self-center px-1">
            {cursor + 1}/{hits.length}
          </span>
          <button
            type="button"
            onClick={() => goHit(cursor + 1)}
            className="flex-1 text-xs py-1 border rounded hover:bg-gray-50"
          >
            Suiv. ›
          </button>
        </div>
      )}
      <ul className="text-xs space-y-2 max-h-64 overflow-y-auto">
        {hits.map((h, i) => (
          <li key={`${h.pageId}-${i}`}>
            <button
              type="button"
              className={`w-full text-left p-2 rounded border ${
                i === cursor
                  ? 'border-forma-accent bg-forma-accent/10'
                  : h.pageId === pageId
                    ? 'border-forma-accent/40 bg-forma-accent/5'
                    : 'border-transparent bg-gray-50 hover:border-forma-border'
              }`}
              onClick={() => goHit(i)}
            >
              <span className="text-forma-muted">
                p.{h.pageIndex}
                {h.source === 'pdf' ? ' · PDF' : h.source === 'ink' ? ' · Encre' : ''}
              </span>{' '}
              — {h.snippet}
            </button>
          </li>
        ))}
        {q.trim() && hits.length === 0 && <li className="text-forma-muted">Aucun résultat</li>}
      </ul>
    </div>
  )
}
