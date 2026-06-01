import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { FormulaCalculator } from '../components/tools/FormulaCalculator'
import { FormulaCard } from '../components/tools/FormulaCard'
import { FormulaDocInsertModal } from '../components/tools/FormulaDocInsertModal'
import { FORMULA_CATEGORIES, getFormulaById, filterFormulas } from '../lib/formulas/catalog'
import { formatHistoryEntry, downloadHistoryReport } from '../lib/formulas/history-export'
import { appendCalculationToDocument, formatCalculationHtml } from '../lib/formulas/to-doc'
import type { FormulaResult } from '../lib/formulas/types'
import { formatRelativeTime } from '../lib/format-relative'
import { saveDocument, FORMA_DOC_OPEN_ID_KEY } from '../services/formadoc'
import { useFormulaHistoryStore } from '../stores/formulaHistoryStore'
import { useFormulaPrefsStore } from '../stores/formulaPrefsStore'
import { useToastStore } from '../stores/toastStore'
import type { FormaDocument } from '../types'

const MENU_CATEGORIES = [
  { id: 'favorites', label: 'Favoris', icon: '★' },
  { id: 'recent', label: 'Récents', icon: '🕐' },
  { id: 'history', label: 'Historique', icon: '🧮' },
  ...FORMULA_CATEGORIES.filter((c) => c.id !== 'all'),
]

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  FORMULA_CATEGORIES.map((c) => [c.id, c.label]),
)

export function FormulasPage() {
  const navigate = useNavigate()
  const favorites = useFormulaPrefsStore((s) => s.favorites)
  const recent = useFormulaPrefsStore((s) => s.recent)
  const lengthUnit = useFormulaPrefsStore((s) => s.lengthUnit)
  const setLengthUnit = useFormulaPrefsStore((s) => s.setLengthUnit)
  const toggleFavorite = useFormulaPrefsStore((s) => s.toggleFavorite)
  const touchRecent = useFormulaPrefsStore((s) => s.touchRecent)

  const history = useFormulaHistoryStore((s) => s.entries)
  const addHistoryEntry = useFormulaHistoryStore((s) => s.addEntry)
  const removeHistoryEntry = useFormulaHistoryStore((s) => s.removeEntry)
  const clearHistory = useFormulaHistoryStore((s) => s.clear)

  const [categoryId, setCategoryId] = useState('structures')
  const [search, setSearch] = useState('')
  const [activeFormulaId, setActiveFormulaId] = useState<string | null>(null)
  const [restore, setRestore] = useState<{ mode?: string; values: Record<string, string> } | null>(null)
  const [docInsertOpen, setDocInsertOpen] = useState(false)
  const [pendingDocInsert, setPendingDocInsert] = useState<{
    mode: string
    values: Record<string, string>
    result: FormulaResult
    fieldLabels: Record<string, string>
  } | null>(null)

  const activeFormula = useMemo(
    () => (activeFormulaId ? getFormulaById(activeFormulaId) : null),
    [activeFormulaId],
  )

  const openFormula = (id: string, restoreState: { mode?: string; values: Record<string, string> } | null = null) => {
    setRestore(restoreState)
    setActiveFormulaId(id)
    touchRecent(id)
  }

  const searching = search.trim().length > 0

  const listedFormulas = useMemo(() => {
    // A non-empty query searches the whole catalog, regardless of the selected category.
    const effectiveCategory = searching || categoryId === 'recent' ? 'all' : categoryId
    let list = filterFormulas({ categoryId: effectiveCategory, search, favorites })
    if (!searching && categoryId === 'recent') {
      const order = new Map(recent.map((id, i) => [id, i]))
      list = list.filter((f) => order.has(f.id)).sort((a, b) => (order.get(a.id)! - order.get(b.id)!))
    }
    return list
  }, [searching, categoryId, search, favorites, recent])

  return (
    <div className="min-h-full flex flex-col max-w-6xl mx-auto w-full p-4">
      <header className="flex flex-wrap items-center gap-3 mb-6 forma-glass-header rounded-xl px-4 py-3">
        <BrandLogo size="sm" subtitle="Formules architecture" />
        <div className="flex-1" />
        <Link to="/" className="text-sm text-forma-accent hover:underline">
          ← Bibliothèque
        </Link>
      </header>

      {activeFormula ? (
        <FormulaCalculator
          formula={activeFormula}
          lengthUnit={lengthUnit}
          onLengthUnitChange={setLengthUnit}
          favorite={favorites.includes(activeFormula.id)}
          onToggleFavorite={() => toggleFavorite(activeFormula.id)}
          onBack={() => setActiveFormulaId(null)}
          onCopy={(text) => {
            void navigator.clipboard.writeText(text)
            useToastStore.getState().show('Résultat copié')
          }}
          initialMode={restore?.mode}
          initialValues={restore?.values}
          onSaveCalculation={({ mode, values, result }) => {
            addHistoryEntry({
              formulaId: activeFormula.id,
              title: activeFormula.title,
              mode,
              values,
              summary: result.summary || activeFormula.title,
            })
            useToastStore.getState().show('Calcul conservé')
          }}
          onInsertToDoc={(payload) => {
            setPendingDocInsert(payload)
            setDocInsertOpen(true)
          }}
        />
      ) : (
        <>
          {categoryId !== 'history' && (
            <div className="flex flex-wrap gap-2 mb-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher une formule…"
                className="flex-1 min-w-[200px] border border-forma-border rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-xs text-forma-muted self-center">
                {searching
                  ? `${listedFormulas.length} résultat${listedFormulas.length !== 1 ? 's' : ''} dans toutes les catégories`
                  : `${listedFormulas.length} formule${listedFormulas.length !== 1 ? 's' : ''}`}
              </span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            <aside className="lg:w-48 shrink-0 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id)
                    setSearch('')
                  }}
                  className={`whitespace-nowrap text-left px-3 py-2 rounded-xl text-sm ${
                    !searching && categoryId === cat.id
                      ? 'bg-forma-accent/15 text-forma-accent font-medium'
                      : 'text-forma-muted hover:bg-white/30'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </aside>

            {categoryId === 'history' ? (
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-forma-muted uppercase">
                    Historique de calculs ({history.length})
                  </h2>
                  {history.length > 0 && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => downloadHistoryReport(history)}
                        className="text-xs text-forma-accent hover:underline"
                      >
                        Exporter (.txt)
                      </button>
                      <button
                        type="button"
                        onClick={clearHistory}
                        className="text-xs text-forma-muted hover:text-red-600"
                      >
                        Tout effacer
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  {history.map((entry) => {
                    const exists = Boolean(getFormulaById(entry.formulaId))
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-2 p-3 rounded-xl forma-glass-card"
                      >
                        <button
                          type="button"
                          disabled={!exists}
                          onClick={() => openFormula(entry.formulaId, { mode: entry.mode, values: entry.values })}
                          className="flex-1 min-w-0 text-left disabled:opacity-50"
                          title={exists ? 'Rouvrir avec ces valeurs' : 'Formule indisponible'}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{entry.title}</span>
                            <span className="text-[10px] text-forma-muted shrink-0">
                              {formatRelativeTime(entry.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-forma-accent/80 mt-1 truncate">{entry.summary}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(formatHistoryEntry(entry))
                            useToastStore.getState().show('Calcul copié')
                          }}
                          className="text-xs text-forma-muted hover:text-forma-accent px-1"
                          title="Copier le calcul"
                          aria-label="Copier le calcul"
                        >
                          ⎘
                        </button>
                        <button
                          type="button"
                          onClick={() => removeHistoryEntry(entry.id)}
                          className="text-forma-muted hover:text-red-600 px-1 leading-none"
                          aria-label="Supprimer de l'historique"
                          title="Supprimer"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                  {history.length === 0 && (
                    <p className="text-center text-forma-muted py-12">
                      Aucun calcul conservé. Ouvrez une formule et utilisez « Conserver le calcul ».
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {listedFormulas.map((f) => (
                  <FormulaCard
                    key={f.id}
                    formula={f}
                    favorite={favorites.includes(f.id)}
                    onOpen={() => openFormula(f.id)}
                    categoryLabel={searching ? CATEGORY_LABELS[f.categoryId] : undefined}
                  />
                ))}
                {listedFormulas.length === 0 && (
                  <p className="col-span-full text-center text-forma-muted py-12">Aucune formule trouvée</p>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {activeFormula && (
        <FormulaDocInsertModal
          open={docInsertOpen}
          onClose={() => {
            setDocInsertOpen(false)
            setPendingDocInsert(null)
          }}
          onSelect={async (doc: FormaDocument) => {
            if (!pendingDocInsert) return
            const html = formatCalculationHtml({
              title: activeFormula.title,
              formulaText: activeFormula.formulaText,
              values: pendingDocInsert.values,
              fieldLabels: pendingDocInsert.fieldLabels,
              result: pendingDocInsert.result,
            })
            const updated = appendCalculationToDocument(doc, html)
            await saveDocument(updated)
            sessionStorage.setItem(FORMA_DOC_OPEN_ID_KEY, doc.id)
            useToastStore.getState().show(`Calcul inséré dans « ${doc.name} »`)
            setPendingDocInsert(null)
            navigate('/formadoc')
          }}
        />
      )}
    </div>
  )
}
