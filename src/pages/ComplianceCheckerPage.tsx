/**
 * ComplianceCheckerPage — vérificateur de conformité INDICATIF (/compliance).
 *
 * L'utilisateur choisit une vérification, saisit ses valeurs, ajuste au besoin
 * les valeurs de référence (paramétrables, persistées), et obtient un statut
 * indicatif (conforme / non conforme / à vérifier). Aucun article officiel
 * n'est cité ni inventé ; l'avertissement est affiché en permanence.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { getProvider, resolveProviderSettings } from '../services/ai/providers'
import {
  COMPLIANCE_CATEGORY_LABELS,
  COMPLIANCE_CHECKS,
  COMPLIANCE_DISCLAIMER,
  complianceCategories,
  defaultParams,
  searchChecks,
  type ComplianceCheck,
  type ComplianceStatus,
} from '../lib/compliance/checks'
import { effectiveParams, useComplianceParamsStore } from '../stores/complianceParamsStore'

const STATUS_META: Record<ComplianceStatus, { label: string; cls: string; icon: 'check' | 'alert' | 'help' }> = {
  conforme: { label: 'Conforme (indicatif)', cls: 'text-green-600 dark:text-green-400 border-green-400/50 bg-green-50 dark:bg-green-950/20', icon: 'check' },
  'non-conforme': { label: 'Non conforme (indicatif)', cls: 'text-red-500 border-red-400/50 bg-red-50 dark:bg-red-950/20', icon: 'alert' },
  'a-verifier': { label: 'À vérifier', cls: 'text-amber-600 dark:text-amber-400 border-amber-400/50 bg-amber-50 dark:bg-amber-950/20', icon: 'help' },
}

export function ComplianceCheckerPage() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>(COMPLIANCE_CHECKS[0]?.id ?? '')

  const visible = useMemo(() => searchChecks(search), [search])
  const selected = COMPLIANCE_CHECKS.find((c) => c.id === selectedId) ?? null

  return (
    <div className="min-h-full p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors">
          <Icon name="chevron-left" className="w-4 h-4" />
          Tableau de bord
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-forma-text inline-flex items-center gap-2 mb-1">
        <Icon name="check" className="w-5 h-5 text-forma-accent" />
        Vérificateur de conformité
      </h1>
      <p className="text-xs text-forma-muted mb-4">Outil indicatif — escaliers, garde-corps, rampes, issues, portes, stationnement, occupation. Les valeurs de référence sont paramétrables.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
        {/* Liste des vérifications */}
        <div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une vérification…" className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent mb-2" />
          {complianceCategories().map((cat) => {
            const items = visible.filter((c) => c.category === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} className="mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1">{COMPLIANCE_CATEGORY_LABELS[cat]}</p>
                <div className="space-y-1">
                  {items.map((c) => (
                    <button key={c.id} type="button" onClick={() => setSelectedId(c.id)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedId === c.id ? 'bg-forma-accent/10 text-forma-accent' : 'text-forma-text hover:bg-forma-bg'}`}>
                      <span className="block font-medium truncate">{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {visible.length === 0 && <p className="text-[11px] text-forma-muted text-center py-4">Aucune vérification</p>}
        </div>

        {/* Panneau de vérification */}
        <div>
          {selected ? (
            <CheckPanel check={selected} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <Icon name="check" className="w-8 h-8 text-forma-muted mb-2" />
              <p className="text-sm text-forma-muted max-w-sm">Sélectionnez une vérification.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckPanel({ check }: { check: ComplianceCheck }) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [showParams, setShowParams] = useState(false)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  const overrides = useComplianceParamsStore((s) => s.overrides)
  const setOverride = useComplianceParamsStore((s) => s.set)
  const resetOverrides = useComplianceParamsStore((s) => s.reset)

  // Réinitialise inputs/explication au changement de vérification.
  const [prevId, setPrevId] = useState(check.id)
  if (check.id !== prevId) {
    setPrevId(check.id)
    setInputs({})
    setExplanation(null)
    setShowParams(false)
  }

  const defaults = useMemo(() => defaultParams(check), [check])
  const params = useMemo(() => effectiveParams(check.id, defaults, overrides), [check.id, defaults, overrides])

  const values = useMemo(() => {
    const out: Record<string, number> = {}
    for (const f of check.fields) {
      const raw = (inputs[f.id] ?? '').trim().replace(',', '.')
      out[f.id] = raw === '' ? NaN : Number(raw)
    }
    return out
  }, [check, inputs])

  const result = useMemo(() => check.evaluate(values, params), [check, values, params])
  const meta = STATUS_META[result.status]

  const settings = resolveProviderSettings()
  const cloudReady = settings.providerId !== 'local' && settings.providerId !== 'mock'

  const explain = async () => {
    setExplaining(true)
    setExplanation(null)
    try {
      const provider = getProvider(settings.providerId)
      const detailLines = result.details.map((d) => `- ${d.label} : ${d.note} (${d.ok === null ? 'à renseigner' : d.ok ? 'ok' : 'écart'})`).join('\n')
      const res = await provider.chat({
        messages: [
          {
            role: 'system',
            content:
              'Tu es l’agent Conformité de FormAI. Explique un résultat de vérification INDICATIVE sans JAMAIS citer ni inventer d’article officiel ni de valeur réglementaire. Reste sur les principes et les points à vérifier. Rappelle systématiquement de vérifier le texte officiel applicable.',
          },
          { role: 'user', content: `Vérification : « ${check.name} » — ${check.description}\nStatut indicatif : ${result.status}\nCritères :\n${detailLines}\n\nExplique ce que signifie ce résultat et les points à vérifier.` },
        ],
        settings,
      })
      setExplanation(res.text.trim() !== '' ? res.text : (res.error ?? 'Aucune explication.'))
    } finally {
      setExplaining(false)
    }
  }

  const fieldCls = 'w-full text-sm px-3 py-2 rounded-lg bg-forma-surface border border-forma-border focus:outline-none focus:border-forma-accent text-forma-text'

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-forma-text">{check.name}</h2>
      <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-2">{COMPLIANCE_CATEGORY_LABELS[check.category]}</p>
      <p className="text-sm text-forma-text leading-relaxed mb-4">{check.description}</p>

      {/* Entrées */}
      <div className="space-y-3 mb-4">
        {check.fields.map((f) => (
          <label key={f.id} className="block">
            <span className="block text-xs font-medium text-forma-text mb-1">{f.label}</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={inputs[f.id] ?? ''}
                onChange={(e) => setInputs((prev) => ({ ...prev, [f.id]: e.target.value }))}
                placeholder="0"
                className={`flex-1 ${fieldCls}`}
              />
              <span className="w-20 text-xs text-forma-muted shrink-0">{f.unit}</span>
            </div>
          </label>
        ))}
      </div>

      {/* Valeurs de référence paramétrables */}
      <div className="mb-4">
        <button type="button" onClick={() => setShowParams((s) => !s)} className="text-xs text-forma-muted hover:text-forma-accent inline-flex items-center gap-1 transition-colors">
          <Icon name={showParams ? 'chevron-up' : 'chevron-down'} className="w-3 h-3" />
          Valeurs de référence (paramétrables)
        </button>
        {showParams && (
          <div className="mt-2 p-3 rounded-lg border border-forma-border bg-forma-surface">
            <p className="text-[10px] text-forma-muted mb-2">Valeurs indicatives par défaut — ajustez-les selon le code applicable. Vos modifications sont conservées.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {check.params.map((p) => (
                <label key={p.id} className="block text-xs">
                  <span className="text-forma-muted">{p.label} ({p.unit})</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={String(params[p.id])}
                    onChange={(e) => {
                      const n = Number(e.target.value.trim().replace(',', '.'))
                      if (Number.isFinite(n)) setOverride(check.id, p.id, n)
                    }}
                    className={`mt-0.5 ${fieldCls}`}
                  />
                </label>
              ))}
            </div>
            <button type="button" onClick={() => resetOverrides(check.id, check.params.map((p) => p.id))} className="mt-2 text-[11px] text-forma-muted hover:text-forma-accent inline-flex items-center gap-1">
              <Icon name="undo" className="w-3 h-3" />
              Réinitialiser les valeurs par défaut
            </button>
          </div>
        )}
      </div>

      {/* Résultat */}
      <div className={`rounded-xl border p-4 mb-3 ${meta.cls}`}>
        <div className="flex items-center gap-2 mb-1">
          <Icon name={meta.icon} className="w-4 h-4 shrink-0" />
          <span className="text-sm font-semibold">{meta.label}</span>
        </div>
        <p className="text-xs mb-2">{result.message}</p>
        <ul className="space-y-1">
          {result.details.map((d) => (
            <li key={d.label} className="text-[11px] flex items-start gap-1.5">
              <span className="shrink-0 mt-px">{d.ok === null ? '•' : d.ok ? '✓' : '✗'}</span>
              <span><span className="font-medium">{d.label} :</span> {d.note}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Avertissement permanent */}
      <div className="p-2.5 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-start gap-1.5 mb-3">
        <Icon name="alert" className="w-3.5 h-3.5 shrink-0 mt-px" />
        {COMPLIANCE_DISCLAIMER}
      </div>

      {/* FormAI (optionnel, cloud) */}
      {cloudReady ? (
        <div>
          <button type="button" disabled={explaining} onClick={() => void explain()} className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
            <Icon name="sparkles" className="w-3.5 h-3.5" />
            {explaining ? 'Explication…' : 'Expliquer ce résultat avec FormAI'}
          </button>
          {explanation && (
            <p className="text-xs text-forma-text whitespace-pre-wrap leading-relaxed mt-2 p-2.5 rounded-lg bg-forma-bg border border-forma-border">{explanation}</p>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-forma-muted">Activez un fournisseur FormAI cloud dans les réglages pour obtenir une explication du résultat.</p>
      )}
    </div>
  )
}
