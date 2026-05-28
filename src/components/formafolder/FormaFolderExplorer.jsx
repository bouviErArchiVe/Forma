/** FormaFolder — explorateur central (dossiers + carnets + assets) */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '@/components/BrandLogo'
import useAppStore from '@/stores/useAppStore'
import { mapActionError } from '@/lib/userMessages'
import { getFolderAncestors, buildFolderTree, canCreateChildFolder } from '@/lib/folders/tree'
import { getFolderStats } from '@/lib/folders/stats'
import { FOLDER_VIEWS, FOLDER_SORTS } from '@/lib/folders/views'
import { setFolderClipboard, getFolderClipboard, clearFolderClipboard } from '@/lib/folders/clipboard'
import { exportFoldersZip, exportFoldersPdf } from '@/lib/folders/export'
import { persistFolderDelete, persistFolderMove, persistFolderDuplicate, persistFolderOpen, persistFolderUpdate } from '@/lib/folderPersistence'
import { formatNotebookDate } from '@/lib/libraryViews'
import { formatBytes } from '@/lib/folders/stats'
import FolderContextMenu from '@/components/folders/FolderContextMenu'
import {
  FOLDER_MODES, MASTERFORMAT_SECTIONS, TYPE_FILTERS, FF_DARK,
  assetTypeIcon, assetTypeLabel, masterFormatLabel, modeLabel,
} from '@/lib/formafolder/constants'
import {
  listAssets, saveAsset, deleteAsset, duplicateAsset, moveAsset, importFileAsAsset,
} from '@/lib/formafolder/assets'
import { buildExplorerItems, searchExplorerItems, highlightParts } from '@/lib/formafolder/search'
import { openItemInModule, integrationActions, downloadAsset } from '@/lib/formafolder/integrations'

function NameHighlight({ text, query, style }) {
  const parts = highlightParts(text, query)
  return (
    <span style={style}>
      {parts.map((p, i) => (
        <span key={i} style={p.match ? { background: '#ffe06655', borderRadius: 2 } : undefined}>{p.text}</span>
      ))}
    </span>
  )
}

export default function FormaFolderExplorer({
  T = FF_DARK,
  folders, setFolders, notebooks, setNotebooks, subjects, userId,
  foldersCloudOk, syncingFolders, onSyncFolders,
  onCreateFolder, onEditFolder, onAssignNotebooks, onOpenNotebook, renderNotebook, addNotification,
  showHeader = true,
}) {
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const {
    folderView, setFolderView, folderSort, setFolderSort,
    folderIconSize, setFolderIconSize,
  } = useAppStore()

  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [assets, setAssets] = useState([])
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [mfFilter, setMfFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [previewItem, setPreviewItem] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [dragItem, setDragItem] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [treeOpen, setTreeOpen] = useState(true)
  const [importing, setImporting] = useState(false)

  const refreshAssets = useCallback(() => setAssets(listAssets(userId)), [userId])
  useEffect(() => { refreshAssets() }, [refreshAssets])

  const breadcrumbs = useMemo(
    () => [{ id: null, name: 'FormaFolder' }, ...getFolderAncestors(folders, currentFolderId)],
    [folders, currentFolderId],
  )

  const rawItems = useMemo(
    () => buildExplorerItems({
      folders, notebooks, assets, subjects, folderId: currentFolderId,
      modeFilter: modeFilter === 'all' ? null : modeFilter,
      mfFilter: mfFilter || null,
    }),
    [folders, notebooks, assets, subjects, currentFolderId, modeFilter, mfFilter],
  )

  const items = useMemo(() => {
    const searched = searchExplorerItems(rawItems, search, { typeFilter, tagFilter })
    if (folderSort === 'name') return searched.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    if (folderSort === 'size') return searched.sort((a, b) => (b.bytes || 0) - (a.bytes || 0))
    if (folderSort === 'type') return searched.sort((a, b) => a.kind.localeCompare(b.kind))
    return searched.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
  }, [rawItems, search, typeFilter, tagFilter, folderSort])

  const tree = useMemo(() => buildFolderTree(folders), [folders])
  const currentStats = useMemo(
    () => getFolderStats(currentFolderId, folders, notebooks, { recursive: false }),
    [currentFolderId, folders, notebooks],
  )
  const canAddSubfolder = useMemo(() => canCreateChildFolder(folders, currentFolderId), [folders, currentFolderId])

  const notifyRes = (res, okMsg) => {
    if (!res?.ok) { addNotification(res?.error || 'Erreur dossier', 'error'); return false }
    setFolders(res.folders)
    if (res.warning) addNotification(`${okMsg} — ${res.warning}`, 'info')
    else addNotification(okMsg, 'success')
    return true
  }

  const openFolder = async (folderId) => {
    setCurrentFolderId(folderId)
    setSelected(new Set())
    setPreviewItem(null)
    if (folderId) await persistFolderOpen(userId, folderId)
  }

  const itemKey = (item) => `${item.kind}:${item.id}`

  const openItem = (item) => {
    if (item.kind === 'folder') openFolder(item.id)
    else if (item.kind === 'notebook') onOpenNotebook?.(item.raw)
    else {
      setPreviewItem(item)
      if (!openItemInModule(navigate, item, addNotification) && item.raw?.dataUrl) downloadAsset(item.raw)
    }
  }

  const toggleFavorite = async (item) => {
    if (item.kind === 'folder') {
      const res = await persistFolderUpdate(userId, item.id, { favorite: !item.favorite })
      if (res?.ok) setFolders(res.folders)
    } else if (item.kind === 'asset') {
      saveAsset(userId, { ...item.raw, favorite: !item.favorite })
      refreshAssets()
    }
  }

  const handleImportFiles = async (files) => {
    if (!files?.length) return
    setImporting(true)
    try {
      for (const file of files) {
        const mode = folders.find((f) => f.id === currentFolderId)?.mode
        const meta = {}
        if (mode === 'normes') meta.type = 'norm'
        if (mode === 'fiches') meta.type = 'fiche'
        await importFileAsAsset(userId, file, currentFolderId, meta)
      }
      refreshAssets()
      addNotification(`${files.length} fichier(s) importé(s)`, 'success')
    } catch (err) {
      addNotification(mapActionError(err, 'Import échoué'), 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleDeleteAsset = (id) => {
    if (!confirm('Supprimer ce fichier ?')) return
    deleteAsset(userId, id)
    refreshAssets()
    if (previewItem?.id === id) setPreviewItem(null)
    addNotification('Fichier supprimé', 'success')
  }

  const handleMoveFolder = async (folderId, targetParentId) => {
    const res = await persistFolderMove(userId, folderId, targetParentId)
    notifyRes(res, 'Dossier déplacé')
  }

  const handleDropOnFolder = async (targetFolderId) => {
    if (!dragItem) return
    if (dragItem.kind === 'folder') await handleMoveFolder(dragItem.id, targetFolderId)
    if (dragItem.kind === 'notebook') onAssignNotebooks?.([dragItem.id], targetFolderId)
    if (dragItem.kind === 'asset') { moveAsset(userId, dragItem.id, targetFolderId); refreshAssets() }
    setDragItem(null)
  }

  const runExport = async (type) => {
    const folderIds = [...selected].filter((k) => k.startsWith('folder:')).map((k) => k.slice(7))
    const ids = folderIds.length ? folderIds : (currentFolderId ? [currentFolderId] : [])
    if (!ids.length) { addNotification('Sélectionnez un dossier', 'error'); return }
    setExporting(true)
    try {
      const payload = { folderIds: ids, folders, notebooks, includeSubfolders: true }
      if (type === 'zip') await exportFoldersZip(payload)
      else await exportFoldersPdf(payload)
      addNotification(`Export ${type.toUpperCase()} terminé`, 'success')
    } catch (err) {
      addNotification(mapActionError(err, 'Export échoué'), 'error')
    } finally {
      setExporting(false)
    }
  }

  const renderItemIcon = (item) => {
    if (item.kind === 'folder') return item.raw.icon || '📁'
    if (item.kind === 'notebook') return '📓'
    return assetTypeIcon(item.assetType)
  }

  const renderGridCard = (item) => {
    const key = itemKey(item)
    const isSel = selected.has(key)
    const sz = folderIconSize
    return (
      <div
        key={key}
        draggable
        onDragStart={() => setDragItem({ kind: item.kind, id: item.id })}
        onClick={(e) => {
          if (e.ctrlKey || e.metaKey) {
            setSelected((p) => { const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n })
          } else { setPreviewItem(item) }
        }}
        onDoubleClick={() => openItem(item)}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, item }) }}
        style={{
          padding: 12, borderRadius: 12, cursor: 'pointer',
          background: isSel ? `${T.accent || FF_DARK.accent}14` : T.surface || FF_DARK.panel,
          border: `1px solid ${isSel ? (T.accent || FF_DARK.accent) : (T.border || FF_DARK.border)}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minHeight: sz + 48,
        }}
      >
        <div style={{ fontSize: sz * 0.5, position: 'relative' }}>
          {renderItemIcon(item)}
          {item.favorite && <span style={{ position: 'absolute', top: -4, right: -8, fontSize: 12 }}>⭐</span>}
        </div>
        <NameHighlight text={item.name} query={search} style={{ fontWeight: 700, fontSize: 12, color: T.ink, textAlign: 'center', wordBreak: 'break-word', width: '100%' }} />
        <div style={{ fontSize: 10, color: T.muted }}>
          {item.kind === 'folder' ? modeLabel(item.mode) : item.kind === 'asset' ? assetTypeLabel(item.assetType) : 'Carnet'}
          {item.pageCount ? ` · ${item.pageCount} p.` : ''}
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavorite(item) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: item.favorite ? 1 : 0.35 }}>★</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: showHeader ? '100dvh' : 420, background: FF_DARK.bg, color: FF_DARK.ink }}>
      {showHeader && (
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${FF_DARK.border}`, background: FF_DARK.surface }}>
          <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <BrandLogo size="sm" showText={false} />
          </button>
          <h1 style={{ margin: 0, fontSize: 17, flex: 1 }}>FormaFolder</h1>
          <span style={{ fontSize: 11, color: FF_DARK.muted }}>Explorateur central</span>
        </header>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {treeOpen && (
          <aside style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${FF_DARK.border}`, padding: 12, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: FF_DARK.muted, marginBottom: 8 }}>ARBRESCENCE</div>
            <button type="button" onClick={() => openFolder(null)} style={{ ...treeBtn, background: !currentFolderId ? `${FF_DARK.accent}18` : 'transparent' }}>📚 Racine</button>
            {tree.map((node) => <TreeNode key={node.id} node={node} depth={0} currentId={currentFolderId} onOpen={openFolder} onDrop={handleDropOnFolder} />)}
            <div style={{ marginTop: 16, fontSize: 10, fontWeight: 700, color: FF_DARK.muted }}>MODES</div>
            {FOLDER_MODES.map((m) => (
              <button key={m.id} type="button" onClick={() => setModeFilter(modeFilter === m.id ? 'all' : m.id)} style={{ ...treeBtn, background: modeFilter === m.id ? `${FF_DARK.accent}18` : 'transparent' }}>{m.icon} {m.label}</button>
            ))}
          </aside>
        )}

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', padding: 12, overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <button type="button" onClick={() => setTreeOpen((v) => !v)} style={btnSm}>{treeOpen ? '◀' : '▶'}</button>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: 12, color: FF_DARK.muted }}>
              {breadcrumbs.map((cr, i) => (
                <span key={cr.id ?? 'root'}>{i > 0 && ' › '}
                  <button type="button" onClick={() => openFolder(cr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === breadcrumbs.length - 1 ? FF_DARK.ink : FF_DARK.accent, fontWeight: i === breadcrumbs.length - 1 ? 700 : 500, padding: 0 }}>{cr.name}</button>
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Recherche rapide (nom, PDF, tags)…" style={inputStyle} />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={selectStyle}>
              {TYPE_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="Tag…" style={{ ...inputStyle, maxWidth: 100 }} />
            {FOLDER_VIEWS.map((v) => (
              <button key={v.id} type="button" onClick={() => setFolderView(v.id)} style={{ ...btnSm, borderColor: folderView === v.id ? FF_DARK.accent : FF_DARK.border, background: folderView === v.id ? `${FF_DARK.accent}18` : FF_DARK.panel }}>{v.icon}</button>
            ))}
            <select value={folderSort} onChange={(e) => setFolderSort(e.target.value)} style={selectStyle}>{FOLDER_SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, alignItems: 'center' }}>
            <button type="button" onClick={() => canAddSubfolder && onCreateFolder?.(currentFolderId)} disabled={!canAddSubfolder} style={{ ...btnSm, background: FF_DARK.accent, color: '#fff', border: 'none' }}>+ Dossier</button>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={importing} style={btnSm}>+ Fichiers</button>
            {userId && <button type="button" onClick={onSyncFolders} disabled={syncingFolders} style={btnSm}>{syncingFolders ? 'Sync…' : '☁ Sync'}</button>}
            <button type="button" disabled={exporting} onClick={() => runExport('zip')} style={btnSm}>ZIP</button>
            <button type="button" disabled={exporting} onClick={() => runExport('pdf')} style={btnSm}>PDF</button>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: FF_DARK.muted }}>
              {items.length} élément(s) · {currentStats.totalSizeLabel}{foldersCloudOk === false && ' · 💾 local'}
            </span>
          </div>

          <input ref={fileRef} type="file" multiple hidden accept=".pdf,image/*,.txt,.md,.docx,.csv" onChange={(e) => { handleImportFiles(e.target.files); e.target.value = '' }} />

          <div style={{ flex: 1, display: 'flex', gap: 12, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleImportFiles(e.dataTransfer?.files) }}>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: FF_DARK.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
                  <div>Dossier vide — importez ou créez</div>
                </div>
              ) : folderView === 'details' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead><tr style={{ borderBottom: `1px solid ${FF_DARK.border}` }}>
                    {['', 'Nom', 'Type', 'Modifié', 'Pages', 'Taille'].map((h) => <th key={h} style={{ padding: 8, textAlign: 'left', color: FF_DARK.muted }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={itemKey(item)} onDoubleClick={() => openItem(item)} onClick={() => setPreviewItem(item)} style={{ cursor: 'pointer', borderBottom: `1px solid ${FF_DARK.border}22` }}>
                        <td style={{ padding: 8 }}>{renderItemIcon(item)}</td>
                        <td style={{ padding: 8 }}><NameHighlight text={item.name} query={search} /></td>
                        <td style={{ padding: 8, color: FF_DARK.muted }}>{item.kind === 'asset' ? assetTypeLabel(item.assetType) : item.kind}</td>
                        <td style={{ padding: 8, color: FF_DARK.muted }}>{formatNotebookDate(item.updatedAt)}</td>
                        <td style={{ padding: 8, color: FF_DARK.muted }}>{item.pageCount || item.stats?.pageCount || '—'}</td>
                        <td style={{ padding: 8, color: FF_DARK.muted }}>{item.bytes ? formatBytes(item.bytes) : item.stats?.sizeLabel || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : folderView === 'list' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.map((item) => item.kind === 'notebook' ? (
                    <div key={item.id} onDoubleClick={() => openItem(item)}>{renderNotebook?.(item.raw, 'list')}</div>
                  ) : (
                    <div key={itemKey(item)} onDoubleClick={() => openItem(item)} onClick={() => setPreviewItem(item)} style={{ display: 'flex', gap: 12, padding: 10, borderRadius: 8, border: `1px solid ${FF_DARK.border}`, cursor: 'pointer' }}>
                      <span style={{ fontSize: 22 }}>{renderItemIcon(item)}</span>
                      <div><NameHighlight text={item.name} query={search} style={{ fontWeight: 700 }} /><div style={{ fontSize: 10, color: FF_DARK.muted }}>{formatNotebookDate(item.updatedAt)}</div></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(folderIconSize + 40, 140)}px, 1fr))`, gap: 11 }}>
                  {items.map((item) => item.kind === 'notebook' ? (
                    <div key={item.id} onDoubleClick={() => openItem(item)}>{renderNotebook?.(item.raw, 'grid')}</div>
                  ) : renderGridCard(item))}
                </div>
              )}
            </div>

            {previewItem && (
              <aside style={{ width: 280, flexShrink: 0, borderLeft: `1px solid ${FF_DARK.border}`, padding: 12, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{previewItem.name}</div>
                <div style={{ fontSize: 11, color: FF_DARK.muted, marginBottom: 12 }}>
                  {previewItem.kind === 'asset' ? assetTypeLabel(previewItem.assetType) : previewItem.kind}
                  {previewItem.pageCount ? ` · ${previewItem.pageCount} pages` : ''}
                  {previewItem.bytes ? ` · ${formatBytes(previewItem.bytes)}` : ''}
                </div>
                {(previewItem.raw?.previewUrl || previewItem.raw?.dataUrl) && (
                  <img src={previewItem.raw.previewUrl || previewItem.raw.dataUrl} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 12, border: `1px solid ${FF_DARK.border}` }} />
                )}
                {previewItem.raw?.textContent && (
                  <div style={{ fontSize: 11, color: FF_DARK.muted, maxHeight: 120, overflow: 'auto', marginBottom: 12, whiteSpace: 'pre-wrap' }}>{previewItem.raw.textContent.slice(0, 400)}…</div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button type="button" onClick={() => openItem(previewItem)} style={btnSm}>Ouvrir</button>
                  {integrationActions(previewItem).map((a) => (
                    <button key={a.id} type="button" onClick={() => navigate(a.route)} style={btnSm}>→ {a.label}</button>
                  ))}
                  {previewItem.kind === 'asset' && (
                    <>
                      <button type="button" onClick={() => { duplicateAsset(userId, previewItem.id); refreshAssets() }} style={btnSm}>Dupliquer</button>
                      <button type="button" onClick={() => handleDeleteAsset(previewItem.id)} style={{ ...btnSm, color: '#f88' }}>Supprimer</button>
                    </>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <FolderContextMenu
          T={T}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          folders={folders}
          currentFolderId={currentFolderId}
          payload={contextMenu.item?.kind === 'folder' ? { type: 'folder', folder: contextMenu.item.raw } : contextMenu.item?.kind === 'notebook' ? { type: 'notebook', notebook: contextMenu.item.raw } : { type: 'empty' }}
          onOpenFolder={openFolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={async (id) => { const res = await persistFolderDelete(userId, id); notifyRes(res, 'Supprimé') }}
          onDuplicateFolder={async (id) => notifyRes(await persistFolderDuplicate(userId, id), 'Dupliqué')}
          onCopy={(ids) => { setFolderClipboard({ mode: 'copy', folderIds: ids }); addNotification('Copié', 'success') }}
          onCut={(ids) => { setFolderClipboard({ mode: 'cut', folderIds: ids }); addNotification('Coupé', 'info') }}
          onPaste={async (pid) => {
            const clip = getFolderClipboard()
            if (!clip?.folderIds?.length) return
            for (const fid of clip.folderIds) await handleMoveFolder(fid, pid)
            if (clip.mode === 'cut') clearFolderClipboard()
          }}
          onAssignNotebooks={onAssignNotebooks}
          onOpenNotebook={onOpenNotebook}
          onExport={runExport}
        />
      )}
    </div>
  )
}

function TreeNode({ node, depth, currentId, onOpen, onDrop }) {
  const [open, setOpen] = useState(depth < 1)
  const hasKids = node.children?.length > 0
  return (
    <div style={{ marginLeft: depth * 8 }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {hasKids ? <button type="button" onClick={() => setOpen((v) => !v)} style={{ border: 'none', background: 'none', fontSize: 9, width: 14 }}>{open ? '▼' : '▶'}</button> : <span style={{ width: 14 }} />}
        <button type="button" onClick={() => onOpen(node.id)} style={{ ...treeBtn, flex: 1, background: currentId === node.id ? `${FF_DARK.accent}18` : 'transparent' }}>{node.icon} {node.name}</button>
      </div>
      {open && hasKids && node.children.map((ch) => <TreeNode key={ch.id} node={ch} depth={depth + 1} currentId={currentId} onOpen={onOpen} onDrop={onDrop} />)}
    </div>
  )
}

const btnSm = { padding: '6px 10px', borderRadius: 6, border: `1px solid ${FF_DARK.border}`, background: FF_DARK.panel, color: FF_DARK.ink, cursor: 'pointer', fontSize: 11 }
const treeBtn = { display: 'block', width: '100%', textAlign: 'left', padding: '5px 8px', marginBottom: 2, border: 'none', borderRadius: 6, color: FF_DARK.ink, cursor: 'pointer', fontSize: 11 }
const inputStyle = { flex: 1, minWidth: 140, padding: '8px 10px', borderRadius: 8, border: `1px solid ${FF_DARK.border}`, background: FF_DARK.panel, color: FF_DARK.ink, fontSize: 12 }
const selectStyle = { padding: '6px 8px', borderRadius: 8, border: `1px solid ${FF_DARK.border}`, background: FF_DARK.panel, color: FF_DARK.ink, fontSize: 11 }
