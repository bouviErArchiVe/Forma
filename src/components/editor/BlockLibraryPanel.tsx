/**
 * BlockLibraryPanel — bibliothèque de blocs techniques à déposer sur le dessin.
 *
 * À NE PAS confondre avec la Library principale des documents. Ici :
 * symboles vectoriels (acier, bois, sanitaire, électrique, symboles…) en
 * métrique ou impérial, recherche, favoris, récents, clic = insertion.
 */
import { useMemo, useState } from 'react'
import {
  BLOCK_CATEGORY_LABELS,
  blockToSvg,
  categoriesForUnit,
  getBlock,
  queryBlocks,
  type DrawingBlock,
  type DrawingBlockCategory,
} from '../../lib/blocks'
import { useBlockLibraryStore } from '../../stores/blockLibraryStore'

function BlockThumb({ block }: { block: DrawingBlock }) {
  // Le SVG du bloc sert directement de miniature (vectoriel, net).
  const svg = useMemo(() => blockToSvg(block, { stroke: 'currentColor' }), [block])
  return (
    <span
      className="w-full h-12 flex items-center justify-center text-forma-text [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export function BlockLibraryPanel({
  onPick,
  onClose,
}: {
  onPick: (block: DrawingBlock) => void
  onClose: () => void
}) {
  const { unit, favorites, recents, setUnit, toggleFavorite } = useBlockLibraryStore()
  const [category, setCategory] = useState<DrawingBlockCategory | 'all' | 'favorites' | 'recents'>('all')
  const [search, setSearch] = useState('')

  const categories = useMemo(() => categoriesForUnit(unit), [unit])

  const blocks = useMemo<DrawingBlock[]>(() => {
    if (category === 'favorites') {
      return favorites
        .map(getBlock)
        .filter((b): b is DrawingBlock => b !== undefined && b.unitSystem === unit)
        .filter((b) => queryBlocks({ unit, search }).includes(b) || search === '')
    }
    if (category === 'recents') {
      return recents
        .map(getBlock)
        .filter((b): b is DrawingBlock => b !== undefined && b.unitSystem === unit)
    }
    return queryBlocks({ unit, category, search })
  }, [unit, category, search, favorites, recents])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 bg-forma-surface border border-forma-border rounded-xl shadow-xl p-3 w-[22rem] max-w-[92vw] max-h-[28rem] flex flex-col">
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
                    unit === u
                      ? 'bg-forma-accent text-white'
                      : 'text-forma-muted hover:text-forma-text'
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

        {/* Recherche */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un bloc…"
          className="shrink-0 w-full text-xs border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent mb-2"
        />

        {/* Catégories */}
        <div className="shrink-0 flex flex-wrap gap-1 mb-2 overflow-y-auto max-h-16">
          {([
            { id: 'all' as const, label: 'Tous' },
            { id: 'favorites' as const, label: '★ Favoris' },
            { id: 'recents' as const, label: 'Récents' },
            ...categories.map((c) => ({ id: c, label: BLOCK_CATEGORY_LABELS[c] })),
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
                  className="group relative border border-forma-border rounded-lg p-1 hover:border-forma-accent/60 transition-colors"
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
