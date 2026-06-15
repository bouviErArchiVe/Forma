/**
 * ResourcesPage — ressources architecture/construction (/resources) :
 * bibliothèque normative (fiches synthétiques) + détails constructifs.
 * FormAI peut expliquer une fiche normative en rappelant la vérification
 * officielle. Les détails sont copiables (markdown) pour insertion ultérieure.
 */
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { CONSTRUCTION_DETAILS, detailToResource } from '../lib/resources/details'
import {
  MATERIAL_CATEGORY_LABELS,
  MATERIAL_DISCLAIMER,
  materialCategories,
  searchMaterials,
  type Material,
  type MaterialCategory,
} from '../lib/resources/materials'
import { HATCHES, hatchToResource } from '../lib/resources/hatches'
import { SYMBOLS, symbolToResource } from '../lib/resources/symbols'
import { LEGENDS, legendToResource } from '../lib/resources/legends'
import {
  TEMPLATE_CATEGORY_LABELS,
  createDocumentFromTemplate,
  searchTemplates,
  templateCategories,
  type ArchitectureTemplate,
  type TemplateCategory,
} from '../lib/resources/templates'
import { ResourceCatalog } from '../components/resources/ResourceCatalog'
import { useResourceFavoritesStore } from '../stores/resourceFavoritesStore'
import { useResourceNotesStore } from '../stores/resourceNotesStore'

type MainTab = 'normes' | 'details' | 'materiaux' | 'hachures' | 'symboles' | 'legendes' | 'templates'

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
          { id: 'materiaux' as MainTab, label: 'Matériaux' },
          { id: 'details' as MainTab, label: 'Détails constructifs' },
          { id: 'hachures' as MainTab, label: 'Hachures' },
          { id: 'symboles' as MainTab, label: 'Symboles' },
          { id: 'legendes' as MainTab, label: 'Légendes' },
          { id: 'templates' as MainTab, label: 'Templates' },
        ]).map((t) => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${tab === t.id ? 'bg-forma-accent text-white' : 'text-forma-muted hover:text-forma-text border border-forma-border'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'normes' ? <NormativeTab /> : tab === 'materiaux' ? <MaterialsTab /> : tab === 'hachures' ? <HatchesTab /> : tab === 'symboles' ? <SymbolsTab /> : tab === 'legendes' ? <LegendsTab /> : tab === 'templates' ? <TemplatesTab /> : <DetailsTab />}
    </div>
  )
}

// ─── Normative ────────────────────────────────────────────────────────────────

type NormeAction = 'expliquer' | 'resumer' | 'checklist' | 'comparer'

const NORME_ACTION_LABELS: Record<NormeAction, string> = {
  expliquer: 'Expliquer',
  resumer: 'Résumer',
  checklist: 'Checklist conformité',
  comparer: 'Comparer',
}

const NORME_SYSTEM_PROMPT =
  'Tu es l’agent Normes de FormAI. Tu aides à comprendre des concepts réglementaires du bâtiment SANS JAMAIS inventer de numéro d’article, de valeur chiffrée précise ni d’édition. Reste au niveau du concept et de la démarche. Termine toujours en rappelant de vérifier le texte officiel applicable (juridiction et édition en vigueur).'

function buildNormePrompt(action: NormeAction, sheet: NormativeSheet, other: NormativeSheet | null): string {
  const base = `« ${sheet.title} » — ${sheet.summary}`
  switch (action) {
    case 'expliquer':
      return `Explique ce concept de façon pédagogique : ${base}`
    case 'resumer':
      return `Résume en 3 à 5 points clés (puces) : ${base}`
    case 'checklist':
      return `Propose une checklist de conformité INDICATIVE (points à vérifier, sans valeurs chiffrées inventées) pour ce sujet : ${base}`
    case 'comparer':
      return other
        ? `Compare ces deux sujets réglementaires en soulignant les distinctions de principe (sans inventer de chiffres) :\nA) « ${sheet.title} » — ${sheet.summary}\nB) « ${other.title} » — ${other.summary}`
        : `Explique ce sujet : ${base}`
  }
}

function NormativeTab() {
  const [category, setCategory] = useState<NormativeCategory | 'all' | 'favorites'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<NormativeSheet | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [runningAction, setRunningAction] = useState<NormeAction | null>(null)
  const [compareWith, setCompareWith] = useState('')

  const favorites = useResourceFavoritesStore((s) => s.favorites)
  const toggleFav = useResourceFavoritesStore((s) => s.toggle)
  const isFav = (id: string) => favorites.includes(`norme:${id}`)
  const notes = useResourceNotesStore((s) => s.notes)
  const setNote = useResourceNotesStore((s) => s.set)

  const sheets = useMemo(() => {
    if (category === 'favorites') return searchNormative(search).filter((s) => favorites.includes(`norme:${s.id}`))
    return searchNormative(search, category)
  }, [search, category, favorites])

  const settings = resolveProviderSettings()
  const cloudReady = settings.providerId !== 'local' && settings.providerId !== 'mock'

  const runAction = async (action: NormeAction, sheet: NormativeSheet) => {
    setRunningAction(action)
    setResult(null)
    try {
      const other = action === 'comparer' ? (searchNormative('').find((s) => s.id === compareWith) ?? null) : null
      const provider = getProvider(settings.providerId)
      const res = await provider.chat({
        messages: [
          { role: 'system', content: NORME_SYSTEM_PROMPT },
          { role: 'user', content: buildNormePrompt(action, sheet, other) },
        ],
        settings,
      })
      setResult(res.text.trim() !== '' ? res.text : (res.error ?? 'Aucun résultat.'))
    } finally {
      setRunningAction(null)
    }
  }

  const selectSheet = (s: NormativeSheet) => { setSelected(s); setResult(null); setCompareWith('') }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
      {/* Liste */}
      <div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une fiche…" className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent mb-2" />
        <div className="flex flex-wrap gap-1 mb-2">
          <button type="button" onClick={() => setCategory('all')} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === 'all' ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>Toutes</button>
          <button type="button" onClick={() => setCategory('favorites')} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === 'favorites' ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>★ Favoris</button>
          {normativeCategories().map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === c ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>{NORMATIVE_CATEGORY_LABELS[c]}</button>
          ))}
        </div>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {sheets.map((s) => (
            <button key={s.id} type="button" onClick={() => selectSheet(s)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${selected?.id === s.id ? 'bg-forma-accent/10 text-forma-accent' : 'text-forma-text hover:bg-forma-bg'}`}>
              {isFav(s.id) && <span className="text-amber-400 shrink-0">★</span>}
              <span className="min-w-0 flex-1">
                <span className="block font-medium truncate">{s.title}</span>
                <span className="block text-[10px] text-forma-muted">{NORMATIVE_CATEGORY_LABELS[s.category]}</span>
              </span>
            </button>
          ))}
          {sheets.length === 0 && <p className="text-[11px] text-forma-muted text-center py-4">{category === 'favorites' ? 'Aucun favori — touchez l’étoile sur une fiche.' : 'Aucune fiche'}</p>}
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
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-forma-text">{selected.title}</h2>
              <button type="button" onClick={() => toggleFav('norme', selected.id)} title={isFav(selected.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'} className={`p-1 shrink-0 ${isFav(selected.id) ? 'text-amber-400' : 'text-forma-muted hover:text-amber-400'}`}>
                <Icon name={isFav(selected.id) ? 'star' : 'star-outline'} className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-2">{NORMATIVE_CATEGORY_LABELS[selected.category]}{selected.jurisdiction ? ` · ${selected.jurisdiction}` : ''}{selected.edition ? ` · ${selected.edition}` : ''}{selected.confidence ? ` · ${selected.confidence}` : ''}</p>
            <p className="text-sm text-forma-text leading-relaxed mb-3">{selected.summary}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {selected.keywords.map((k) => <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-forma-bg text-forma-muted">{k}</span>)}
            </div>
            <div className="p-2.5 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-start gap-1.5 mb-3">
              <Icon name="alert" className="w-3.5 h-3.5 shrink-0 mt-px" />
              {NORMATIVE_DISCLAIMER}
            </div>

            {/* Notes utilisateur (persistées) */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1">Mes notes</p>
              <textarea
                value={notes[`norme:${selected.id}`] ?? ''}
                onChange={(e) => setNote('norme', selected.id, e.target.value)}
                rows={2}
                placeholder="Notes personnelles sur cette fiche (vérifications, références projet…)"
                className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-surface resize-y focus:outline-none focus:border-forma-accent"
              />
            </div>

            {/* FormAI Normes */}
            {cloudReady ? (
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {(['expliquer', 'resumer', 'checklist', 'comparer'] as NormeAction[]).map((a) => (
                    <button key={a} type="button" disabled={runningAction !== null || (a === 'comparer' && compareWith === '')} onClick={() => void runAction(a, selected)} className="text-xs px-2.5 py-1.5 rounded-lg border border-forma-border hover:border-forma-accent/60 text-forma-muted hover:text-forma-accent transition-colors inline-flex items-center gap-1 disabled:opacity-40">
                      <Icon name="sparkles" className="w-3.5 h-3.5" />
                      {runningAction === a ? '…' : NORME_ACTION_LABELS[a]}
                    </button>
                  ))}
                  <select value={compareWith} onChange={(e) => setCompareWith(e.target.value)} title="Comparer avec…" className="text-xs border border-forma-border rounded-lg px-2 py-1.5 bg-forma-bg max-w-[12rem]">
                    <option value="">Comparer avec…</option>
                    {searchNormative('').filter((s) => s.id !== selected.id).map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                </div>
                {result && (
                  <p className="text-xs text-forma-text whitespace-pre-wrap leading-relaxed mt-1 p-2.5 rounded-lg bg-forma-bg border border-forma-border">{result}</p>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-forma-muted">Activez un fournisseur FormAI cloud dans les réglages pour expliquer, résumer, comparer ou générer une checklist de conformité.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Détails constructifs ─────────────────────────────────────────────────────

function DetailsTab() {
  const resources = useMemo(() => CONSTRUCTION_DETAILS.map(detailToResource), [])
  return <ResourceCatalog resources={resources} searchPlaceholder="Rechercher un détail…" insertTabLabel="Détails constructifs" emptyLabel="Aucun détail" gridCols={2} />
}

// ─── Matériaux ────────────────────────────────────────────────────────────────

function MaterialsTab() {
  const [category, setCategory] = useState<MaterialCategory | 'all' | 'favorites'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Material | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [explaining, setExplaining] = useState(false)

  const favorites = useResourceFavoritesStore((s) => s.favorites)
  const toggleFav = useResourceFavoritesStore((s) => s.toggle)
  const isFav = (id: string) => favorites.includes(`material:${id}`)

  const materials = useMemo(() => {
    if (category === 'favorites') return searchMaterials(search).filter((m) => favorites.includes(`material:${m.id}`))
    return searchMaterials(search, category)
  }, [search, category, favorites])

  const settings = resolveProviderSettings()
  const cloudReady = settings.providerId !== 'local' && settings.providerId !== 'mock'

  const explain = async (m: Material) => {
    setExplaining(true)
    setExplanation(null)
    try {
      const provider = getProvider(settings.providerId)
      const res = await provider.chat({
        messages: [
          {
            role: 'system',
            content:
              'Tu es l’agent Matériaux de FormAI. Explique un matériau de construction de façon synthétique et honnête (usages, atouts, limites, points de vigilance). N’invente pas de valeurs chiffrées précises ; rappelle de vérifier la fiche technique du fabricant et la norme applicable.',
          },
          { role: 'user', content: `Explique ce matériau : « ${m.name} » — ${m.description} Applications : ${m.applications.join(', ')}.` },
        ],
        settings,
      })
      setExplanation(res.text.trim() !== '' ? res.text : (res.error ?? 'Aucune explication.'))
    } finally {
      setExplaining(false)
    }
  }

  const copyMaterial = async (m: Material) => {
    const md = [
      `## ${m.name}`,
      '',
      m.description,
      '',
      `**Propriétés :** ${m.properties.map((p) => `${p.label} : ${p.value}`).join(' · ')}`,
      `**Avantages :** ${m.advantages.join(', ')}`,
      `**Inconvénients :** ${m.disadvantages.join(', ')}`,
      `**Applications :** ${m.applications.join(', ')}`,
      `**Notes :** ${m.notes}`,
      '',
      `*${MATERIAL_DISCLAIMER}*`,
    ].join('\n')
    try { await navigator.clipboard.writeText(md); useToastStore.getState().show('Matériau copié (Markdown)') }
    catch { useToastStore.getState().show('Copie impossible') }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
      {/* Liste */}
      <div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un matériau…" className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent mb-2" />
        <div className="flex flex-wrap gap-1 mb-2">
          <button type="button" onClick={() => setCategory('all')} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === 'all' ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>Tous</button>
          <button type="button" onClick={() => setCategory('favorites')} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === 'favorites' ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>★ Favoris</button>
          {materialCategories().map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === c ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>{MATERIAL_CATEGORY_LABELS[c]}</button>
          ))}
        </div>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {materials.map((m) => (
            <button key={m.id} type="button" onClick={() => { setSelected(m); setExplanation(null) }} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 ${selected?.id === m.id ? 'bg-forma-accent/10 text-forma-accent' : 'text-forma-text hover:bg-forma-bg'}`}>
              {isFav(m.id) && <span className="text-amber-400 shrink-0">★</span>}
              <span className="min-w-0 flex-1">
                <span className="block font-medium truncate">{m.name}</span>
                <span className="block text-[10px] text-forma-muted">{MATERIAL_CATEGORY_LABELS[m.category]}</span>
              </span>
            </button>
          ))}
          {materials.length === 0 && <p className="text-[11px] text-forma-muted text-center py-4">{category === 'favorites' ? 'Aucun favori — touchez l’étoile sur un matériau.' : 'Aucun matériau'}</p>}
        </div>
      </div>

      {/* Fiche */}
      <div>
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <Icon name="layout" className="w-8 h-8 text-forma-muted mb-2" />
            <p className="text-sm text-forma-muted max-w-sm">Sélectionnez un matériau. Propriétés indicatives — à vérifier selon le produit et la norme.</p>
          </div>
        ) : (
          <div className="max-w-2xl">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-lg font-semibold text-forma-text">{selected.name}</h2>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => toggleFav('material', selected.id)} title={isFav(selected.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'} className={`p-1 ${isFav(selected.id) ? 'text-amber-400' : 'text-forma-muted hover:text-amber-400'}`}>
                  <Icon name={isFav(selected.id) ? 'star' : 'star-outline'} className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => void copyMaterial(selected)} title="Copier (Markdown)" className="p-1 text-forma-muted hover:text-forma-accent"><Icon name="copy" className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-3">{MATERIAL_CATEGORY_LABELS[selected.category]}</p>
            <p className="text-sm text-forma-text leading-relaxed mb-3">{selected.description}</p>

            {selected.properties.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {selected.properties.map((p) => (
                  <div key={p.label} className="p-2 rounded-lg border border-forma-border bg-forma-surface">
                    <p className="text-[10px] uppercase tracking-wide text-forma-muted">{p.label}</p>
                    <p className="text-xs text-forma-text font-medium">{p.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-green-600 dark:text-green-400 mb-1">Avantages</p>
                <ul className="space-y-0.5">
                  {selected.advantages.map((a) => <li key={a} className="text-xs text-forma-text flex gap-1.5"><span className="text-green-500 shrink-0">+</span><span>{a}</span></li>)}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-500 mb-1">Inconvénients</p>
                <ul className="space-y-0.5">
                  {selected.disadvantages.map((d) => <li key={d} className="text-xs text-forma-text flex gap-1.5"><span className="text-red-500 shrink-0">−</span><span>{d}</span></li>)}
                </ul>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1">Applications</p>
              <div className="flex flex-wrap gap-1">
                {selected.applications.map((a) => <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-forma-bg text-forma-muted">{a}</span>)}
              </div>
            </div>

            <p className="text-xs text-forma-muted leading-relaxed mb-3"><span className="font-medium text-forma-text">Notes :</span> {selected.notes}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {selected.keywords.map((k) => <span key={k} className="text-[10px] px-1.5 py-0.5 rounded bg-forma-bg text-forma-muted">{k}</span>)}
            </div>

            <div className="p-2.5 rounded-lg border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-start gap-1.5 mb-3">
              <Icon name="alert" className="w-3.5 h-3.5 shrink-0 mt-px" />
              {MATERIAL_DISCLAIMER}
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

// ─── Hachures & Symboles (via Resource Factory partagée) ──────────────────────

function HatchesTab() {
  const resources = useMemo(() => HATCHES.map(hatchToResource), [])
  return <ResourceCatalog resources={resources} searchPlaceholder="Rechercher une hachure…" insertTabLabel="Hachures" emptyLabel="Aucune hachure" gridCols={2} />
}

function SymbolsTab() {
  const resources = useMemo(() => SYMBOLS.map(symbolToResource), [])
  return <ResourceCatalog resources={resources} searchPlaceholder="Rechercher un symbole…" insertTabLabel="Symboles" emptyLabel="Aucun symbole" gridCols={3} />
}

function LegendsTab() {
  const resources = useMemo(() => LEGENDS.map(legendToResource), [])
  return <ResourceCatalog resources={resources} searchPlaceholder="Rechercher une légende…" insertTabLabel="Légendes" emptyLabel="Aucune légende" gridCols={2} />
}

// ─── Templates ────────────────────────────────────────────────────────────────

function TemplatesTab() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ArchitectureTemplate | null>(null)
  const [creating, setCreating] = useState(false)

  const templates = useMemo(() => searchTemplates(search, category), [search, category])

  const create = async (t: ArchitectureTemplate) => {
    setCreating(true)
    try {
      const id = await createDocumentFromTemplate(t)
      useToastStore.getState().show('Document créé depuis le template')
      navigate(`/document/${id}`)
    } catch {
      useToastStore.getState().show('Création impossible')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4">
      <div>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un template…" className="w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent mb-2" />
        <div className="flex flex-wrap gap-1 mb-2">
          <button type="button" onClick={() => setCategory('all')} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === 'all' ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>Tous</button>
          {templateCategories().map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c)} className={`text-[11px] px-2 py-0.5 rounded-full border ${category === c ? 'border-forma-accent text-forma-accent' : 'border-forma-border text-forma-muted'}`}>{TEMPLATE_CATEGORY_LABELS[c]}</button>
          ))}
        </div>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {templates.map((t) => (
            <button key={t.id} type="button" onClick={() => setSelected(t)} className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selected?.id === t.id ? 'bg-forma-accent/10 text-forma-accent' : 'text-forma-text hover:bg-forma-bg'}`}>
              <span className="block font-medium truncate">{t.name}</span>
              <span className="block text-[10px] text-forma-muted">{TEMPLATE_CATEGORY_LABELS[t.category]}</span>
            </button>
          ))}
          {templates.length === 0 && <p className="text-[11px] text-forma-muted text-center py-4">Aucun template</p>}
        </div>
      </div>

      <div>
        {!selected ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <Icon name="file-text" className="w-8 h-8 text-forma-muted mb-2" />
            <p className="text-sm text-forma-muted max-w-sm">Sélectionnez un template pour créer un document pré-structuré.</p>
          </div>
        ) : (
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-forma-text">{selected.name}</h2>
            <p className="text-[10px] uppercase tracking-wide text-forma-accent mb-3">{TEMPLATE_CATEGORY_LABELS[selected.category]}</p>
            <p className="text-sm text-forma-text leading-relaxed mb-3">{selected.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {selected.tags.map((t) => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-forma-bg text-forma-muted">{t}</span>)}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-forma-muted mb-1">Aperçu de la structure</p>
            <div className="border border-forma-border rounded-xl p-4 bg-forma-surface mb-4 max-h-72 overflow-y-auto text-sm text-forma-text [&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-medium [&_h2]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_th]:text-left [&_th]:border-b [&_th]:border-forma-border [&_blockquote]:text-[11px] [&_blockquote]:text-amber-600 dark:[&_blockquote]:text-amber-400" dangerouslySetInnerHTML={{ __html: selected.contentHtml }} />
            <button type="button" disabled={creating} onClick={() => void create(selected)} className="text-sm px-4 py-2 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-50 transition-colors inline-flex items-center gap-1.5">
              <Icon name="plus" className="w-4 h-4" />
              {creating ? 'Création…' : 'Créer depuis ce template'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
