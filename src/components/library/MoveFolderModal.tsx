import { useEffect, useState } from 'react'
import { buildFolderPath } from '../../lib/folder-path'
import { getFolders, moveNotebook } from '../../services/library'
import type { Folder } from '../../types'

interface MoveFolderModalProps {
  notebookIds: string[]
  onClose: () => void
  onDone: () => void
}

export function MoveFolderModal({ notebookIds, onClose, onDone }: MoveFolderModalProps) {
  const [browseId, setBrowseId] = useState<string | null>(null)
  const [path, setPath] = useState<Folder[]>([])
  const [subfolders, setSubfolders] = useState<Folder[]>([])
  const [target, setTarget] = useState<string | null>(null)

  useEffect(() => {
    getFolders(browseId).then(setSubfolders)
    buildFolderPath(browseId).then(setPath)
    setTarget(browseId)
  }, [browseId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-forma-surface rounded-xl shadow-xl max-w-sm w-full p-5 border border-forma-border">
        <h3 className="font-semibold mb-2">Déplacer vers</h3>
        <nav className="flex flex-wrap gap-1 text-xs text-forma-muted mb-3">
          <button type="button" className="hover:text-forma-accent" onClick={() => setBrowseId(null)}>
            Racine
          </button>
          {path.map((f) => (
            <span key={f.id} className="flex items-center gap-1">
              <span>/</span>
              <button type="button" className="hover:text-forma-accent" onClick={() => setBrowseId(f.id)}>
                {f.name}
              </button>
            </span>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setTarget(browseId)}
          className={`block w-full text-left px-3 py-2 rounded mb-1 text-sm ${
            target === browseId ? 'bg-forma-accent/10 ring-1 ring-forma-accent' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          📂 {browseId ? path[path.length - 1]?.name ?? 'Dossier' : 'Bibliothèque (racine)'}
        </button>
        <div className="max-h-40 overflow-y-auto border border-forma-border rounded-lg mb-2">
          {subfolders.length === 0 ? (
            <p className="text-xs text-forma-muted p-2">Aucun sous-dossier</p>
          ) : (
            subfolders.map((f) => (
              <div key={f.id} className="flex border-b border-forma-border last:border-0">
                <button
                  type="button"
                  onClick={() => setTarget(f.id)}
                  className={`flex-1 text-left px-3 py-2 text-sm ${
                    target === f.id ? 'bg-forma-accent/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  📁 {f.name}
                </button>
                <button
                  type="button"
                  title="Ouvrir"
                  className="px-2 text-forma-muted hover:text-forma-accent"
                  onClick={() => setBrowseId(f.id)}
                >
                  ›
                </button>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 py-2 border rounded-lg dark:border-gray-600">
            Annuler
          </button>
          <button
            type="button"
            className="flex-1 py-2 bg-forma-accent text-white rounded-lg"
            onClick={async () => {
              for (const id of notebookIds) await moveNotebook(id, target)
              onDone()
              onClose()
            }}
          >
            Déplacer
          </button>
        </div>
      </div>
    </div>
  )
}
