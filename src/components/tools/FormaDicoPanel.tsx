import { useEffect } from 'react'
import { GlassPanel } from '../ui/GlassPanel'
import { GlassButton } from '../ui/GlassButton'
import { FD_LANGS } from '../../lib/formadico/constants'
import { useFormaDicoLookup } from '../../hooks/useFormaDicoLookup'
import { useFormaDicoStore } from '../../stores/formadicoStore'

function Section({ title, items }: { title: string; items?: string[] | { pos?: string; text: string }[] }) {
  if (!items?.length) return null
  return (
    <div className="mb-3">
      <h4 className="text-xs font-bold text-forma-accent uppercase tracking-wide mb-1">{title}</h4>
      <ul className="text-sm text-forma-text space-y-1 list-disc pl-4">
        {items.map((item, i) => (
          <li key={i}>
            {typeof item === 'string' ? (
              item
            ) : (
              <>
                {item.pos && <span className="text-forma-muted text-[10px] mr-1">{item.pos}</span>}
                {item.text}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

interface FormaDicoPanelProps {
  compact?: boolean
  initialWord?: string
  onClose?: () => void
  onOpenTranslate?: (word: string) => void
}

export function FormaDicoPanel({
  compact = false,
  initialWord = '',
  onClose,
  onOpenTranslate,
}: FormaDicoPanelProps) {
  const lang = useFormaDicoStore((s) => s.lang)
  const schoolMode = useFormaDicoStore((s) => s.schoolMode)
  const setLang = useFormaDicoStore((s) => s.setLang)
  const setSchoolMode = useFormaDicoStore((s) => s.setSchoolMode)
  const toggleFavorite = useFormaDicoStore((s) => s.toggleFavorite)
  const isFavorite = useFormaDicoStore((s) => s.isFavorite)
  const favorites = useFormaDicoStore((s) => s.favorites)
  const history = useFormaDicoStore((s) => s.history)
  const clearHistory = useFormaDicoStore((s) => s.clearHistory)

  const { query, setQuery, entry, suggestions, loading, error, search, fetchSuggestions } =
    useFormaDicoLookup(initialWord)

  useEffect(() => {
    const pending = useFormaDicoStore.getState().consumePendingWord()
    if (pending) {
      setQuery(pending)
      void search(pending)
    }
  }, [search, setQuery])

  const defs = schoolMode ? entry?.definitions?.slice(0, 5) : entry?.definitions

  return (
    <div className={`flex flex-col ${compact ? 'h-full min-h-0' : ''}`}>
      <form
        className="flex flex-wrap gap-2 mb-3"
        onSubmit={(e) => {
          e.preventDefault()
          void search(query)
        }}
      >
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            fetchSuggestions(e.target.value)
          }}
          placeholder="Rechercher un mot…"
          className="flex-1 min-w-[140px] border border-forma-border rounded-lg px-3 py-2 text-sm"
          autoFocus={!compact}
        />
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="border border-forma-border rounded-lg px-2 py-2 text-sm"
        >
          {FD_LANGS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
        <GlassButton size="sm" onClick={() => void search(query)} disabled={loading}>
          {loading ? '…' : 'Chercher'}
        </GlassButton>
      </form>

      <div className="flex flex-wrap gap-2 items-center mb-2 text-xs text-forma-muted">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={schoolMode}
            onChange={(e) => setSchoolMode(e.target.checked)}
          />
          Mode scolaire
        </label>
        {entry?.fromCache && <span>📦 cache</span>}
        {entry?.source && <span>Source : {entry.source}</span>}
        {onClose && (
          <button type="button" className="ml-auto text-forma-accent" onClick={onClose}>
            Fermer
          </button>
        )}
      </div>

      {suggestions.length > 0 && !entry?.found && (
        <div className="flex flex-wrap gap-1 mb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="text-xs px-2 py-1 rounded-full bg-forma-accent/10 text-forma-accent"
              onClick={() => {
                setQuery(s)
                void search(s)
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 mb-2">{error}</p>
      )}

      {entry?.found && (
        <GlassPanel variant="surface" className="p-3 flex-1 overflow-y-auto min-h-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg font-bold">{entry.word}</h3>
              {entry.grammar?.pos && (
                <p className="text-xs text-forma-muted">{entry.grammar.pos}</p>
              )}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                className="text-sm"
                onClick={() => toggleFavorite(entry.word)}
                title="Favori"
              >
                {isFavorite(entry.word) ? '★' : '☆'}
              </button>
              {onOpenTranslate && (
                <GlassButton size="sm" onClick={() => onOpenTranslate(entry.word)}>
                  Traduire
                </GlassButton>
              )}
            </div>
          </div>
          <Section title="Définitions" items={defs} />
          {!schoolMode && (
            <>
              <Section title="Synonymes" items={entry.synonyms} />
              <Section title="Antonymes" items={entry.antonyms} />
              <Section title="Expressions" items={entry.expressions} />
            </>
          )}
          {entry.url && (
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-forma-accent hover:underline"
            >
              Voir sur Wiktionary ↗
            </a>
          )}
        </GlassPanel>
      )}

      {(!compact || !entry?.found) && favorites.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-forma-muted mb-1">★ Favoris</div>
          <div className="flex flex-wrap gap-1">
            {favorites.slice(0, compact ? 12 : 60).map((w) => (
              <button
                key={w}
                type="button"
                className="text-xs px-2 py-0.5 rounded-full bg-forma-accent/10 text-forma-accent hover:bg-forma-accent/20"
                onClick={() => {
                  setQuery(w)
                  void search(w)
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>
      )}

      {(!compact || !entry?.found) && history.length > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-forma-muted mb-1">
            <span>Historique</span>
            <button type="button" onClick={clearHistory} className="hover:text-forma-accent">
              Effacer
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {history.slice(0, compact ? 8 : 40).map((h) => (
              <button
                key={`${h.lang}-${h.word}`}
                type="button"
                className="text-xs px-2 py-0.5 rounded bg-white/30 dark:bg-white/5"
                onClick={() => {
                  setQuery(h.word)
                  void search(h.word, h.lang)
                }}
              >
                {h.word}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
