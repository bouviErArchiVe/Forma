/**
 * BlockLibraryPanel — bibliothèque de blocs techniques à déposer sur le dessin.
 *
 * À NE PAS confondre avec la Library principale des documents. Ici :
 * symboles vectoriels (acier, bois, sanitaire…) métrique/impérial, recherche
 * FR/EN, favoris, récents, blocs personnalisés importés, blocs paramétriques.
 * Clic = insertion (centre du viewport) ; glisser = insertion à la position.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  BLOCK_CATEGORY_LABELS,
  blockToSvg,
  categoriesForUnit,
  isAssetBacked,
  queryBlocks,
  resolveBlock,
  type DrawingBlock,
  type DrawingBlockCategory,
} from '../../lib/blocks'
import { importCustomBlock } from '../../lib/blocks/custom-import'
import { buildParametricBlock, PARAMETRIC_DEFS, type ParametricDef } from '../../lib/blocks/parametric'
import { resolveAssetUrl } from '../../lib/assets'
import { useBlockLibraryStore } from '../../stores/blockLibraryStore'
import { useToastStore } from '../../stores/toastStore'
import { confirm } from '../../stores/confirmStore'
import { Icon } from '../ui/Icon'

/** Miniature : SVG inline pour le catalogue/paramétrique, image pour les customs. */
function BlockThumb({ block }: { block: DrawingBlock }) {
  const [assetUrl, setAssetUrl] = useState<string | null>(null)
  const assetBacked = isAssetBacked(block)

  useEffect(() => {
    if (!assetBacked || !block.assetId) return
    let cancelled = false
    void resolveAssetUrl(block.assetId).then((u) => {
      if (!cancelled) setAssetUrl(u || null)
    })
    return () => { cancelled = true }
  }, [assetBacked, block.assetId])

  if (assetBacked) {
    return assetUrl ? (
      <img src={assetUrl} alt="" draggable={false} className="w-full h-12 object-contain" />
    ) : (
      <span className="w-full h-12 flex items-center justify-center text-forma-muted">
        <Icon name="image" className="w-5 h-5" />
      </span>
    )
  }
  const svg = blockToSvg(block, { stroke: 'currentColor' })
  return (
    <span
      className="w-full h-12 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

type CatTab = DrawingBlockCategory | 'all' | 'favorites' | 'recents'

export function BlockLibraryPanel({
  notebookId,
  onPick,
  onClose,
}: {
  notebookId: string
  onPick: (block: DrawingBlock) => void
  onClose: () => void
}) {
  const { unit, favorites, recents, customBlocks, setUnit, toggleFavorite, addCustomBlock, removeCustomBlock } =
    useBlockLibraryStore()
  const [category, setCategory] = useState<CatTab>('all')
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [paramDef, setParamDef] = useState<ParametricDef | null>(null)

  const categories = useMemo(() => categoriesForUnit(unit), [unit])

  const blocks = useMemo<DrawingBlock[]>(() => {
    if (category === 'favorites') {
      return favorites
        .map((id) => resolveBlock(id, customBlocks))
        .filter((b): b is DrawingBlock => b !== undefined && b.unitSystem === unit)
    }
    if (category === 'recents') {
      return recents
        .map((id) => resolveBlock(id, customBlocks))
        .filter((b): b is DrawingBlock => b !== undefined && b.unitSystem === unit)
    }
    return queryBlocks({ unit, category, search, customBlocks })
  }, [unit, category, search, favorites, recents, customBlocks])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 bg-forma-surface border border-forma-border rounded-xl shadow-xl p-3 w-[23rem] max-w-[94vw] max-h-[30rem] flex flex-col">
        {/* En-tête : titre + unité + fermer */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-sm font-semibold text-forma-text">Bibliothèque de blocs</span>
          <div className="flex items-center gap-1.5">
            <div className="flex rounded-lg border border-forma-border overflow-hidden text-[11px]">
              {(['metric', 'imperial'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-2 py-0.5 transition-colors ${
                    unit === u ? 'bg-forma-accent text-white' : 'text-forma-muted hover:text-forma-text'
                  }`}
                >
                  {u === 'metric' ? 'Métrique' : 'Impérial'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-6 h-6 flex items-center justify-center rounded-md text-forma-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-forma-text transition-colors text-base"
            >
              ×
            </button>
          </div>
        </div>

        {/* Recherche + actions (import / paramétrique) */}
        <div className="flex items-center gap-1.5 mb-2 shrink-0">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (FR/EN)…"
            className="flex-1 text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent"
          />
          <button
            type="button"
            onClick={() => setShowImport(true)}
            title="Importer un bloc personnalisé (SVG, PNG, JPG)"
            className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-forma-border text-forma-muted hover:text-forma-accent hover:border-forma-accent/60 transition-colors"
          >
            <Icon name="upload" className="w-4 h-4" />
          </button>
        </div>

        {/* Blocs paramétriques (chips) */}
        <div className="flex flex-wrap gap-1 mb-2 shrink-0">
          <span className="text-[10px] text-forma-muted self-center mr-0.5">Paramétrique :</span>
          {PARAMETRIC_DEFS.map((d) => (
            <button
              key={d.kind}
              type="button"
              onClick={() => setParamDef(d)}
              className="text-[11px] px-2 py-0.5 rounded-full border border-forma-accent/40 text-forma-accent hover:bg-forma-accent/5 transition-colors"
            >
              {d.name}
            </button>
          ))}
        </div>

        {/* Catégories */}
        <div className="shrink-0 flex flex-wrap gap-1 mb-2 overflow-y-auto max-h-16">
          {([
            { id: 'all' as CatTab, label: 'Tous' },
            { id: 'favorites' as CatTab, label: '★ Favoris' },
            { id: 'recents' as CatTab, label: 'Récents' },
            ...categories.map((c) => ({ id: c as CatTab, label: BLOCK_CATEGORY_LABELS[c] })),
          ]).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategory(c.id)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                category === c.id
                  ? 'border-forma-accent text-forma-accent bg-forma-accent/5'
                  : 'border-forma-border text-forma-muted hover:border-forma-accent/50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Compteur de résultats */}
        <div className="shrink-0 text-[10px] text-forma-muted mb-1 px-0.5">
          {blocks.length} bloc{blocks.length !== 1 ? 's' : ''}
          <span className="text-forma-muted/70"> · glissez sur la page ou cliquez pour insérer</span>
        </div>

        {/* Grille de blocs */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {blocks.length === 0 ? (
            <p className="text-xs text-forma-muted text-center py-8">
              {category === 'favorites'
                ? 'Aucun favori — touchez l’étoile sur un bloc.'
                : category === 'recents'
                  ? 'Aucun bloc récent.'
                  : 'Aucun bloc trouvé.'}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {blocks.map((b) => (
                <div
                  key={b.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/x-forma-block', b.id)
                    e.dataTransfer.effectAllowed = 'copy'
                  }}
                  className="group relative border border-forma-border rounded-lg p-1 hover:border-forma-accent/60 transition-colors cursor-grab active:cursor-grabbing"
                >
                  <button
                    type="button"
                    onClick={() => onPick(b)}
                    title={`${b.name}${b.scaleLabel ? ` (${b.scaleLabel})` : ''} — insérer`}
                    className="w-full flex flex-col items-center gap-0.5"
                  >
                    <BlockThumb block={b} />
                    <span className="text-[9px] leading-tight text-forma-muted text-center line-clamp-2 w-full">
                      {b.name}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(b.id)}
                    title={favorites.includes(b.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    className={`absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded text-xs transition-opacity ${
                      favorites.includes(b.id)
                        ? 'text-amber-400 opacity-100'
                        : 'text-forma-muted opacity-0 group-hover:opacity-100 hover:text-amber-400'
                    }`}
                  >
                    {favorites.includes(b.id) ? '★' : '☆'}
                  </button>
                  {b.custom && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm(`Supprimer le bloc « ${b.name} » ?`, {
                          confirmLabel: 'Supprimer', danger: true,
                        })
                        if (ok) removeCustomBlock(b.id)
                      }}
                      title="Supprimer ce bloc personnalisé"
                      className="absolute top-0.5 left-0.5 w-5 h-5 flex items-center justify-center rounded text-forma-muted opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                    >
                      <Icon name="trash" className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showImport && (
        <ImportDialog
          unit={unit}
          notebookId={notebookId}
          onClose={() => setShowImport(false)}
          onImported={(meta) => {
            addCustomBlock(meta)
            setShowImport(false)
            useToastStore.getState().show(`Bloc « ${meta.name} » ajouté`)
          }}
        />
      )}

      {paramDef && (
        <ParametricDialog
          def={paramDef}
          unit={unit}
          onClose={() => setParamDef(null)}
          onInsert={(block) => {
            onPick(block)
            setParamDef(null)
          }}
        />
      )}
    </>
  )
}

// ─── Dialogue d'import de bloc personnalisé ───────────────────────────────────

function ImportDialog({
  unit,
  notebookId,
  onClose,
  onImported,
}: {
  unit: DrawingBlock['unitSystem']
  notebookId: string
  onClose: () => void
  onImported: (meta: import('../../stores/blockLibraryStore').CustomBlockMeta) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<DrawingBlockCategory>('symbols')
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!file) return
    setBusy(true)
    try {
      const meta = await importCustomBlock(
        { file, name, category, unitSystem: unit, tags: tags.split(',') },
        notebookId,
      )
      onImported(meta)
    } catch (err) {
      useToastStore.getState().show(err instanceof Error ? err.message : 'Import échoué', 5000)
    } finally {
      setBusy(false)
    }
  }

  const field = 'w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-forma-surface border border-forma-border rounded-xl shadow-xl p-4 w-80 max-w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-forma-text mb-3">Importer un bloc</h3>
        <div className="space-y-2.5">
          <input
            type="file"
            accept="image/svg+xml,image/png,image/jpeg"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null
              setFile(f)
              if (f && name === '') setName(f.name.replace(/\.[^.]+$/, ''))
            }}
            className="w-full text-xs"
          />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du bloc" className={field} />
          <select value={category} onChange={(e) => setCategory(e.target.value as DrawingBlockCategory)} className={field}>
            {(Object.keys(BLOCK_CATEGORY_LABELS) as DrawingBlockCategory[]).map((c) => (
              <option key={c} value={c}>{BLOCK_CATEGORY_LABELS[c]}</option>
            ))}
          </select>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (séparés par des virgules)" className={field} />
          <p className="text-[10px] text-forma-muted">SVG, PNG ou JPG · 2 Mo max · unité : {unit === 'metric' ? 'métrique' : 'impérial'}</p>
        </div>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 text-xs py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Annuler</button>
          <button type="button" onClick={() => void submit()} disabled={!file || busy} className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors">
            {busy ? 'Import…' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dialogue de bloc paramétrique ────────────────────────────────────────────

function ParametricDialog({
  def,
  unit,
  onClose,
  onInsert,
}: {
  def: ParametricDef
  unit: DrawingBlock['unitSystem']
  onClose: () => void
  onInsert: (block: DrawingBlock) => void
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(def.fields.map((f) => [f.id, f.default])),
  )
  const [text, setText] = useState(def.textField?.default ?? '')

  const block = useMemo(() => buildParametricBlock(def, unit, values, text), [def, unit, values, text])
  const previewSvg = useMemo(() => blockToSvg(block, { stroke: 'currentColor' }), [block])

  const unitLabel = unit === 'metric' ? 'mm' : 'po'

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-forma-surface border border-forma-border rounded-xl shadow-xl p-4 w-72 max-w-full" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-forma-text mb-3">{def.name} paramétrique</h3>

        {/* Aperçu */}
        <div className="border border-forma-border rounded-lg p-2 mb-3 h-24 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
          dangerouslySetInnerHTML={{ __html: previewSvg }}
        />

        <div className="space-y-2">
          {def.fields.map((f) => (
            <label key={f.id} className="block text-xs">
              <span className="text-forma-muted">{f.label} ({unitLabel})</span>
              <input
                type="number"
                min={f.min}
                max={f.max}
                value={values[f.id]}
                onChange={(e) => setValues((v) => ({ ...v, [f.id]: Number(e.target.value) }))}
                className="w-full mt-0.5 text-sm border border-forma-border rounded-lg px-2 py-1 bg-forma-bg focus:outline-none focus:border-forma-accent"
              />
            </label>
          ))}
          {def.textField && (
            <label className="block text-xs">
              <span className="text-forma-muted">{def.textField.label}</span>
              <input
                type="text"
                value={text}
                maxLength={3}
                onChange={(e) => setText(e.target.value)}
                className="w-full mt-0.5 text-sm border border-forma-border rounded-lg px-2 py-1 bg-forma-bg focus:outline-none focus:border-forma-accent"
              />
            </label>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 text-xs py-1.5 rounded-lg border border-forma-border text-forma-text hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Annuler</button>
          <button type="button" onClick={() => onInsert(block)} className="flex-1 text-xs py-1.5 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover transition-colors">Insérer</button>
        </div>
      </div>
    </div>
  )
}
