import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase'
import { loadLocalNotebooks, upsertLocalNotebook, isLocalNotebookId } from '@/lib/projectPersistence'
import {
  loadFolders, loadLocalFoldersForScope, persistFolderCreate, syncFoldersToCloud, resolveFolderUserId,
} from '@/lib/folderPersistence'
import { canCreateChildFolder } from '@/lib/folders/tree'
import FormaAppShell from '@/components/FormaAppShell'
import { MODULES } from '@/config/branding'
import FormaFolderExplorer from '@/components/formafolder/FormaFolderExplorer'
import NotebookLibraryItem from '@/components/NotebookLibraryItem'
import AppLoading from '@/components/AppLoading'

const DEFAULT_SUBJECTS = [{ id: 'arch', l: 'Architecture', c: '#c8622a', e: '🏛', custom: false }]
const TEMPLATES = [{ id: 'plan', l: 'Plan archi', i: '⊕' }, { id: 'blank', l: 'Vierge', i: '□' }]

export default function FormaFolderPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { user } = useAuth()
  const { addNotification, setActiveNotebook } = useAppStore()

  const [loading, setLoading] = useState(true)
  const [notebooks, setNotebooks] = useState([])
  const [folders, setFolders] = useState([])
  const [subjects] = useState(DEFAULT_SUBJECTS)
  const [userId, setUserId] = useState(user?.id || null)
  const [foldersCloudOk, setFoldersCloudOk] = useState(null)
  const [syncingFolders, setSyncingFolders] = useState(false)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderParentId, setNewFolderParentId] = useState(null)
  const [folderName, setFolderName] = useState('')
  const [folderEmoji, setFolderEmoji] = useState('📁')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const uid = user?.id || (await resolveFolderUserId())
        if (!cancelled) setUserId(uid)
        const folderRes = uid ? await loadFolders(uid) : { folders: loadLocalFoldersForScope(null), cloudOk: false }
        if (!cancelled) {
          setFolders(folderRes.folders || [])
          setFoldersCloudOk(folderRes.cloudOk ?? false)
        }
        const local = loadLocalNotebooks()
        if (uid) {
          try {
            const { data } = await supabase.from('notebooks').select('*').eq('user_id', uid).order('updated_at', { ascending: false })
            if (!cancelled && data?.length) { setNotebooks(data); return }
          } catch { /* offline */ }
        }
        if (!cancelled) setNotebooks(local)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user?.id])

  const assignFolderBatch = async (ids, folderId) => {
    const idSet = new Set(ids)
    const now = new Date().toISOString()
    const next = notebooks.map((n) => (idSet.has(n.id) ? { ...n, folder_id: folderId || null, updated_at: now } : n))
    setNotebooks(next)
    for (const id of ids) {
      const nb = next.find((n) => n.id === id)
      if (!nb) continue
      if (isLocalNotebookId(id)) upsertLocalNotebook(nb)
      else if (userId) {
        try { await supabase.from('notebooks').update({ folder_id: folderId || null }).eq('id', id) } catch { /* ignore */ }
      }
    }
    addNotification(`${ids.length} carnet(s) déplacé(s)`, 'success')
  }

  const createFolder = async () => {
    if (!folderName.trim()) return
    if (newFolderParentId && !canCreateChildFolder(folders, newFolderParentId)) {
      addNotification('Impossible de créer un sous-dossier ici', 'error')
      return
    }
    const uid = userId || await resolveFolderUserId()
    const res = await persistFolderCreate(uid, { name: folderName.trim(), icon: folderEmoji, parentId: newFolderParentId })
    if (!res.ok) { addNotification(res.error || 'Erreur', 'error'); return }
    setFolders(res.folders)
    setShowNewFolder(false)
    setFolderName('')
    setFolderEmoji('📁')
    setNewFolderParentId(null)
    addNotification('Dossier créé', 'success')
  }

  const syncFolders = async () => {
    setSyncingFolders(true)
    try {
      const res = await syncFoldersToCloud(userId)
      if (res.ok) { setFolders(res.folders); setFoldersCloudOk(res.cloudOk); addNotification('Synchronisation terminée', 'success') }
      else addNotification(res.error || 'Sync échouée', 'error')
    } finally { setSyncingFolders(false) }
  }

  const renderNotebook = useCallback((nb, view = 'grid') => {
    const subject = subjects.find((s) => s.id === nb.subject) || subjects[0]
    const template = TEMPLATES.find((t) => t.id === nb.template) || TEMPLATES[0]
    const folder = folders.find((f) => f.id === nb.folder_id)
    return (
      <NotebookLibraryItem
        key={nb.id}
        T={T}
        nb={nb}
        subject={subject}
        template={template}
        folder={folder}
        view={view}
        selectionMode={false}
        selected={false}
        onLongPress={() => {}}
        onToggleSelect={() => {}}
        onOpen={() => { setActiveNotebook(nb); navigate(`/editor/${nb.id}`) }}
        onStar={() => {}}
        onAssign={() => {}}
        onDelete={() => {}}
      />
    )
  }, [subjects, folders, T, navigate, setActiveNotebook])

  if (loading) return <AppLoading />

  return (
    <>
      <FormaAppShell title={MODULES.formaFolder.name} subtitle="Organisation avancée des carnets et dossiers">
        <FormaFolderExplorer
          T={T}
          folders={folders}
          setFolders={setFolders}
          notebooks={notebooks}
          setNotebooks={setNotebooks}
          subjects={subjects}
          userId={userId}
          foldersCloudOk={foldersCloudOk}
          syncingFolders={syncingFolders}
          onSyncFolders={syncFolders}
          onCreateFolder={(parentId) => { setNewFolderParentId(parentId || null); setShowNewFolder(true) }}
          onEditFolder={() => addNotification('Édition dossier — via bibliothèque', 'info')}
          onAssignNotebooks={assignFolderBatch}
          onOpenNotebook={(nb) => { setActiveNotebook(nb); navigate(`/editor/${nb.id}`) }}
          renderNotebook={renderNotebook}
          addNotification={addNotification}
          showHeader={false}
        />
      </FormaAppShell>
      {showNewFolder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowNewFolder(false)}>
          <div style={{ background: T.surface, padding: 24, borderRadius: 12, width: 320 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', color: T.ink }}>Nouveau dossier</h3>
            <input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Nom du dossier" autoFocus style={{ width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink }} />
            <input value={folderEmoji} onChange={(e) => setFolderEmoji(e.target.value)} style={{ width: 60, padding: 10, marginBottom: 14, borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg }} />
            <button type="button" onClick={createFolder} disabled={!folderName.trim()} style={{ width: '100%', padding: 12, borderRadius: 8, background: T.accent, border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Créer</button>
          </div>
        </div>
      )}
    </>
  )
}
