import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchAll } from '@/lib/formaai/search/search'
import { invalidateSearchIndex } from '@/lib/formaai/search/indexer'
import { SEARCH_SOURCES, FAI_DARK, SEARCH_DEBOUNCE_MS } from '@/lib/formaai/constants'
import HighlightText from './HighlightText'

const SOURCE_ICONS = {
  library: '📓', notebook: '📝', doc: '📄', sheet: '📊', proforma: '✏',
  folder: '📁', asset: '📎', formula: '📐', combine: '📎', present: '📽', review: '💬',
}

export default function GlobalSearchModal({ open, onClose }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [results, setResults] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    if (open) {
      invalidateSearchIndex()
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setActiveIdx(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setResults(searchAll(query, { sourceFilter, limit: 40 }))
      setActiveIdx(0)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [query, sourceFilter, open])

  const goTo = useCallback((item) => {
    if (!item?.route) return
    onClose()
    const q = encodeURIComponent(query)
    navigate(`${item.route}${item.route.includes('?') ? '&' : '?'}q=${q}`)
  }, [navigate, onClose, query])

  const handleKey = (e) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(results.length - 1, i + 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(0, i - 1)); return }
    if (e.key === 'Enter' && results[activeIdx]) { e.preventDefault(); goTo(results[activeIdx]); return }
    if (e.key === 'F3' || (e.key === 'g' && e.ctrlKey)) {
      e.preventDefault()
      setActiveIdx((i) => (e.shiftKey ? Math.max(0, i - 1) : Math.min(results.length - 1, i + 1)))
    }
  }

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 4000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '12vh',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(640px, 94vw)', maxHeight: '70vh', background: FAI_DARK.panel,
          borderRadius: 14, border: `1px solid ${FAI_DARK.border}`,
          boxShadow: '0 20px 60px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${FAI_DARK.border}` }}>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder='Rechercher : "gypse type X", "mur coupe-feu", "CNB 3.2.2"…'
            style={{
              width: '100%', boxSizing: 'border-box', background: 'transparent', border: 'none',
              color: FAI_DARK.ink, fontSize: 16, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
            {Object.values(SEARCH_SOURCES).slice(0, 8).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSourceFilter(s.id)}
                style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 10, cursor: 'pointer',
                  border: `1px solid ${sourceFilter === s.id ? FAI_DARK.accent : FAI_DARK.border}`,
                  background: sourceFilter === s.id ? `${FAI_DARK.accent}44` : 'transparent',
                  color: sourceFilter === s.id ? FAI_DARK.accent2 : FAI_DARK.muted,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
          {!query.trim() && (
            <p style={{ color: FAI_DARK.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>
              Recherche dans carnets, PDF, FormaDoc, FormaTab, dossiers, formules, normes…
              <br />
              <span style={{ fontSize: 11 }}>↑↓ naviguer · Entrée ouvrir · Échap fermer · Ctrl+G suivant</span>
            </p>
          )}
          {query.trim() && results.length === 0 && (
            <p style={{ color: FAI_DARK.muted, fontSize: 13, textAlign: 'center', padding: 24 }}>
              Aucun résultat pour « {query} »
            </p>
          )}
          {results.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(item)}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                marginBottom: 4, borderRadius: 8, cursor: 'pointer',
                background: idx === activeIdx ? `${FAI_DARK.accent}22` : FAI_DARK.surface,
                border: `1px solid ${idx === activeIdx ? FAI_DARK.accent : FAI_DARK.border}`,
                color: FAI_DARK.ink,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span>{SOURCE_ICONS[item.type] || '📄'}</span>
                <strong style={{ fontSize: 13, flex: 1 }}>
                  <HighlightText text={item.title} query={query} />
                </strong>
                <span style={{ fontSize: 10, color: FAI_DARK.muted }}>{SEARCH_SOURCES[item.source]?.label || item.type}</span>
              </div>
              <div style={{ fontSize: 11, color: FAI_DARK.muted, lineHeight: 1.4 }}>
                <HighlightText text={item.snippet} query={query} />
              </div>
            </button>
          ))}
        </div>

        {results.length > 0 && (
          <div style={{
            padding: '8px 16px', borderTop: `1px solid ${FAI_DARK.border}`,
            fontSize: 11, color: FAI_DARK.muted, display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{results.length} résultat(s) · {activeIdx + 1}/{results.length}</span>
            <span>Ctrl+G suivant · Shift+Ctrl+G précédent</span>
          </div>
        )}
      </div>
    </div>
  )
}
