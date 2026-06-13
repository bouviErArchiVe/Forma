/**
 * FormulaModule — Formula V2 : bibliothèque de formules professionnelles,
 * calculatrice scientifique (moteur sûr, sans eval) et convertisseur d'unités.
 *
 * État persisté (page.moduleData) :
 *   { v: 1; favorites: string[]; history: HistoryEntry[] }
 * Favoris = formules étoilées ; historique = 50 derniers calculs de formules.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { getProvider, resolveProviderSettings } from '../../services/ai/providers'
import type { ModuleProps } from '../ModuleHost'
import { CalcError, evaluate } from './calc-engine'
import { FORMULAS, FORMULA_CATEGORIES, getFormula, searchFormulas, type FormulaDef } from './formulas-data'
import { QUANTITIES, convertValue } from './units'

// ─── État persisté ────────────────────────────────────────────────────────────

interface HistoryEntry {
  formulaId: string
  values: Record<string, number>
  result: number
  ts: number
}

interface FormulaModuleState {
  v: 1
  favorites: string[]
  history: HistoryEntry[]
}

const MAX_HISTORY = 50

function parseModuleState(json: string): FormulaModuleState {
  const fallback: FormulaModuleState = { v: 1, favorites: [], history: [] }
  if (!json) return fallback
  try {
    const raw = JSON.parse(json) as Partial<FormulaModuleState>
    return {
      v: 1,
      favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((f) => typeof f === 'string') : [],
      history: Array.isArray(raw.history) ? raw.history.slice(0, MAX_HISTORY) : [],
    }
  } catch {
    return fallback
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseInputNumber(raw: string): number {
  const t = raw.trim().replace(',', '.')
  if (!t) return NaN
  return Number(t)
}

function formatResult(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n !== 0 && (Math.abs(n) >= 1e10 || Math.abs(n) < 1e-6)) return n.toExponential(4)
  return String(Number(n.toFixed(6)))
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('fr-CA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Tab = 'formulas' | 'calculator' | 'converter'

const TABS: { id: Tab; label: string }[] = [
  { id: 'formulas', label: 'Formules' },
  { id: 'calculator', label: 'Calculatrice' },
  { id: 'converter', label: 'Convertisseur' },
]

// ─── Module ───────────────────────────────────────────────────────────────────

export function FormulaModule({ data, onDataChange }: ModuleProps) {
  const [state, setState] = useState<FormulaModuleState>(() => parseModuleState(data))
  const [tab, setTab] = useState<Tab>('formulas')

  const persist = (next: FormulaModuleState) => {
    setState(next)
    onDataChange(JSON.stringify(next))
  }

  const toggleFavorite = (formulaId: string) => {
    const favorites = state.favorites.includes(formulaId)
      ? state.favorites.filter((f) => f !== formulaId)
      : [...state.favorites, formulaId]
    persist({ ...state, favorites })
  }

  const recordHistory = (entry: HistoryEntry) => {
    const last = state.history[0]
    if (
      last &&
      last.formulaId === entry.formulaId &&
      last.result === entry.result &&
      JSON.stringify(last.values) === JSON.stringify(entry.values)
    ) {
      return
    }
    persist({ ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) })
  }

  const clearHistory = () => persist({ ...state, history: [] })

  return (
    <div className="h-full flex flex-col bg-forma-bg">
      {/* Onglets */}
      <div className="shrink-0 flex items-center gap-1 px-3 pt-2 border-b border-forma-border bg-forma-surface">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === t.id
                ? 'border-forma-accent text-forma-accent'
                : 'border-transparent text-forma-muted hover:text-forma-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === 'formulas' && (
          <FormulasTab
            favorites={state.favorites}
            history={state.history}
            onToggleFavorite={toggleFavorite}
            onRecordHistory={recordHistory}
            onClearHistory={clearHistory}
          />
        )}
        {tab === 'calculator' && <CalculatorTab />}
        {tab === 'converter' && <ConverterTab />}
      </div>
    </div>
  )
}

// ─── Onglet Formules ──────────────────────────────────────────────────────────

type CategoryFilter = string | '__favorites__' | '__history__'

function FormulasTab({
  favorites,
  history,
  onToggleFavorite,
  onRecordHistory,
  onClearHistory,
}: {
  favorites: string[]
  history: HistoryEntry[]
  onToggleFavorite: (id: string) => void
  onRecordHistory: (entry: HistoryEntry) => void
  onClearHistory: () => void
}) {
  const [category, setCategory] = useState<CategoryFilter>(FORMULA_CATEGORIES[0])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(FORMULAS[0]?.id ?? null)
  const [presetValues, setPresetValues] = useState<Record<string, number> | null>(null)

  const searching = query.trim().length > 0
  const visibleFormulas = useMemo(() => {
    if (searching) return searchFormulas(query)
    if (category === '__favorites__') return FORMULAS.filter((f) => favorites.includes(f.id))
    return FORMULAS.filter((f) => f.category === category)
  }, [searching, query, category, favorites])

  const selected = selectedId ? getFormula(selectedId) : undefined

  const openHistoryEntry = (entry: HistoryEntry) => {
    if (!getFormula(entry.formulaId)) return
    setSelectedId(entry.formulaId)
    setPresetValues(entry.values)
  }

  return (
    <div className="h-full flex">
      {/* Sidebar catégories */}
      <aside className="w-48 shrink-0 border-r border-forma-border bg-forma-surface flex flex-col">
        <div className="p-2 border-b border-forma-border">
          <div className="relative">
            <Icon name="search" className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-forma-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="w-full text-xs pl-7 pr-2 py-1.5 rounded-lg bg-forma-bg border border-forma-border focus:outline-none focus:border-forma-accent text-forma-text placeholder:text-forma-muted"
            />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <CategoryButton
            active={!searching && category === '__favorites__'}
            label={`Favoris (${favorites.length})`}
            icon="star"
            onClick={() => {
              setQuery('')
              setCategory('__favorites__')
            }}
          />
          {FORMULA_CATEGORIES.map((c) => (
            <CategoryButton
              key={c}
              active={!searching && category === c}
              label={c}
              count={FORMULAS.filter((f) => f.category === c).length}
              onClick={() => {
                setQuery('')
                setCategory(c)
              }}
            />
          ))}
          <CategoryButton
            active={!searching && category === '__history__'}
            label={`Historique (${history.length})`}
            icon="undo"
            onClick={() => {
              setQuery('')
              setCategory('__history__')
            }}
          />
        </nav>
      </aside>

      {/* Liste formules / historique */}
      <div className="w-72 shrink-0 border-r border-forma-border overflow-y-auto">
        {!searching && category === '__history__' ? (
          <HistoryList history={history} onOpen={openHistoryEntry} onClear={onClearHistory} />
        ) : visibleFormulas.length === 0 ? (
          <p className="text-xs text-forma-muted p-4">
            {searching ? 'Aucune formule ne correspond à la recherche.' : 'Aucune formule favorite. Étoilez une formule pour la retrouver ici.'}
          </p>
        ) : (
          <ul className="p-2 space-y-1">
            {visibleFormulas.map((f) => (
              <li key={f.id}>
                <div
                  className={`w-full flex items-start gap-1.5 rounded-lg border px-2.5 py-2 transition-colors ${
                    selectedId === f.id
                      ? 'border-forma-accent bg-forma-accent/5'
                      : 'border-forma-border bg-forma-surface hover:border-forma-accent/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(f.id)
                      setPresetValues(null)
                    }}
                    className="flex-1 text-left min-w-0"
                  >
                    <span className="block text-xs font-medium text-forma-text truncate">{f.name}</span>
                    <span className="block text-[10px] text-forma-muted truncate">
                      {searching ? `${f.category} · ` : ''}
                      {f.description}
                    </span>
                  </button>
                  <button
                    type="button"
                    title={favorites.includes(f.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    onClick={() => onToggleFavorite(f.id)}
                    className={`shrink-0 mt-0.5 ${favorites.includes(f.id) ? 'text-amber-400' : 'text-forma-muted hover:text-amber-400'}`}
                  >
                    <Icon name={favorites.includes(f.id) ? 'star' : 'star-outline'} className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Panneau de calcul */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selected ? (
          <FormulaPanel
            key={selected.id + (presetValues ? `-${JSON.stringify(presetValues)}` : '')}
            formula={selected}
            presetValues={presetValues}
            isFavorite={favorites.includes(selected.id)}
            onToggleFavorite={() => onToggleFavorite(selected.id)}
            onRecordHistory={onRecordHistory}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-forma-muted">
            Sélectionnez une formule
          </div>
        )}
      </div>
    </div>
  )
}

function CategoryButton({
  active,
  label,
  count,
  icon,
  onClick,
}: {
  active: boolean
  label: string
  count?: number
  icon?: 'star' | 'undo'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-1.5 text-left text-xs px-2 py-1.5 rounded-lg transition-colors ${
        active ? 'bg-forma-accent/10 text-forma-accent font-medium' : 'text-forma-text hover:bg-forma-bg'
      }`}
    >
      {icon && <Icon name={icon} className="w-3 h-3 shrink-0" />}
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className="text-[10px] text-forma-muted">{count}</span>}
    </button>
  )
}

function HistoryList({
  history,
  onOpen,
  onClear,
}: {
  history: HistoryEntry[]
  onOpen: (entry: HistoryEntry) => void
  onClear: () => void
}) {
  if (history.length === 0) {
    return <p className="text-xs text-forma-muted p-4">Aucun calcul dans l’historique.</p>
  }
  return (
    <div className="p-2 space-y-1">
      <button
        type="button"
        onClick={onClear}
        className="w-full flex items-center justify-center gap-1 text-[11px] text-forma-muted hover:text-red-500 border border-forma-border rounded-lg py-1.5 transition-colors"
      >
        <Icon name="trash" className="w-3 h-3" />
        Vider l’historique
      </button>
      {history.map((entry, i) => {
        const formula = getFormula(entry.formulaId)
        return (
          <button
            key={`${entry.ts}-${i}`}
            type="button"
            onClick={() => onOpen(entry)}
            className="w-full text-left rounded-lg border border-forma-border bg-forma-surface px-2.5 py-2 hover:border-forma-accent/50 transition-colors"
          >
            <span className="block text-xs font-medium text-forma-text truncate">
              {formula?.name ?? entry.formulaId}
            </span>
            <span className="block text-[10px] text-forma-muted truncate">
              {Object.entries(entry.values)
                .map(([k, v]) => `${k}=${formatResult(v)}`)
                .join(', ')}
              {' → '}
              <span className="text-forma-accent font-medium">
                {formatResult(entry.result)} {formula?.resultUnit ?? ''}
              </span>
            </span>
            <span className="block text-[10px] text-forma-muted">{formatTime(entry.ts)}</span>
          </button>
        )
      })}
    </div>
  )
}

function FormulaPanel({
  formula,
  presetValues,
  isFavorite,
  onToggleFavorite,
  onRecordHistory,
}: {
  formula: FormulaDef
  presetValues: Record<string, number> | null
  isFavorite: boolean
  onToggleFavorite: () => void
  onRecordHistory: (entry: HistoryEntry) => void
}) {
  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const v of formula.variables) {
      init[v.id] = presetValues && Number.isFinite(presetValues[v.id]) ? String(presetValues[v.id]) : ''
    }
    return init
  })
  const [copied, setCopied] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)
  const historyTimerRef = useRef<number | null>(null)

  // Réinitialise l'explication au changement de formule (pattern React :
  // ajustement d'état pendant le rendu, pas dans un effet).
  const [prevFormulaId, setPrevFormulaId] = useState(formula.id)
  if (formula.id !== prevFormulaId) {
    setPrevFormulaId(formula.id)
    setExplanation(null)
  }

  const parsedValues = useMemo(() => {
    const out: Record<string, number> = {}
    for (const v of formula.variables) out[v.id] = parseInputNumber(inputs[v.id] ?? '')
    return out
  }, [formula, inputs])

  const allFilled = formula.variables.every((v) => (inputs[v.id] ?? '').trim() !== '')
  const allValid = formula.variables.every((v) => Number.isFinite(parsedValues[v.id]))

  const computed = useMemo(() => {
    if (!allFilled || !allValid) return null
    const raw = formula.compute(parsedValues)
    const value = typeof raw === 'number' ? raw : raw.value
    const note = typeof raw === 'number' ? undefined : raw.note
    return { value, note }
  }, [formula, parsedValues, allFilled, allValid])

  const invalidResult = computed !== null && !Number.isFinite(computed.value)

  // Enregistre dans l'historique 1 s après la dernière saisie valide
  useEffect(() => {
    if (historyTimerRef.current !== null) window.clearTimeout(historyTimerRef.current)
    if (!computed || invalidResult) return
    historyTimerRef.current = window.setTimeout(() => {
      onRecordHistory({
        formulaId: formula.id,
        values: parsedValues,
        result: computed.value,
        ts: Date.now(),
      })
    }, 1000)
    return () => {
      if (historyTimerRef.current !== null) window.clearTimeout(historyTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [computed?.value, formula.id])

  const copyResult = async () => {
    if (!computed || invalidResult) return
    await navigator.clipboard.writeText(`${formatResult(computed.value)} ${formula.resultUnit}`.trim())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  // ── « Expliquer ce calcul avec FormAI » ─────────────────────────────────────
  // Transmet nom, variables (valeur + unité), résultat et note. Mode local
  // honnête : le provider local explique la démarche sans inventer de normes.
  const explainWithAI = async () => {
    if (!computed || invalidResult) return
    setExplaining(true)
    setExplanation(null)
    try {
      const settings = resolveProviderSettings()
      const provider = getProvider(settings.providerId)
      const varLines = formula.variables
        .map((v) => `- ${v.label} : ${inputs[v.id]} ${v.unit}`)
        .join('\n')
      const userPrompt =
        `Explique ce calcul de façon pédagogique et concise (sans inventer de normes ni de références de code du bâtiment).\n\n`
        + `Formule : ${formula.name}\n${formula.description}\n\n`
        + `Données :\n${varLines}\n\n`
        + `Résultat : ${formatResult(computed.value)} ${formula.resultUnit}`
        + (computed.note ? `\nNote : ${computed.note}` : '')
      const res = await provider.chat({
        messages: [
          {
            role: 'system',
            content:
              'Tu es l’agent Calculs de FormAI (architecture/construction). Explique les calculs étape par étape, en français, unités SI. N’invente JAMAIS de normes ou d’articles de code.',
          },
          { role: 'user', content: userPrompt },
        ],
        settings,
      })
      setExplanation(res.text.trim() !== '' ? res.text : (res.error ?? 'Aucune explication disponible.'))
    } finally {
      setExplaining(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-6">
      <div className="flex items-start gap-2 mb-1">
        <h2 className="flex-1 text-lg font-semibold text-forma-text">{formula.name}</h2>
        <button
          type="button"
          title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={onToggleFavorite}
          className={isFavorite ? 'text-amber-400 mt-1' : 'text-forma-muted hover:text-amber-400 mt-1'}
        >
          <Icon name={isFavorite ? 'star' : 'star-outline'} className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-forma-muted mb-1">{formula.description}</p>
      <p className="text-[11px] text-forma-muted italic mb-5">{formula.example}</p>

      <div className="space-y-3 mb-6">
        {formula.variables.map((v) => (
          <label key={v.id} className="block">
            <span className="block text-xs font-medium text-forma-text mb-1">{v.label}</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={inputs[v.id] ?? ''}
                onChange={(e) => setInputs((prev) => ({ ...prev, [v.id]: e.target.value }))}
                placeholder="0"
                className="flex-1 text-sm px-3 py-2 rounded-lg bg-forma-surface border border-forma-border focus:outline-none focus:border-forma-accent text-forma-text"
              />
              <span className="w-16 text-xs text-forma-muted shrink-0">{v.unit}</span>
            </div>
            {(inputs[v.id] ?? '').trim() !== '' && !Number.isFinite(parsedValues[v.id]) && (
              <span className="text-[10px] text-red-500">Nombre invalide</span>
            )}
          </label>
        ))}
      </div>

      {/* Résultat */}
      <div className="rounded-xl border border-forma-border bg-forma-surface p-4">
        <span className="block text-[10px] uppercase tracking-wide text-forma-muted mb-1">Résultat</span>
        {computed && !invalidResult ? (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-forma-accent tabular-nums">
                {formatResult(computed.value)}
              </span>
              <span className="text-sm text-forma-muted">{formula.resultUnit}</span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => void copyResult()}
                title="Copier le résultat"
                className="inline-flex items-center gap-1 text-xs text-forma-muted hover:text-forma-accent transition-colors"
              >
                <Icon name={copied ? 'check' : 'copy'} className="w-3.5 h-3.5" />
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            {computed.note && <p className="text-xs text-forma-muted mt-2">{computed.note}</p>}
            <div className="mt-3 pt-3 border-t border-forma-border">
              <button
                type="button"
                onClick={() => void explainWithAI()}
                disabled={explaining}
                className="inline-flex items-center gap-1.5 text-xs text-forma-muted hover:text-forma-accent transition-colors disabled:opacity-50"
              >
                <Icon name="sparkles" className="w-3.5 h-3.5" />
                {explaining ? 'Explication…' : 'Expliquer ce calcul avec FormAI'}
              </button>
              {explanation && (
                <p className="text-xs text-forma-text whitespace-pre-wrap leading-relaxed mt-2 p-2.5 rounded-lg bg-forma-bg border border-forma-border">
                  {explanation}
                </p>
              )}
            </div>
          </>
        ) : invalidResult ? (
          <p className="text-sm text-red-500 inline-flex items-center gap-1.5">
            <Icon name="alert" className="w-4 h-4" />
            Entrées hors domaine (vérifiez les valeurs)
          </p>
        ) : (
          <p className="text-sm text-forma-muted">Remplissez les champs pour calculer.</p>
        )}
      </div>
    </div>
  )
}

// ─── Onglet Calculatrice ──────────────────────────────────────────────────────

const BASIC_KEYS: string[][] = [
  ['C', '⌫', '(', ')'],
  ['7', '8', '9', '÷'],
  ['4', '5', '6', '×'],
  ['1', '2', '3', '−'],
  ['0', '.', '%', '+'],
]

const SCI_KEYS: string[][] = [
  ['sin(', 'cos(', 'tan(', '^'],
  ['√(', 'log(', 'ln(', 'π'],
  ['asin(', 'acos(', 'atan(', 'e'],
]

function CalculatorTab() {
  const [expr, setExpr] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scientific, setScientific] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const compute = () => {
    setError(null)
    try {
      const value = evaluate(expr)
      const formatted = formatResult(value)
      setResult(formatted)
      setExpr(formatted)
    } catch (e) {
      setResult(null)
      setError(e instanceof CalcError ? e.message : 'Expression invalide')
    }
  }

  const press = (key: string) => {
    setError(null)
    if (key === 'C') {
      setExpr('')
      setResult(null)
    } else if (key === '⌫') {
      setExpr((prev) => prev.slice(0, -1))
    } else {
      setExpr((prev) => prev + key)
    }
    inputRef.current?.focus()
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-sm mx-auto px-4 py-6">
        {/* Écran */}
        <div className="rounded-xl border border-forma-border bg-forma-surface p-3 mb-3">
          <input
            ref={inputRef}
            type="text"
            value={expr}
            onChange={(e) => {
              setExpr(e.target.value)
              setError(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') compute()
            }}
            placeholder="0"
            aria-label="Expression"
            className="w-full bg-transparent text-right text-2xl font-mono text-forma-text focus:outline-none placeholder:text-forma-muted"
          />
          <div className="h-5 text-right">
            {error ? (
              <span className="text-xs text-red-500">{error}</span>
            ) : result !== null ? (
              <span className="text-xs text-forma-muted">= {result}</span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setScientific((s) => !s)}
          className="mb-3 text-xs text-forma-muted hover:text-forma-accent inline-flex items-center gap-1 transition-colors"
        >
          <Icon name={scientific ? 'chevron-up' : 'chevron-down'} className="w-3 h-3" />
          {scientific ? 'Masquer le mode scientifique' : 'Mode scientifique'}
        </button>

        {scientific && (
          <div className="grid grid-cols-4 gap-1.5 mb-1.5">
            {SCI_KEYS.flat().map((k) => (
              <CalcKey key={k} label={k.endsWith('(') ? k.slice(0, -1) : k} onClick={() => press(k)} variant="sci" />
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-1.5">
          {BASIC_KEYS.flat().map((k) => (
            <CalcKey
              key={k}
              label={k}
              onClick={() => press(k)}
              variant={['÷', '×', '−', '+', '%'].includes(k) ? 'op' : k === 'C' || k === '⌫' ? 'danger' : 'num'}
            />
          ))}
          <button
            type="button"
            onClick={compute}
            className="col-span-4 py-2.5 rounded-lg bg-forma-accent text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            =
          </button>
        </div>

        <p className="text-[10px] text-forma-muted mt-3">
          Saisie clavier acceptée (Entrée = calculer). Fonctions trigonométriques en degrés.
        </p>
      </div>
    </div>
  )
}

function CalcKey({
  label,
  onClick,
  variant,
}: {
  label: string
  onClick: () => void
  variant: 'num' | 'op' | 'sci' | 'danger'
}) {
  const styles: Record<string, string> = {
    num: 'bg-forma-surface border-forma-border text-forma-text hover:border-forma-accent/50',
    op: 'bg-forma-accent/10 border-forma-accent/20 text-forma-accent hover:bg-forma-accent/20',
    sci: 'bg-forma-surface border-forma-border text-forma-muted hover:text-forma-accent hover:border-forma-accent/50 text-xs',
    danger: 'bg-forma-surface border-forma-border text-red-500 hover:border-red-300',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${styles[variant]}`}
    >
      {label}
    </button>
  )
}

// ─── Onglet Convertisseur ─────────────────────────────────────────────────────

function ConverterTab() {
  const [quantityId, setQuantityId] = useState(QUANTITIES[0].id)
  const [rawValue, setRawValue] = useState('1')
  const quantity = QUANTITIES.find((q) => q.id === quantityId) ?? QUANTITIES[0]
  const [fromId, setFromId] = useState(quantity.units[0].id)
  const [toId, setToId] = useState(quantity.units[1]?.id ?? quantity.units[0].id)

  const changeQuantity = (id: string) => {
    const q = QUANTITIES.find((x) => x.id === id) ?? QUANTITIES[0]
    setQuantityId(q.id)
    setFromId(q.units[0].id)
    setToId(q.units[1]?.id ?? q.units[0].id)
  }

  const swap = () => {
    setFromId(toId)
    setToId(fromId)
  }

  const value = parseInputNumber(rawValue)
  let result: number | null = null
  let convError: string | null = null
  if (rawValue.trim() !== '') {
    if (!Number.isFinite(value)) {
      convError = 'Nombre invalide'
    } else {
      try {
        result = convertValue(quantity.id, value, fromId, toId)
      } catch (e) {
        convError = e instanceof Error ? e.message : 'Conversion impossible'
      }
    }
  }

  const fromUnit = quantity.units.find((u) => u.id === fromId)
  const toUnit = quantity.units.find((u) => u.id === toId)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
        <label className="block">
          <span className="block text-xs font-medium text-forma-text mb-1">Grandeur</span>
          <select
            value={quantityId}
            onChange={(e) => changeQuantity(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg bg-forma-surface border border-forma-border focus:outline-none focus:border-forma-accent text-forma-text"
          >
            {QUANTITIES.map((q) => (
              <option key={q.id} value={q.id}>
                {q.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-xs font-medium text-forma-text mb-1">Valeur</span>
          <input
            type="text"
            inputMode="decimal"
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
            placeholder="0"
            className="w-full text-sm px-3 py-2 rounded-lg bg-forma-surface border border-forma-border focus:outline-none focus:border-forma-accent text-forma-text"
          />
        </label>

        <div className="flex items-end gap-2">
          <label className="flex-1 block">
            <span className="block text-xs font-medium text-forma-text mb-1">De</span>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg bg-forma-surface border border-forma-border focus:outline-none focus:border-forma-accent text-forma-text"
            >
              {quantity.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={swap}
            title="Inverser les unités"
            className="shrink-0 w-9 h-9 rounded-lg border border-forma-border bg-forma-surface text-forma-muted hover:text-forma-accent hover:border-forma-accent/50 transition-colors text-sm"
          >
            ⇄
          </button>
          <label className="flex-1 block">
            <span className="block text-xs font-medium text-forma-text mb-1">Vers</span>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg bg-forma-surface border border-forma-border focus:outline-none focus:border-forma-accent text-forma-text"
            >
              {quantity.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="rounded-xl border border-forma-border bg-forma-surface p-4">
          <span className="block text-[10px] uppercase tracking-wide text-forma-muted mb-1">Résultat</span>
          {convError ? (
            <p className="text-sm text-red-500 inline-flex items-center gap-1.5">
              <Icon name="alert" className="w-4 h-4" />
              {convError}
            </p>
          ) : result !== null ? (
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-forma-accent tabular-nums">{formatResult(result)}</span>
              <span className="text-sm text-forma-muted">{toUnit?.label.match(/\(([^)]+)\)/)?.[1] ?? ''}</span>
            </div>
          ) : (
            <p className="text-sm text-forma-muted">Entrez une valeur à convertir.</p>
          )}
          {result !== null && fromUnit && toUnit && (
            <p className="text-xs text-forma-muted mt-2">
              {rawValue.trim()} {fromUnit.label.match(/\(([^)]+)\)/)?.[1] ?? fromUnit.label} ={' '}
              {formatResult(result)} {toUnit.label.match(/\(([^)]+)\)/)?.[1] ?? toUnit.label}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
