import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FLB_DARK, TYPE_FILTERS, SORT_OPTIONS, categoryIcon, categoryLabel,
} from '@/lib/formalibrary/constants'
import { searchLibrary } from '@/lib/formalibrary/search'
import { moveItem } from '@/lib/formalibrary/persistence'
import HighlightText from '@/components/formalibrary/HighlightText'
import LibrarySidebar from '@/components/formalibrary/LibrarySidebar'
import LibraryPreview from '@/components/formalibrary/LibraryPreview'
import LibraryImportModal from '@/components/formalibrary/LibraryImportModal'

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function LibraryExplorer({
  folders, items, setFolders, setItems,
  currentFolderId, setCurrentFolderId,
  onCreateFolder, onCreateSubfolder, onSaveItem, onDeleteItem, onImportFiles, onImportInternal,
  addNotification, initialItemId,
}) {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [sort, setSort] = useState('updated')
  const [viewMode, setViewMode] = useState('grid')
  const [selectedId, setSelectedId] = useState(initialItemId || null)
  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [dragItemId, setDragItemId] = useState(null)
  const [dropTargetId, setDropTargetId] = useState(null)
  const [globalDrag, setGlobalDrag] = useState(false)

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) || null,
    [items, selectedId],
  )

  const filtered = useMemo(() => {
    const results = searchLibrary({
      folders,
      items,
      query,
      filters: {
        folderId: query.trim() ? undefined : currentFolderId,
        category: typeFilter,
        tag: tagFilter,
        recursive: !!query.trim(),
      },
    })
    const sorted = [...results]
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    else if (sort === 'type') sorted.sort((a, b) => a.category.localeCompare(b.category))
    else if (sort === 'created') sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    else sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    return sorted
  }, [folders, items, query, currentFolderId, typeFilter, tagFilter, sort])

  const allTags = useMemo(() => {
    const set = new Set()
    for (const i of items) (i.tags || []).forEach((t) => set.add(t))
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  }, [items])

  const handleToggleFavorite = useCallback(() => {
    if (!selectedItem) return
    const next = { ...selectedItem, favorite: !selectedItem.favorite }
    onSaveItem(next)
    addNotification?.(next.favorite ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success')
  }, [selectedItem, onSaveItem, addNotification])

  const handleDelete = useCallback(() => {
    if (!selectedItem || !confirm(`Supprimer « ${selectedItem.name} » ?`)) return
    onDeleteItem(selectedItem.id)
    setSelectedId(null)
    addNotification?.('Élément supprimé', 'success')
  }, [selectedItem, onDeleteItem, addNotification])

  const handleOpenItem = useCallback((item) => {
    setSelectedId(item.id)
    if (item.refModule && item.refId) {
      const routes = { doc: '/formadoc', sheet: '/formatab' }
      const route = routes[item.refModule]
      if (route) { navigate(route); return }
    }
  }, [navigate])

  const handleReadItem = useCallback((item) => {
    setSelectedId(item.id)
    const url = item.previewUrl || item.dataUrl
    if (url) window.open(url, '_blank')
  }, [])

  const handleAnnotateItem = useCallback((item) => {
    sessionStorage.setItem('formareview-pending-library', JSON.stringify(item))
    navigate('/formareview')
    addNotification?.('Ouverture dans FormaReview…', 'success')
  }, [navigate, addNotification])

  const handleRenameItem = useCallback((item) => {
    const name = prompt('Nouveau nom :', item.name)
    if (!name?.trim() || name.trim() === item.name) return
    onSaveItem({ ...item, name: name.trim(), updatedAt: Date.now() })
    addNotification?.('Fichier renommé', 'success')
  }, [onSaveItem, addNotification])

  const runImport = async (files) => {
    if (!files?.length) return
    setImporting(true)
    try {
      await onImportFiles(files, currentFolderId)
      addNotification?.(`${files.length} fichier(s) importé(s)`, 'success')
      setImportOpen(false)
    } catch (err) {
      addNotification?.(err?.message || 'Import échoué', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleGlobalDrop = async (e) => {
    e.preventDefault()
    setGlobalDrag(false)
    const files = e.dataTransfer?.files
    if (files?.length) await runImport(files)
  }

  const handleMoveToFolder = (itemId, folderId) => {
    moveItem(itemId, folderId)
    setItems((prev) => prev.map((i) => (
      i.id === itemId ? { ...i, folderId: folderId || null, updatedAt: Date.now() } : i
    )))
    setDropTargetId(null)
    setDragItemId(null)
  }

  const renderCard = (item) => {
    const isSel = selectedId === item.id
    const preview = item.previewUrl || item.dataUrl
    return (
      <div
        key={item.id}
        draggable
        onDragStart={() => setDragItemId(item.id)}
        onDragEnd={() => { setDragItemId(null); setDropTargetId(null) }}
        onClick={() => handleOpenItem(item)}
        onDoubleClick={() => handleReadItem(item)}
        style={{
          padding: 10, borderRadius: 10, cursor: 'pointer',
          background: isSel ? `${FLB_DARK.accent}22` : FLB_DARK.panel,
          border: `1px solid ${isSel ? FLB_DARK.accent : FLB_DARK.border}`,
          display: 'flex', gap: 6, minHeight: viewMode === 'grid' ? 140 : 56,
          flexDirection: viewMode === 'list' ? 'row' : 'column',
          alignItems: viewMode === 'list' ? 'center' : 'stretch',
        }}
      >
        {viewMode === 'grid' ? (
          preview && !item.mimeType?.includes('pdf') && item.category !== 'pdf' ? (
            <img src={preview} alt="" style={{ width: '100%', height: 72, objectFit: 'cover', borderRadius: 6, background: '#fff' }} />
          ) : (
            <div style={{
              height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: FLB_DARK.bg, borderRadius: 6, fontSize: 28,
            }}>
              {categoryIcon(item.category)}
            </div>
          )
        ) : (
          <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{categoryIcon(item.category)}</span>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: FLB_DARK.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: viewMode === 'list' ? 'nowrap' : 'normal' }}>
            {item.favorite && <span style={{ marginRight: 4 }}>★</span>}
            <HighlightText text={item.name} query={query} />
          </div>
          <div style={{ fontSize: 10, color: FLB_DARK.muted, marginTop: 2 }}>
            {categoryLabel(item.category)} · {formatDate(item.updatedAt)}
          </div>
          {query && item.snippet && viewMode === 'list' && (
            <div style={{ fontSize: 10, color: FLB_DARK.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <HighlightText text={item.snippet} query={query} />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onSaveItem({ ...item, favorite: !item.favorite })
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: item.favorite ? 1 : 0.35, alignSelf: viewMode === 'list' ? 'center' : 'flex-end' }}
        >
          ★
        </button>
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}
      onDragOver={(e) => { e.preventDefault(); setGlobalDrag(true) }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setGlobalDrag(false) }}
      onDrop={handleGlobalDrop}
    >
      <LibrarySidebar
        folders={folders}
        items={items}
        currentFolderId={currentFolderId}
        onSelectFolder={(id) => { setCurrentFolderId(id); setSelectedId(null) }}
        onCreateFolder={onCreateFolder}
        onCreateSubfolder={onCreateSubfolder}
        dropTargetId={dropTargetId}
        dragItemId={dragItemId}
        onDropItem={handleMoveToFolder}
        onDropTargetChange={setDropTargetId}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
        <div style={{
          padding: '10px 14px', borderBottom: `1px solid ${FLB_DARK.border}`,
          display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', background: FLB_DARK.surface,
        }}>
          <input
            type="search"
            placeholder="Recherche rapide (nom, tags, contenu PDF)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 8,
              border: `1px solid ${FLB_DARK.border}`, background: FLB_DARK.panel, color: FLB_DARK.ink, fontSize: 13,
            }}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
            {TYPE_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={selectStyle}>
            <option value="">Tous les tags</option>
            {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
            {SORT_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <button type="button" onClick={() => setViewMode((v) => (v === 'grid' ? 'list' : 'grid'))} style={toolBtn}>
            {viewMode === 'grid' ? '☰ Liste' : '▦ Grille'}
          </button>
          <button type="button" onClick={() => setImportOpen(true)} style={{ ...toolBtn, background: FLB_DARK.accent, color: '#1a1e28', fontWeight: 700 }}>
            + Importer
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} style={toolBtn}>📥 Fichiers</button>
          <input ref={fileRef} type="file" multiple accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.dwg,.dxf" style={{ display: 'none' }} onChange={(e) => runImport(e.target.files)} />
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: '14px 14px max(14px, env(safe-area-inset-bottom))' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: FLB_DARK.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <p style={{ fontSize: 14 }}>Aucun élément{query ? ' pour cette recherche' : ''}</p>
              <p style={{ fontSize: 12 }}>Glissez des fichiers ou cliquez sur Importer</p>
            </div>
          ) : (
            <div style={{
              display: viewMode === 'grid' ? 'grid' : 'flex',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              flexDirection: 'column',
              gap: 10,
            }}>
              {filtered.map(renderCard)}
            </div>
          )}
        </div>

        <div style={{ padding: '6px 14px', borderTop: `1px solid ${FLB_DARK.border}`, fontSize: 11, color: FLB_DARK.muted }}>
          {filtered.length} élément(s){query ? ` · recherche « ${query} »` : ''}
        </div>
      </div>

      <LibraryPreview
        item={selectedItem}
        onClose={() => setSelectedId(null)}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
        onOpen={handleOpenItem}
        onRead={handleReadItem}
        onAnnotate={handleAnnotateItem}
        onRename={handleRenameItem}
      />

      {globalDrag && (
        <div style={{
          position: 'absolute', inset: 0, background: `${FLB_DARK.accent}33`, border: `3px dashed ${FLB_DARK.accent}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10,
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: FLB_DARK.accent2 }}>Déposez pour importer</span>
        </div>
      )}

      <LibraryImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImportFiles={runImport}
        onImportInternal={onImportInternal}
        importing={importing}
      />
    </div>
  )
}

const selectStyle = {
  padding: '7px 10px', borderRadius: 8, border: `1px solid ${FLB_DARK.border}`,
  background: FLB_DARK.panel, color: FLB_DARK.ink, fontSize: 12,
}

const toolBtn = {
  padding: '7px 12px', borderRadius: 8, border: `1px solid ${FLB_DARK.border}`,
  background: FLB_DARK.panel, color: FLB_DARK.ink, cursor: 'pointer', fontSize: 12,
}
