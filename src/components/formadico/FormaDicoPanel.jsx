import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useFormaDicoLookup } from '@/hooks/useFormaDicoLookup'
import useFormaDicoStore from '@/stores/useFormaDicoStore'
import useAppStore from '@/stores/useAppStore'
import { FD_LANGS } from '@/lib/formadico/constants'
import GlassButton from '@/components/ui/GlassButton'

function Section({ title, items, T, schoolMode }) {
  if (!items?.length) return null
  const list = schoolMode ? items.slice(0, 5) : items
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.ink, lineHeight: 1.55 }}>
        {list.map((item, i) => (
          <li key={i} style={{ marginBottom: 4 }}>
            {typeof item === 'string' ? item : (
              <>
                {item.pos && <span style={{ color: T.muted, fontSize: 10, marginRight: 6 }}>{item.pos}</span>}
                {item.text}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function FormaDicoPanel({ T: TProp, compact = false, initialWord = '', onClose }) {
  const { T: themeT } = useTheme()
  const T = TProp || themeT
  const navigate = useNavigate()
  const addNotification = useAppStore((s) => s.addNotification)
  const setPendingTranslationSourceText = useAppStore((s) => s.setPendingTranslationSourceText)

  const lang = useFormaDicoStore((s) => s.lang)
  const schoolMode = useFormaDicoStore((s) => s.schoolMode)
  const favorites = useFormaDicoStore((s) => s.favorites)
  const history = useFormaDicoStore((s) => s.history)
  const setLang = useFormaDicoStore((s) => s.setLang)
  const setSchoolMode = useFormaDicoStore((s) => s.setSchoolMode)
  const toggleFavorite = useFormaDicoStore((s) => s.toggleFavorite)
  const isFavorite = useFormaDicoStore((s) => s.isFavorite)
  const clearHistory = useFormaDicoStore((s) => s.clearHistory)

  const {
    query, setQuery, entry, suggestions, loading, error,
    search, fetchSuggestions,
  } = useFormaDicoLookup(initialWord)

  const fieldStyle = {
    flex: 1, padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 14,
  }

  const handleSubmit = (e) => {
    e?.preventDefault?.()
    search(query)
  }

  const openTranslate = () => {
    if (entry?.word) setPendingTranslationSourceText(entry.word)
    navigate('/translate')
    onClose?.()
  }

  const openAI = () => {
    navigate('/formaai')
    onClose?.()
  }

  const g = entry?.grammar || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: compact ? '100%' : 'auto', minHeight: 0 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); fetchSuggestions(e.target.value) }}
          placeholder="Rechercher un mot…"
          style={{ ...fieldStyle, minWidth: 160 }}
          autoFocus={!compact}
        />
        <select value={lang} onChange={(e) => setLang(e.target.value)} style={{ ...fieldStyle, flex: '0 0 auto', width: 110 }}>
          {FD_LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <GlassButton T={T} onClick={() => search(query)} disabled={loading} style={{ padding: '8px 14px', fontSize: 12 }}>
          {loading ? '…' : 'Chercher'}
        </GlassButton>
      </form>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.muted, cursor: 'pointer' }}>
          <input type="checkbox" checked={schoolMode} onChange={(e) => setSchoolMode(e.target.checked)} />
          Mode scolaire simple
        </label>
        {entry?.fromCache && <span style={{ fontSize: 10, color: T.muted }}>📦 hors ligne</span>}
        {entry?.source && <span style={{ fontSize: 10, color: T.muted }}>Source : {entry.source}</span>}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: '#e94560', padding: 10, borderRadius: 8, background: '#e9456012', marginBottom: 10 }}>
          {error}
        </div>
      )}

      {suggestions.length > 0 && !entry?.found && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 6 }}>Suggestions orthographiques</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {suggestions.map((s) => (
              <button key={s} type="button" onClick={() => { setQuery(s); search(s) }} style={chip(T)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {entry?.found && (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.ink }}>{entry.word}</h2>
            <button type="button" onClick={() => toggleFavorite(entry.word, entry.lang)} style={chip(T)} title="Favori">
              {isFavorite(entry.word, entry.lang) ? '★' : '☆'}
            </button>
            {entry.url && (
              <a href={entry.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: T.accent }}>Wiktionary ↗</a>
            )}
          </div>

          {(g.pos || g.gender || g.plural || g.feminine) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {g.pos && <span style={tag(T)}>{g.pos}</span>}
              {g.gender && <span style={tag(T)}>{g.gender}</span>}
              {g.plural && <span style={tag(T)}>pl. {g.plural}</span>}
              {g.feminine && <span style={tag(T)}>fém. {g.feminine}</span>}
            </div>
          )}

          <Section title="Définitions" items={entry.definitions} T={T} schoolMode={schoolMode} />
          <Section title="Synonymes" items={entry.synonyms} T={T} schoolMode={schoolMode} />
          <Section title="Antonymes" items={entry.antonyms} T={T} schoolMode={schoolMode} />
          <Section title="Expressions & termes" items={entry.expressions} T={T} schoolMode={schoolMode} />
          <Section title="Exemples" items={entry.examples} T={T} schoolMode={schoolMode} />
          <Section title="Conjugaison" items={entry.conjugation} T={T} schoolMode={schoolMode} />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <GlassButton T={T} onClick={openTranslate} style={{ fontSize: 11, padding: '6px 10px' }}>🌐 Traduire</GlassButton>
            <GlassButton T={T} onClick={openAI} style={{ fontSize: 11, padding: '6px 10px' }}>✦ FormaAI</GlassButton>
            <GlassButton T={T} onClick={() => { navigator.clipboard?.writeText(entry.word); addNotification('Mot copié', 'success') }} style={{ fontSize: 11, padding: '6px 10px' }}>Copier</GlassButton>
          </div>
        </div>
      )}

      {!entry?.found && !loading && (
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {favorites.length > 0 && (
            <SideList title="Favoris" items={favorites} T={T} onPick={(w, l) => { setQuery(w); search(w, l) }} />
          )}
          {history.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted }}>Historique</div>
                <button type="button" onClick={clearHistory} style={{ background: 'none', border: 'none', color: T.accent, fontSize: 10, cursor: 'pointer' }}>Effacer</button>
              </div>
              <SideList items={history} T={T} onPick={(w, l) => { setQuery(w); search(w, l) }} />
            </>
          )}
          {!favorites.length && !history.length && (
            <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>
              Dictionnaire libre basé sur Wiktionary. Recherchez un mot, consultez définitions, synonymes, conjugaison et expressions.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function SideList({ title, items, T, onPick }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6 }}>{title}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((it) => (
          <button key={`${it.lang || 'fr'}:${it.word}`} type="button" onClick={() => onPick(it.word, it.lang)} style={chip(T)}>
            {it.word}{it.lang && it.lang !== 'fr' ? ` (${it.lang})` : ''}
          </button>
        ))}
      </div>
    </div>
  )
}

const chip = (T) => ({
  padding: '5px 10px', borderRadius: 999, fontSize: 11, cursor: 'pointer',
  border: `1px solid ${T.border}`, background: T.surface, color: T.ink,
})
const tag = (T) => ({
  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
  background: `${T.accent}18`, color: T.accent, border: `1px solid ${T.accent}33`,
})
