import { useMemo, useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { getFolderAncestors, buildFolderTree, canCreateChildFolder, MAX_FOLDER_DEPTH } from '@/lib/folders/tree'
import { getFolderStats } from '@/lib/folders/stats'
import { FOLDER_VIEWS, FOLDER_SORTS, CONTENT_FILTERS, sortFolderItems, filterFolderItems } from '@/lib/folders/views'
import { setFolderClipboard, getFolderClipboard, clearFolderClipboard } from '@/lib/folders/clipboard'
import { exportFoldersZip, exportFoldersPdf, exportFoldersPngManifest } from '@/lib/folders/export'
import {
  persistFolderDelete, persistFolderMove, persistFolderDuplicate, persistFolderOpen,
} from '@/lib/folderPersistence'
import { formatNotebookDate } from '@/lib/libraryViews'
import FolderContextMenu from '@/components/folders/FolderContextMenu'

export default function FolderExplorer({
  T,
  folders,
  setFolders,
  notebooks,
  setNotebooks,
  subjects,
  userId,
  foldersCloudOk,
  syncingFolders,
  onSyncFolders,
  onCreateFolder,
  onEditFolder,
  onAssignNotebooks,
  onOpenNotebook,
  renderNotebook,
  addNotification,
}) {
  const {
    folderView, setFolderView, folderSort, setFolderSort,
    folderIconSize, setFolderIconSize, folderContentFilter, setFolderContentFilter,
  } = useAppStore()

  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(() => new Set())
  const [contextMenu, setContextMenu] = useState(null)
  const [dragItem, setDragItem] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [treeOpen, setTreeOpen] = useState(true)

  const breadcrumbs = useMemo(
    () => [{ id: null, name: 'Bibliothèque' }, ...getFolderAncestors(folders, currentFolderId)],
    [folders, currentFolderId],
  )

  const items = useMemo(() => {
    const sorted = sortFolderItems(folders, notebooks, folderSort, subjects, currentFolderId)
    return filterFolderItems(sorted, search, folderContentFilter)
  }, [folders, notebooks, folderSort, subjects, currentFolderId, search, folderContentFilter])

  const tree = useMemo(() => buildFolderTree(folders), [folders])
  const currentStats = useMemo(
    () => getFolderStats(currentFolderId, folders, notebooks, { recursive: false }),
    [currentFolderId, folders, notebooks],
  )
  const canAddSubfolder = useMemo(
    () => canCreateChildFolder(folders, currentFolderId),
    [folders, currentFolderId],
  )

  const notifyRes = (res, okMsg) => {
    if (!res?.ok) {
      addNotification(res?.error || 'Erreur dossier', 'error')
      return false
    }
    setFolders(res.folders)
    if (res.warning) addNotification(`${okMsg} — ${res.warning}`, 'info')
    else addNotification(okMsg, 'success')
    return true
  }

  const openFolder = async (folderId) => {
    setCurrentFolderId(folderId)
    setSelected(new Set())
    if (folderId) await persistFolderOpen(userId, folderId)
  }

  const goBack = () => {
    const ancestors = getFolderAncestors(folders, currentFolderId)
    const parent = ancestors.length > 1 ? ancestors[ancestors.length - 2]?.id : null
    openFolder(parent || null)
  }

  const toggleSelect = (key, extend = false) => {
    setSelected((prev) => {
      const next = extend ? new Set(prev) : new Set()
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectedFolderIds = [...selected].filter((k) => k.startsWith('folder:')).map((k) => k.slice(7))
  const selectedNotebookIds = [...selected].filter((k) => k.startsWith('nb:')).map((k) => k.slice(3))

  const handleDeleteFolder = async (folderId) => {
    if (!confirm('Supprimer ce dossier ? Les sous-dossiers seront remontés, les carnets conservés.')) return
    const res = await persistFolderDelete(userId, folderId)
    if (!notifyRes(res, 'Dossier supprimé')) return
    if (currentFolderId === folderId) setCurrentFolderId(null)
  }

  const handleDuplicate = async (folderId) => {
    const res = await persistFolderDuplicate(userId, folderId)
    notifyRes(res, 'Dossier dupliqué')
  }

  const handleMoveFolder = async (folderId, targetParentId) => {
    const res = await persistFolderMove(userId, folderId, targetParentId)
    notifyRes(res, 'Dossier déplacé')
  }

  const handleDropOnFolder = async (targetFolderId) => {
    if (!dragItem) return
    if (dragItem.kind === 'folder' && dragItem.id !== targetFolderId) {
      await handleMoveFolder(dragItem.id, targetFolderId)
    }
    if (dragItem.kind === 'notebook') {
      onAssignNotebooks?.([dragItem.id], targetFolderId)
    }
    setDragItem(null)
  }

  const handleCopy = (folderIds) => {
    setFolderClipboard({ mode: 'copy', folderIds })
    addNotification(`${folderIds.length} dossier(s) copié(s)`, 'success')
  }

  const handleCut = (folderIds) => {
    setFolderClipboard({ mode: 'cut', folderIds })
    addNotification(`${folderIds.length} dossier(s) coupé(s)`, 'info')
  }

  const handlePaste = async (targetParentId) => {
    const clip = getFolderClipboard()
    if (!clip?.folderIds?.length) return
    if (clip.mode === 'cut') {
      for (const fid of clip.folderIds) {
        await handleMoveFolder(fid, targetParentId)
      }
      clearFolderClipboard()
      addNotification('Dossier(s) collé(s)', 'success')
      return
    }
    for (const fid of clip.folderIds) {
      await handleDuplicate(fid)
    }
    addNotification('Copie collée', 'success')
  }

  const runExport = async (type) => {
    const folderIds = selectedFolderIds.length ? selectedFolderIds : (currentFolderId ? [currentFolderId] : [])
    if (!folderIds.length) {
      addNotification('Sélectionnez un dossier à exporter', 'error')
      return
    }
    setExporting(true)
    try {
      const payload = { folderIds, folders, notebooks, includeSubfolders: true }
      if (type === 'zip') await exportFoldersZip(payload)
      else if (type === 'pdf') await exportFoldersPdf(payload)
      else await exportFoldersPngManifest(payload)
      addNotification(`Export ${type.toUpperCase()} terminé`, 'success')
    } catch (err) {
      addNotification(err?.message || 'Export échoué', 'error')
    } finally {
      setExporting(false)
    }
  }

  const openContext = (e, payload) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, ...payload })
  }

  const renderFolderCard = (folder) => {
    const stats = getFolderStats(folder.id, folders, notebooks, { recursive: false })
    const key = `folder:${folder.id}`
    const isSel = selected.has(key)
    const sz = folderIconSize
    return (
      <div
        key={folder.id}
        draggable
        onDragStart={() => setDragItem({ kind: 'folder', id: folder.id })}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleDropOnFolder(folder.id) }}
        onClick={(e) => toggleSelect(key, e.ctrlKey || e.metaKey)}
        onDoubleClick={() => openFolder(folder.id)}
        onContextMenu={(e) => openContext(e, { type: 'folder', folder })}
        style={{
          padding: 12, borderRadius: 12, cursor: 'pointer',
          background: isSel ? `${T.accent}14` : `${folder.color || '#3d6b8c'}10`,
          border: `1px solid ${isSel ? T.accent : T.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          minHeight: sz + 48, transition: 'border-color .15s',
        }}
      >
        <div style={{
          width: sz, height: sz, borderRadius: 12,
          background: `linear-gradient(145deg, ${folder.color || '#3d6b8c'}33, ${folder.color || '#3d6b8c'}18)`,
          border: `1px solid ${folder.color || '#3d6b8c'}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sz * 0.45, position: 'relative',
        }}>
          {folder.icon || folder.e || '📁'}
          {stats.hasSubfolders && (
            <span style={{ position: 'absolute', bottom: 4, right: 4, fontSize: 10, background: T.surface, borderRadius: 4, padding: '0 3px', border: `1px solid ${T.border}` }}>+</span>
          )}
        </div>
        <div style={{ fontWeight: 700, fontSize: 12, color: T.ink, textAlign: 'center', wordBreak: 'break-word', width: '100%' }}>{folder.name}</div>
        <div style={{ fontSize: 10, color: T.muted }}>{stats.notebookCount} élément{stats.notebookCount !== 1 ? 's' : ''}{stats.subfolderCount ? ` · ${stats.subfolderCount} ss-doss.` : ''}</div>
      </div>
    )
  }

  const renderDetailsRow = (item) => {
    const key = `${item.kind}:${item.id}`
    const isSel = selected.has(key)
    const stats = item.kind === 'folder'
      ? getFolderStats(item.id, folders, notebooks, { recursive: false })
      : item.stats
    return (
      <tr
        key={key}
        onClick={(e) => toggleSelect(key, e.ctrlKey || e.metaKey)}
        onDoubleClick={() => (item.kind === 'folder' ? openFolder(item.id) : onOpenNotebook?.(item.raw))}
        onContextMenu={(e) => openContext(e, item.kind === 'folder' ? { type: 'folder', folder: item.raw } : { type: 'notebook', notebook: item.raw })}
        style={{ background: isSel ? `${T.accent}10` : 'transparent', cursor: 'pointer' }}
      >
        <td style={{ padding: '8px 10px', fontSize: 12 }}>{item.kind === 'folder' ? '📁' : '📓'}</td>
        <td style={{ padding: '8px 10px', fontSize: 12, fontWeight: 600, color: T.ink }}>{item.name}</td>
        <td style={{ padding: '8px 10px', fontSize: 11, color: T.muted }}>{item.kind === 'folder' ? 'Dossier' : 'Carnet'}</td>
        <td style={{ padding: '8px 10px', fontSize: 11, color: T.muted }}>{formatNotebookDate(item.updatedAt)}</td>
        <td style={{ padding: '8px 10px', fontSize: 11, color: T.muted }}>{item.kind === 'folder' ? stats.totalNotebookCount : stats.pageCount} contenu</td>
        <td style={{ padding: '8px 10px', fontSize: 11, color: T.muted }}>{item.kind === 'folder' ? stats.totalSizeLabel : stats.sizeLabel}</td>
        <td style={{ padding: '8px 10px', fontSize: 11, color: T.muted }}>{item.kind === 'folder' ? (stats.isEmpty ? 'Vide' : 'Actif') : '—'}</td>
      </tr>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 16, minHeight: 420 }}>
      {treeOpen && (
        <aside style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${T.border}`, paddingRight: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 8 }}>ARBRESCENCE</div>
          <button type="button" onClick={() => openFolder(null)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', marginBottom: 4, border: 'none', borderRadius: 6, background: !currentFolderId ? `${T.accent}18` : 'transparent', color: T.ink, cursor: 'pointer', fontSize: 12 }}>📚 Bibliothèque</button>
          {tree.map((node) => (
            <TreeNode key={node.id} node={node} depth={0} currentId={currentFolderId} T={T} onOpen={openFolder} onDrop={handleDropOnFolder} />
          ))}
        </aside>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <button type="button" onClick={() => setTreeOpen((v) => !v)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', fontSize: 11 }}>{treeOpen ? '◀' : '▶'} Arbre</button>
          {currentFolderId && (
            <button type="button" onClick={goBack} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', fontSize: 11 }}>← Retour</button>
          )}
          <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', fontSize: 12, color: T.muted, minWidth: 120 }}>
            {breadcrumbs.map((cr, i) => (
              <span key={cr.id ?? 'root'} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span>›</span>}
                <button type="button" onClick={() => openFolder(cr.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: i === breadcrumbs.length - 1 ? T.ink : T.accent, fontWeight: i === breadcrumbs.length - 1 ? 700 : 500, padding: 0, fontSize: 12 }}>{cr.name}</button>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14, alignItems: 'center' }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" style={{ flex: 1, minWidth: 140, padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }} />
          {FOLDER_VIEWS.map((v) => (
            <button key={v.id} type="button" onClick={() => setFolderView(v.id)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${folderView === v.id ? T.accent : T.border}`, background: folderView === v.id ? `${T.accent}18` : T.bg, cursor: 'pointer', fontSize: 11 }} title={v.label}>{v.icon}</button>
          ))}
          <select value={folderSort} onChange={(e) => setFolderSort(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 11 }}>
            {FOLDER_SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={folderContentFilter} onChange={(e) => setFolderContentFilter(e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 11 }}>
            {CONTENT_FILTERS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
          <select value={folderIconSize} onChange={(e) => setFolderIconSize(Number(e.target.value))} style={{ padding: '6px 8px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 11 }} title="Taille icônes">
            <option value={48}>S</option>
            <option value={64}>M</option>
            <option value={80}>L</option>
            <option value={96}>XL</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => canAddSubfolder && onCreateFolder?.(currentFolderId)}
            disabled={!canAddSubfolder}
            title={canAddSubfolder ? 'Nouveau dossier' : `Profondeur max ${MAX_FOLDER_DEPTH} niveaux`}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              background: canAddSubfolder ? `linear-gradient(135deg,${T.accent},${T.a2})` : T.border,
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              cursor: canAddSubfolder ? 'pointer' : 'not-allowed',
              opacity: canAddSubfolder ? 1 : 0.65,
            }}
          >
            + Dossier
          </button>
          {userId && (
            <button type="button" onClick={onSyncFolders} disabled={syncingFolders} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, fontSize: 11, cursor: 'pointer' }}>{syncingFolders ? 'Sync…' : '☁ Sync'}</button>
          )}
          <button type="button" disabled={exporting} onClick={() => runExport('zip')} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, fontSize: 11, cursor: 'pointer' }}>ZIP</button>
          <button type="button" disabled={exporting} onClick={() => runExport('pdf')} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, fontSize: 11, cursor: 'pointer' }}>PDF</button>
          <button type="button" disabled={exporting} onClick={() => runExport('png')} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, fontSize: 11, cursor: 'pointer' }}>Aperçu</button>
          {selected.size > 0 && (
            <span style={{ fontSize: 11, color: T.muted }}>{selected.size} sélectionné(s)</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: T.muted }}>
            {currentStats.notebookCount} carnet(s) · {currentStats.subfolderCount} sous-dossier(s) · {currentStats.totalSizeLabel}
            {foldersCloudOk === false && ' · 💾 local'}
          </span>
        </div>

        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
            <div style={{ fontSize: 14 }}>Dossier vide</div>
            {canAddSubfolder ? (
              <button type="button" onClick={() => onCreateFolder?.(currentFolderId)} style={{ marginTop: 12, padding: '8px 16px', borderRadius: 8, background: T.accent, border: 'none', color: '#fff', cursor: 'pointer' }}>Créer un sous-dossier</button>
            ) : (
              <div style={{ marginTop: 12, fontSize: 11, color: T.muted }}>Profondeur max {MAX_FOLDER_DEPTH} niveaux</div>
            )}
          </div>
        )}

        {folderView === 'details' && items.length > 0 && (
          <div style={{ overflowX: 'auto', border: `1px solid ${T.border}`, borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                  {['', 'Nom', 'Type', 'Modifié', 'Contenu', 'Taille', 'Statut'].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{items.map(renderDetailsRow)}</tbody>
            </table>
          </div>
        )}

        {folderView === 'list' && items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map((item) => {
              if (item.kind === 'folder') {
                const f = item.raw
                const stats = getFolderStats(f.id, folders, notebooks, { recursive: false })
                return (
                  <div key={f.id} onDoubleClick={() => openFolder(f.id)} onContextMenu={(e) => openContext(e, { type: 'folder', folder: f })}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, cursor: 'pointer', background: T.surface }}>
                    <span style={{ fontSize: 24 }}>{f.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: T.ink }}>{f.name}</div>
                      <div style={{ fontSize: 10, color: T.muted }}>{stats.notebookCount} carnets · {stats.totalSizeLabel}</div>
                    </div>
                  </div>
                )
              }
              return (
                <div key={item.id} onDoubleClick={() => onOpenNotebook?.(item.raw)} style={{ borderRadius: 8, overflow: 'hidden' }}>
                  {renderNotebook?.(item.raw, 'list')}
                </div>
              )
            })}
          </div>
        )}

        {folderView === 'grid' && items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${Math.max(folderIconSize + 40, 140)}px, 1fr))`, gap: 11 }}>
            {items.map((item) => (
              item.kind === 'folder'
                ? renderFolderCard(item.raw)
                : (
                  <div key={item.id} draggable onDragStart={() => setDragItem({ kind: 'notebook', id: item.id })}
                    onContextMenu={(e) => openContext(e, { type: 'notebook', notebook: item.raw })}
                    onDoubleClick={() => onOpenNotebook?.(item.raw)}>
                    {renderNotebook?.(item.raw, 'grid')}
                  </div>
                )
            ))}
          </div>
        )}
      </div>

      {contextMenu && (
        <FolderContextMenu
          T={T}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          folders={folders}
          currentFolderId={currentFolderId}
          payload={contextMenu}
          onOpenFolder={openFolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={handleDeleteFolder}
          onDuplicateFolder={handleDuplicate}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onAssignNotebooks={onAssignNotebooks}
          onOpenNotebook={onOpenNotebook}
          onExport={runExport}
        />
      )}
    </div>
  )
}

function TreeNode({ node, depth, currentId, T, onOpen, onDrop }) {
  const [open, setOpen] = useState(depth < 1)
  const hasKids = node.children?.length > 0
  return (
    <div style={{ marginLeft: depth * 10 }}>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onDrop(node.id) }}
        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
      >
        {hasKids ? (
          <button type="button" onClick={() => setOpen((v) => !v)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 9, color: T.muted, width: 14 }}>{open ? '▼' : '▶'}</button>
        ) : <span style={{ width: 14 }} />}
        <button type="button" onClick={() => onOpen(node.id)} style={{ flex: 1, textAlign: 'left', padding: '4px 6px', border: 'none', borderRadius: 6, background: currentId === node.id ? `${T.accent}18` : 'transparent', color: T.ink, cursor: 'pointer', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.icon} {node.name}
        </button>
      </div>
      {open && hasKids && node.children.map((ch) => (
        <TreeNode key={ch.id} node={ch} depth={depth + 1} currentId={currentId} T={T} onOpen={onOpen} onDrop={onDrop} />
      ))}
    </div>
  )
}
