import { useMemo } from 'react'
import { buildFolderTree, getFolderPath } from '@/lib/formalibrary/model'
import { FLB_DARK } from '@/lib/formalibrary/constants'

function FolderNode({ node, depth, currentId, onSelect, itemCounts, dragItemId, dropTargetId, onDropItem, onDropTargetChange }) {
  const count = itemCounts[node.id] || 0
  const isDrop = dropTargetId === node.id && dragItemId
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        onDragOver={(e) => { if (dragItemId) { e.preventDefault(); onDropTargetChange?.(node.id) } }}
        onDragLeave={() => { if (dropTargetId === node.id) onDropTargetChange?.(null) }}
        onDrop={(e) => { e.preventDefault(); if (dragItemId) onDropItem?.(dragItemId, node.id) }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left',
          padding: `6px 10px 6px ${10 + depth * 14}px`, border: 'none', cursor: 'pointer',
          background: isDrop ? `${FLB_DARK.accent}55` : currentId === node.id ? `${FLB_DARK.accent}33` : 'transparent',
          color: FLB_DARK.ink, fontSize: 12, borderRadius: 6,
        }}
      >
        <span>{node.icon || '📁'}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
        {count > 0 && <span style={{ fontSize: 10, color: FLB_DARK.muted }}>{count}</span>}
      </button>
      {node.children?.map((c) => (
        <FolderNode
          key={c.id} node={c} depth={depth + 1} currentId={currentId} onSelect={onSelect}
          itemCounts={itemCounts} dragItemId={dragItemId} dropTargetId={dropTargetId}
          onDropItem={onDropItem} onDropTargetChange={onDropTargetChange}
        />
      ))}
    </>
  )
}

export default function LibrarySidebar({
  folders, items, currentFolderId, onSelectFolder, onCreateFolder, onCreateSubfolder,
  dragItemId, dropTargetId, onDropItem, onDropTargetChange,
}) {
  const tree = useMemo(() => buildFolderTree(folders), [folders])
  const path = useMemo(() => getFolderPath(folders, currentFolderId), [folders, currentFolderId])

  const itemCounts = useMemo(() => {
    const counts = {}
    for (const i of items || []) {
      if (i.folderId) counts[i.folderId] = (counts[i.folderId] || 0) + 1
    }
    return counts
  }, [items])

  return (
    <div style={{
      width: 220, minWidth: 200, borderRight: `1px solid ${FLB_DARK.border}`,
      background: FLB_DARK.surface, display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${FLB_DARK.border}` }}>
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          onDragOver={(e) => { if (dragItemId) { e.preventDefault(); onDropTargetChange?.('root') } }}
          onDrop={(e) => { e.preventDefault(); if (dragItemId) onDropItem?.(dragItemId, null) }}
          style={{
            background: dropTargetId === 'root' && dragItemId ? `${FLB_DARK.accent}55` : !currentFolderId ? `${FLB_DARK.accent}33` : 'transparent',
            border: 'none', color: FLB_DARK.ink, cursor: 'pointer', fontSize: 12, fontWeight: 700, padding: '4px 0', width: '100%', textAlign: 'left',
          }}
        >
          📚 FormaLibrary
        </button>
        {path.length > 0 && (
          <div style={{ fontSize: 10, color: FLB_DARK.muted, marginTop: 4 }}>
            {path.map((p) => p.name).join(' / ')}
          </div>
        )}
      </div>

      <div style={{ padding: '8px 10px', display: 'flex', gap: 4 }}>
        <SmallBtn onClick={onCreateFolder}>+ Dossier</SmallBtn>
        {currentFolderId && <SmallBtn onClick={onCreateSubfolder}>+ Sous-dossier</SmallBtn>}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 6px' }}>
        {tree.map((node) => (
          <FolderNode
            key={node.id} node={node} depth={0} currentId={currentFolderId} onSelect={onSelectFolder}
            itemCounts={itemCounts} dragItemId={dragItemId} dropTargetId={dropTargetId}
            onDropItem={onDropItem} onDropTargetChange={onDropTargetChange}
          />
        ))}
      </div>

      <div style={{ padding: 10, fontSize: 10, color: FLB_DARK.muted, borderTop: `1px solid ${FLB_DARK.border}` }}>
        {folders.length} dossier(s) · {items.length} élément(s)
      </div>
    </div>
  )
}

function SmallBtn({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: '5px 6px', fontSize: 10, borderRadius: 6, cursor: 'pointer',
      border: `1px solid ${FLB_DARK.border}`, background: FLB_DARK.panel, color: FLB_DARK.accent2,
    }}>
      {children}
    </button>
  )
}
