import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import FormaAppShell from '@/components/FormaAppShell'
import LibraryExplorer from '@/components/formalibrary/LibraryExplorer'
import useAppStore from '@/stores/useAppStore'
import { FLB_DARK } from '@/lib/formalibrary/constants'
import { autoClassify } from '@/lib/formalibrary/classify'
import { importFiles, linkInternalSource } from '@/lib/formalibrary/import'
import { invalidateSearchIndex } from '@/lib/formaai/search/indexer'
import {
  ensureLibraryPresets, saveLibrary,
  createAndSaveFolder, saveItem, saveItemWithBlob, deleteItem,
  hydrateLibraryItems, hydrateLibraryItem,
} from '@/lib/formalibrary/persistence'

export default function FormaLibraryPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const addNotification = useAppStore((s) => s.addNotification)

  const [folders, setFolders] = useState([])
  const [items, setItems] = useState([])
  const [currentFolderId, setCurrentFolderId] = useState(null)

  const refresh = useCallback(async () => {
    const data = ensureLibraryPresets()
    const hydrated = await hydrateLibraryItems(data.items)
    setFolders(data.folders)
    setItems(hydrated)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const itemsForStore = items.map((item) => {
      if (!item.blobId) return item
      const { _blobUrl, dataUrl, previewUrl, ...rest } = item
      return { ...rest, dataUrl: null, previewUrl: null }
    })
    saveLibrary({ folders, items: itemsForStore })
    invalidateSearchIndex()
  }, [folders, items])

  const handleCreateFolder = () => {
    const name = prompt('Nom du dossier :', 'Nouveau dossier')
    if (!name?.trim()) return
    const folder = createAndSaveFolder({ name: name.trim(), parentId: null })
    setFolders((prev) => [folder, ...prev])
    addNotification('Dossier créé', 'success')
  }

  const handleCreateSubfolder = () => {
    if (!currentFolderId) return
    const name = prompt('Nom du sous-dossier :', 'Sous-dossier')
    if (!name?.trim()) return
    const folder = createAndSaveFolder({ name: name.trim(), parentId: currentFolderId })
    setFolders((prev) => [folder, ...prev])
    addNotification('Sous-dossier créé', 'success')
  }

  const handleSaveItem = async (item) => {
    let saved = item?.dataUrl && !item._blobUrl ? await saveItemWithBlob(item) : saveItem(item)
    saved = await hydrateLibraryItem(saved)
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === saved.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = saved
        return next
      }
      return [saved, ...prev]
    })
    return saved
  }

  const handleDeleteItem = (id) => {
    deleteItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleImportFiles = async (files, folderId) => {
    let targetFolderId = folderId
    if (!targetFolderId && files.length === 1) {
      const { category, tags } = autoClassify({ name: files[0].name, mimeType: files[0].type })
      const presetMap = {
        norm: 'cnb', material: 'materials', texture: 'textures', detail: 'details', reference: 'refs',
      }
      const preset = presetMap[category]
      if (preset) {
        const match = folders.find((f) => f.preset === preset || (f.tags || []).some((t) => tags.includes(t)))
        if (match) targetFolderId = match.id
      }
    }

    const imported = await importFiles(files, targetFolderId)
    const saved = []
    for (const item of imported) {
      saved.push(await saveItemWithBlob(item))
    }
    const hydrated = await hydrateLibraryItems(saved)
    setItems((prev) => [...hydrated, ...prev])
  }

  const handleImportInternal = (source) => {
    const item = linkInternalSource(source, currentFolderId)
    saveItem(item)
    setItems((prev) => [item, ...prev])
    addNotification(`${source.name} lié`, 'success')
  }

  const initialItemId = params.get('item')

  return (
    <FormaAppShell
      title="FormaLibrary"
      subtitle="Textures · Matériaux · Normes · PDF · Références"
    >
      <LibraryExplorer
        folders={folders}
        items={items}
        setFolders={setFolders}
        setItems={setItems}
        currentFolderId={currentFolderId}
        setCurrentFolderId={setCurrentFolderId}
        onCreateFolder={handleCreateFolder}
        onCreateSubfolder={handleCreateSubfolder}
        onSaveItem={handleSaveItem}
        onDeleteItem={handleDeleteItem}
        onImportFiles={handleImportFiles}
        onImportInternal={handleImportInternal}
        addNotification={addNotification}
        initialItemId={initialItemId}
      />
    </FormaAppShell>
  )
}

const headerBtn = {
  padding: '6px 12px', borderRadius: 8, border: `1px solid ${FLB_DARK.border}`,
  background: FLB_DARK.panel, color: FLB_DARK.ink, cursor: 'pointer', fontSize: 12,
}
