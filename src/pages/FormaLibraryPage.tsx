import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { GlassButton } from '../components/ui/GlassButton'
import { LibraryItemCard } from '../components/formalibrary/LibraryItemCard'
import { LibraryPreviewModal } from '../components/formalibrary/LibraryPreviewModal'
import {
  buildFolderTree,
  getFolderPath,
  type LibraryFolder,
  type LibraryFolderNode,
  type LibraryItem,
} from '../lib/formalibrary/model'
import { SORT_OPTIONS, TYPE_FILTERS, type SortOption } from '../lib/formalibrary/constants'
import { searchLibrary, sortItems } from '../lib/formalibrary/search'
import { importFiles, linkInternalSource, listInternalSources, type InternalSource } from '../lib/formalibrary/import'
import {
  createAndSaveFolder,
  deleteFolder,
  deleteItem,
  ensurePresets,
  listFolders,
  listItems,
  saveItem,
  toggleItemFavorite,
} from '../services/formalibrary'
import { useToastStore } from '../stores/toastStore'

function FolderRow({
  node,
  depth,
  currentFolderId,
  onSelect,
}: {
  node: LibraryFolderNode
  depth: number
  currentFolderId: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={`w-full text-left flex items-center gap-2 pr-2 py-1.5 rounded-lg text-sm ${
          currentFolderId === node.id ? 'bg-forma-accent/15 text-forma-accent' : 'text-forma-muted hover:bg-white/40 dark:hover:bg-white/5'
        }`}
      >
        <span>{node.icon}</span>
        <span className="truncate">{node.name}</span>
      </button>
      {node.children.map((child) => (
        <FolderRow key={child.id} node={child} depth={depth + 1} currentFolderId={currentFolderId} onSelect={onSelect} />
      ))}
    </>
  )
}

export function FormaLibraryPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [folders, setFolders] = useState<LibraryFolder[]>([])
  const [items, setItems] = useState<LibraryItem[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortOption>('updated')
  const [activeItem, setActiveItem] = useState<LibraryItem | null>(null)
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [sources, setSources] = useState<{ doc: InternalSource[]; sheet: InternalSource[] }>({ doc: [], sheet: [] })

  const refresh = useCallback(async () => {
    await ensurePresets()
    const [f, i] = await Promise.all([listFolders(), listItems()])
    setFolders(f)
    setItems(i)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const tree = useMemo(() => buildFolderTree(folders), [folders])
  const path = useMemo(() => getFolderPath(folders, currentFolderId), [folders, currentFolderId])

  const results = useMemo(() => {
    const found = searchLibrary({ folders, items, query, filters: { folderId: currentFolderId, category } })
    return query.trim() ? found : sortItems(found, sort)
  }, [folders, items, query, currentFolderId, category, sort])

  const handleImport = useCallback(
    async (files: FileList | File[] | null) => {
      const list = Array.from(files || [])
      if (!list.length) return
      setImporting(true)
      try {
        const imported = await importFiles(list, currentFolderId)
        for (const item of imported) await saveItem(item)
        setItems(await listItems())
        useToastStore.getState().show(`${imported.length} élément(s) importé(s)`)
      } catch {
        useToastStore.getState().show('Import échoué', 4000)
      } finally {
        setImporting(false)
      }
    },
    [currentFolderId],
  )

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    void handleImport(e.target.files)
    e.target.value = ''
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    void handleImport(e.dataTransfer.files)
  }

  const handleNewFolder = async () => {
    const name = window.prompt('Nom du dossier :', 'Nouveau dossier')
    if (!name?.trim()) return
    await createAndSaveFolder({ name: name.trim(), parentId: currentFolderId })
    setFolders(await listFolders())
    useToastStore.getState().show('Dossier créé')
  }

  const handleDeleteFolder = async () => {
    if (!currentFolderId) return
    if (!window.confirm('Supprimer ce dossier et son contenu ?')) return
    await deleteFolder(currentFolderId)
    setCurrentFolderId(null)
    await refresh()
  }

  const handleToggleFavorite = async (item: LibraryItem) => {
    await toggleItemFavorite(item.id)
    const next = await listItems()
    setItems(next)
    setActiveItem((cur) => (cur ? next.find((i) => i.id === cur.id) || null : null))
  }

  const handleDelete = async (item: LibraryItem) => {
    await deleteItem(item.id)
    setItems(await listItems())
    setActiveItem(null)
  }

  const openLinkModal = async () => {
    setSources(await listInternalSources())
    setLinkOpen(true)
  }

  const handleLink = async (source: InternalSource) => {
    await saveItem(linkInternalSource(source, currentFolderId))
    setItems(await listItems())
    setLinkOpen(false)
    useToastStore.getState().show(`${source.name} lié`)
  }

  return (
    <div className="min-h-full flex flex-col lg:flex-row">
      <aside className="forma-glass-panel lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-forma-border/60 p-3 lg:p-4">
        <div className="mb-3 px-1">
          <BrandLogo size="sm" subtitle="FormaLibrary" />
          <Link to="/" className="text-[11px] text-forma-accent hover:underline">
            ← Bibliothèque
          </Link>
        </div>

        <div className="flex flex-col gap-0.5 mb-3">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={`text-left px-2 py-1.5 rounded-lg text-sm ${
              currentFolderId === null ? 'bg-forma-accent/15 text-forma-accent' : 'text-forma-muted hover:bg-white/40 dark:hover:bg-white/5'
            }`}
          >
            📂 Tout
          </button>
          {tree.map((node) => (
            <FolderRow key={node.id} node={node} depth={0} currentFolderId={currentFolderId} onSelect={setCurrentFolderId} />
          ))}
        </div>

        <div className="flex gap-1">
          <GlassButton size="sm" className="flex-1" onClick={handleNewFolder}>
            + Dossier
          </GlassButton>
          {currentFolderId && (
            <GlassButton size="sm" danger onClick={handleDeleteFolder} title="Supprimer le dossier">
              🗑
            </GlassButton>
          )}
        </div>
      </aside>

      <div
        className="flex-1 min-w-0 flex flex-col p-4"
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans la bibliothèque…"
            className="flex-1 min-w-[180px] border border-forma-border rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="border border-forma-border rounded-lg px-2 py-2 text-sm"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.svg,.txt,.md" className="hidden" onChange={onFileInput} />
          <GlassButton accent disabled={importing} onClick={() => fileRef.current?.click()}>
            {importing ? 'Import…' : '+ Importer'}
          </GlassButton>
          <GlassButton onClick={() => void openLinkModal()}>Lier Forma</GlassButton>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCategory(f.id)}
              className={`text-xs px-2.5 py-1 rounded-full ${
                category === f.id ? 'bg-forma-accent text-white' : 'bg-white/30 dark:bg-white/5 text-forma-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {path.length > 0 && (
          <div className="text-xs text-forma-muted mb-3">
            {path.map((f) => f.name).join(' › ')}
          </div>
        )}

        {results.length === 0 ? (
          <div
            className={`flex-1 flex items-center justify-center rounded-xl border-2 border-dashed text-sm text-forma-muted ${
              dragOver ? 'border-forma-accent bg-forma-accent/5' : 'border-forma-border/50'
            }`}
          >
            {dragOver ? 'Déposez les fichiers ici' : 'Aucun élément — importez ou glissez-déposez des fichiers.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {results.map((item) => (
              <LibraryItemCard
                key={item.id}
                item={item}
                query={query}
                onOpen={setActiveItem}
                onToggleFavorite={(i) => void handleToggleFavorite(i)}
              />
            ))}
          </div>
        )}
      </div>

      {activeItem && (
        <LibraryPreviewModal
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onDelete={(i) => void handleDelete(i)}
          onToggleFavorite={(i) => void handleToggleFavorite(i)}
        />
      )}

      {linkOpen && (
        <div className="fixed inset-0 z-[130] bg-black/50 flex items-center justify-center p-4" onClick={() => setLinkOpen(false)}>
          <div className="forma-glass-modal rounded-2xl p-5 w-[420px] max-w-[94vw] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-3">Lier un document Forma</h3>
            {sources.doc.length === 0 && sources.sheet.length === 0 ? (
              <p className="text-sm text-forma-muted">Aucun FormaDoc ou FormaTab disponible.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {[...sources.doc, ...sources.sheet].map((s) => (
                  <button
                    key={`${s.type}-${s.id}`}
                    type="button"
                    onClick={() => void handleLink(s)}
                    className="text-left px-3 py-2 rounded-lg text-sm hover:bg-forma-accent/10 flex items-center gap-2"
                  >
                    <span>{s.type === 'doc' ? '📄' : '📊'}</span>
                    <span className="truncate">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={() => setLinkOpen(false)} className="mt-3 text-sm text-forma-muted">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
