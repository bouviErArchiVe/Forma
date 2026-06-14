/**
 * ResourcesPage — ressources architecture/construction (/resources) :
 * bibliothèque normative (fiches synthétiques) + détails constructifs.
 * FormAI peut expliquer une fiche normative en rappelant la vérification
 * officielle. Les détails sont copiables (markdown) pour insertion ultérieure.
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { getProvider, resolveProviderSettings } from '../services/ai/providers'
import { useToastStore } from '../stores/toastStore'
import {
  NORMATIVE_CATEGORY_LABELS,
  NORMATIVE_DISCLAIMER,
  normativeCategories,
  searchNormative,
  type NormativeCategory,
  type NormativeSheet,
} from '../lib/resources/normative'
import {
  blockToSvg,
} from '../lib/blocks/types'
import {
  DETAIL_CATEGORY_LABELS,
  DETAIL_DISCLAIMER,
  detailCategories,
  detailToBlock,
  searchDetails,
  type ConstructionDetail,
  type DetailCategory,
} from '../lib/resources/details'

type MainTab = 'normes' | 'details'

export function ResourcesPage() {
  const [tab, setTab] = useState<MainTab>('normes')

  return (
    <div className="min-h-full p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors">
          <Icon name="chevron-left" className="w-4 h-4" />
          Tableau de bord
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-forma-text inline-flex items-center gap-2 mb-4">
        <Icon name="book" className="w-5 h-5 text-forma-accent" />
        Ressources architecture
      </h1>

      <div className="flex gap-1 mb-5">
        {([
          { id: 'normes' as MainTab, label: 'Bibliothèque normative' },
          { id: 'details' as MainTab, label: 'Détails constructifs' },
        ]).map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${tab === t.id ? 'bg-forma-accent text-white' : 'text-forma-muted hover:text-forma-text border border-forma-border'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'normes' ? <NormativeTab /> : <DetailsTab />}
    </div>
  )
}

// ─── Normative ────────────────────────────────────────────────────────────────

function NormativeTab() {
  const [category, setCategory] = useState<NormativeCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<NormativeSheet | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  const sheets = useMemo(() => searchNormative(search, category), [search, category])
  const settings = resolveProviderSettings()

  const explain = async (sheet: NormativeSheet) => {
    setExplaining(true)
    setExplanation(null)
    try {
      const provider = getProvider(settings.providerId)
      const res = await provider.chat({
        messages: [
          {
            role: 'system',
            content:
              'Tu es l’agent Normes de FormAI. Explique le CONCEPT d’une fiche réglementaire sans JAMAIS inventer de numéro d’article. Termine toujours en rappelant de vérifier le texte officiel applicable (juridiction et édition).',
          },
          { role: 'user', content: `Explique cette fiche : « ${sheet.title} » — ${sheet.summary}` },
        ],
        settings,
      })
      setExplanation(res.text.trim() !== '' ? res.text : (res.error ?? 'Aucune explication.'))
    } finally {
      setExplaining(false)
    }
  }

  const cloudReady = settings.providerId !== 'local' && settings.providerId !== 'mock'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
      {/* Liste */}
      <div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une fiche…" className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent mb-2" />
        <div className="flex flex-wrap gap-1 mb-2">
          <button type="button" onClick={() => setCategory('all')} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === 'all' ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>Toutes</button>
          {normativeCategories().map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === c ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>{NORMATIVE_CATEGORY_LABELS[c]}</button>
          ))}
        </div>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {sheets.map((s) => (
            <button key={s.id} type="button" onClick={() => { setSelected(s); setExplanation(null) }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selected?.id === s.id ? 'bg-forma-accent/10 text-forma-accent' : 'text-forma-text hover:bg-forma-bg'}`}>
              <span className="block font-medium truncate">{s.title}</span>
              <span className="block text-[10px] text-forma-muted">{NORMATIVE_CATEGORY_LABELS[s.category]}</span>
            </button>
          ))}
          {sheets.length === 0 && <p className="text-[11px] text-forma-muted text-center py-4">Aucune fiche</p>}
        </div>
      </div>

      {/* Fiche */}
      <div>
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <Icon name="book" className="w-8 h-8 text-forma-muted mb-2" />
            <p className="text-sm text-forma-muted max-w-sm">Sélectionnez une fiche. Aide synthétique — ne remplace jamais les textes officiels.</p>
          </div>
        ) : (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-forma-text">{selected.title}</h2>
            <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-2">{NORMATIVE_CATEGORY_LABELS[selected.category]}{selected.jurisdiction ? ` · ${selected.jurisdiction}` : ''}{selected.edition ? ` · ${selected.edition}` : ''}</p>
            <p className="text-sm text-forma-text leading-relaxed mb-3">{selected.summary}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {selected.keywords.map((k) => <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-forma-bg text-forma-muted">{k}</span>)}
            </div>
            <div className="p-2.5 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-start gap-1.5 mb-3">
              <Icon name="alert" className="w-3.5 h-3.5 shrink-0 mt-px" />
              {NORMATIVE_DISCLAIMER}
            </div>
            {cloudReady && (
              <div>
                <button type="button" disabled={explaining} onClick={() => void explain(selected)} className="text-xs px-3 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1.5 disabled:opacity-50">
                  <Icon name="sparkles" className="w-3.5 h-3.5" />
                  {explaining ? 'Explication…' : 'Expliquer avec FormAI'}
                </button>
                {explanation && (
                  <p className="text-xs text-forma-text whitespace-pre-wrap leading-relaxed mt-2 p-2.5 rounded-lg bg-forma-bg border border-forma-border">{explanation}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Détails constructifs ─────────────────────────────────────────────────────

function DetailsTab() {
  const [category, setCategory] = useState<DetailCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ConstructionDetail | null>(null)

  const details = useMemo(() => searchDetails(search, category), [search, category])

  const copyDetail = async (d: ConstructionDetail) => {
    const md = `## ${d.name}\n\n${d.description}\n\n**Notes :** ${d.notes}\n\n*${DETAIL_DISCLAIMER}*`
    try { await navigator.clipboard.writeText(md); useToastStore.getState().show('Détail copié (Markdown)') }
    catch { useToastStore.getState().show('Copie impossible') }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
      <div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un détail…" className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent mb-2" />
        <div className="flex flex-wrap gap-1 mb-2">
          <button type="button" onClick={() => setCategory('all')} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === 'all' ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>Tous</button>
          {detailCategories().map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === c ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>{DETAIL_CATEGORY_LABELS[c]}</button>
          ))}
        </div>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {details.map((d) => (
            <button key={d.id} type="button" onClick={() => setSelected(d)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selected?.id === d.id ? 'bg-forma-accent/10 text-forma-accent' : 'text-forma-text hover:bg-forma-bg'}`}>
              <span className="block font-medium truncate">{d.name}</span>
              <span className="block text-[10px] text-forma-muted">{DETAIL_CATEGORY_LABELS[d.category]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <Icon name="layout" className="w-8 h-8 text-forma-muted mb-2" />
            <p className="text-sm text-forma-muted max-w-sm">Sélectionnez un détail constructif. Schémas indicatifs à adapter au projet.</p>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-forma-text">{selected.name}</h2>
              <button type="button" onClick={() => void copyDetail(selected)} title="Copier (Markdown)" className="p-1 text-forma-muted hover:text-forma-accent"><Icon name="copy" className="w-4 h-4" /></button>
            </div>
            <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-3">{DETAIL_CATEGORY_LABELS[selected.category]}</p>
            <div className="border border-forma-border rounded-xl p-4 bg-forma-surface mb-3 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-48"
              dangerouslySetInnerHTML={{ __html: blockToSvg(detailToBlock(selected), { stroke: 'currentColor' }) }}
            />
            <p className="text-sm text-forma-text leading-relaxed mb-2">{selected.description}</p>
            <p className="text-xs text-forma-muted leading-relaxed mb-3"><span className="font-medium text-forma-text">Notes :</span> {selected.notes}</p>
            <div className="p-2.5 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-start gap-1.5">
              <Icon name="alert" className="w-3.5 h-3.5 shrink-0 mt-px" />
              {DETAIL_DISCLAIMER}
            </div>
            <p className="text-[11px] text-forma-muted mt-3">Astuce : pour insérer un détail dans un dessin, ouvrez un carnet puis la bibliothèque de blocs (les détails y seront ajoutés dans une prochaine itération).</p>
          </div>
        )}
      </div>
    </div>
  )
}
