import { useEffect, useRef } from 'react'

export default function FolderContextMenu({
  T, x, y, onClose, folders, currentFolderId, payload,
  onOpenFolder, onEditFolder, onDeleteFolder, onDuplicateFolder,
  onCopy, onCut, onPaste, onAssignNotebooks, onExport, onOpenNotebook,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [onClose])

  const item = (label, onClick, danger = false) => (
    <button
      type="button"
      key={label}
      onClick={() => { onClick(); onClose() }}
      style={{
        display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px',
        border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12,
        color: danger ? '#e94560' : T.ink,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${T.accent}12` }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {label}
    </button>
  )

  const folder = payload.type === 'folder' ? payload.folder : null
  const notebook = payload.type === 'notebook' ? payload.notebook : null

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed', left: x, top: y, zIndex: 10000,
        minWidth: 180, background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.18)', padding: '4px 0',
      }}
    >
      {folder && (
        <>
          {item('Ouvrir', () => onOpenFolder(folder.id))}
          {item('Renommer / apparence', () => onEditFolder(folder))}
          {item('Dupliquer', () => onDuplicateFolder(folder.id))}
          {item('Copier', () => onCopy([folder.id]))}
          {item('Couper', () => onCut([folder.id]))}
          {item('Coller ici', () => onPaste(folder.id))}
          {item('Exporter ZIP', () => onExport('zip'))}
          {item('Exporter PDF', () => onExport('pdf'))}
          {item('Supprimer', () => onDeleteFolder(folder.id), true)}
        </>
      )}
      {notebook && (
        <>
          {item('Ouvrir le carnet', () => onOpenNotebook?.(notebook))}
          {item('Déplacer vers…', () => onAssignNotebooks?.([notebook.id], currentFolderId))}
          {folders.filter((f) => f.id !== notebook.folder_id).slice(0, 8).map((f) =>
            item(`→ ${f.name}`, () => onAssignNotebooks?.([notebook.id], f.id))
          )}
        </>
      )}
      {!folder && !notebook && (
        <>
          {item('Nouveau dossier ici', () => {})}
          {item('Coller', () => onPaste(currentFolderId))}
        </>
      )}
    </div>
  )
}
