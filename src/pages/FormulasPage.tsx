import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { FormulaCalculator } from '../components/tools/FormulaCalculator'
import { FormulaCard } from '../components/tools/FormulaCard'
import { FORMULA_CATEGORIES, getFormulaById, filterFormulas as filterFormulasRaw } from '../lib/formulas/catalog'
import type { FormulaDef } from '../lib/formulas/types'
import { useFormulaPrefsStore } from '../stores/formulaPrefsStore'
import { useToastStore } from '../stores/toastStore'

const filterFormulas = filterFormulasRaw as (opts: {
  categoryId?: string
  search?: string
  favorites?: string[]
}) => FormulaDef[]

const MENU_CATEGORIES = [
  { id: 'favorites', label: 'Favoris', icon: '★' },
  { id: 'recent', label: 'Récents', icon: '🕐' },
  ...FORMULA_CATEGORIES.filter((c) => c.id !== 'all'),
]

export function FormulasPage() {
  const favorites = useFormulaPrefsStore((s) => s.favorites)
  const recent = useFormulaPrefsStore((s) => s.recent)
  const lengthUnit = useFormulaPrefsStore((s) => s.lengthUnit)
  const setLengthUnit = useFormulaPrefsStore((s) => s.setLengthUnit)
  const toggleFavorite = useFormulaPrefsStore((s) => s.toggleFavorite)
  const touchRecent = useFormulaPrefsStore((s) => s.touchRecent)

  const [categoryId, setCategoryId] = useState('structures')
  const [search, setSearch] = useState('')
  const [activeFormulaId, setActiveFormulaId] = useState<string | null>(null)

  const activeFormula = useMemo(
    () => (activeFormulaId ? (getFormulaById(activeFormulaId) as FormulaDef | null) : null),
    [activeFormulaId],
  )

  const listedFormulas = useMemo(() => {
    let list = filterFormulas({
      categoryId: categoryId === 'recent' ? 'all' : categoryId,
      search,
      favorites,
    })
    if (categoryId === 'recent') {
      const order = new Map(recent.map((id, i) => [id, i]))
      list = list.filter((f) => order.has(f.id)).sort((a, b) => (order.get(a.id)! - order.get(b.id)!))
    }
    return list
  }, [categoryId, search, favorites, recent])

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
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une formule…"
              className="flex-1 min-w-[200px] border border-forma-border rounded-lg px-3 py-2 text-sm"
            />
            <span className="text-xs text-forma-muted self-center">
              {listedFormulas.length} formule{listedFormulas.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            <aside className="lg:w-48 shrink-0 flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`whitespace-nowrap text-left px-3 py-2 rounded-xl text-sm ${
                    categoryId === cat.id
                      ? 'bg-forma-accent/15 text-forma-accent font-medium'
                      : 'text-forma-muted hover:bg-white/30'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </aside>

            <div className="flex-1 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {listedFormulas.map((f) => (
                <FormulaCard
                  key={f.id}
                  formula={f}
                  favorite={favorites.includes(f.id)}
                  onOpen={() => {
                    setActiveFormulaId(f.id)
                    touchRecent(f.id)
                  }}
                />
              ))}
              {listedFormulas.length === 0 && (
                <p className="col-span-full text-center text-forma-muted py-12">Aucune formule trouvée</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
