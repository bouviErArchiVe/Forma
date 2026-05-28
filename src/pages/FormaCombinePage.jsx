import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import CombineSidebar from '@/components/formacombine/CombineSidebar'
import CombinePreview from '@/components/formacombine/CombinePreview'
import CombineImportModal from '@/components/formacombine/CombineImportModal'
import useAppStore from '@/stores/useAppStore'
import { FCMB_DARK } from '@/lib/formacombine/constants'
import { blankPage, separatorPage, titlePage, clonePage, reorderPages } from '@/lib/formacombine/model'
import {
  listProjects, getProject, saveProject, createAndSaveProject, deleteProject, autosaveProject,
} from '@/lib/formacombine/persistence'
import { importFiles, importInternalSource } from '@/lib/formacombine/import'
import {
  downloadCombinedPdf, downloadCombinedZip, downloadProjectBundle, downloadAllPagesIndividually,
  exportCombinedPdf,
} from '@/lib/formacombine/export'
import {
  listCombineExports, saveCombineExport, deleteCombineExport, downloadExport, openExport, shareExport, exportSizeLabel,
} from '@/lib/formacombine/exportsStore'

export default function FormaCombinePage() {
  const navigate = useNavigate()
  const addNotification = useAppStore((s) => s.addNotification)
  const fileRef = useRef(null)

  const [view, setView] = useState('library')
  const [projects, setProjects] = useState([])
  const [project, setProject] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [importModal, setImportModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dropOver, setDropOver] = useState(false)
  const [exports, setExports] = useState([])

  const refresh = useCallback(() => {
    setProjects(listProjects())
    setExports(listCombineExports())
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!project) return undefined
    autosaveProject(project)
    return undefined
  }, [project])

  const selectedPage = project?.pages?.find((p) => p.id === selectedId) || project?.pages?.[0] || null
  const selectedIdx = project?.pages?.findIndex((p) => p.id === (selectedId || selectedPage?.id)) ?? -1

  const updateProject = (patch) => {
    setProject((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }))
  }

  const openProject = (id) => {
    const p = getProject(id)
    if (!p) return
    setProject(JSON.parse(JSON.stringify(p)))
    setSelectedId(p.pages?.[0]?.id || null)
    setView('editor')
  }

  const handleNew = () => {
    const p = createAndSaveProject(`Combinaison ${projects.length + 1}`)
    refresh()
    openProject(p.id)
    addNotification('Projet FormaCombine créé', 'success')
  }

  const handleDeleteProject = (id) => {
    deleteProject(id)
    refresh()
    if (project?.id === id) { setProject(null); setView('library') }
  }

  const addPages = (newPages) => {
    if (!newPages?.length) return
    updateProject({ pages: [...(project.pages || []), ...newPages] })
    setSelectedId(newPages[0].id)
  }

  const handleFiles = async (files) => {
    if (!files?.length || !project) return
    setBusy(true)
    let imported = 0
    try {
      for (const file of files) {
        try {
          const pages = await importFiles([file])
          if (pages.length) {
            addPages(pages)
            imported += pages.length
          }
        } catch (err) {
          addNotification(`${file.name} : ${err.message || 'Import échoué'}`, 'error')
        }
      }
      if (imported) addNotification(`${imported} page(s) importée(s)`, 'success')
    } finally {
      setBusy(false)
    }
  }

  const handleInternalImport = async (item) => {
    setBusy(true)
    try {
      const pages = await importInternalSource(item)
      addPages(pages)
      addNotification(`${pages.length} page(s) ajoutée(s)`, 'success')
    } catch (err) {
      addNotification(err.message || 'Import échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDropOver(false)
    handleFiles(e.dataTransfer?.files)
  }

  const handleExport = async (kind) => {
    if (!project?.pages?.length) return
    setBusy(true)
    try {
      if (kind === 'pdf' || kind === 'pdf-dl') {
        const blob = await exportCombinedPdf(project)
        await saveCombineExport({
          name: project.name,
          pageCount: project.pages.length,
          fileCount: project.pages.length,
          pdfBlob: blob,
        })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${(project.name || 'formacombine').replace(/[^\w\- ]+/g, '_')}.pdf`
        a.click()
        URL.revokeObjectURL(a.href)
        refresh()
      } else if (kind === 'pdf-share') {
        const blob = await exportCombinedPdf(project)
        const entry = await saveCombineExport({
          name: project.name,
          pageCount: project.pages.length,
          fileCount: project.pages.length,
          pdfBlob: blob,
        })
        if (entry) await shareExport(entry)
        refresh()
      } else if (kind === 'png') await downloadCombinedZip(project, 'png')
      else if (kind === 'jpg') await downloadCombinedZip(project, 'jpeg')
      else if (kind === 'folder') await downloadProjectBundle(project)
      else if (kind === 'pages-png') await downloadAllPagesIndividually(project, 'png')
      else if (kind === 'pages-jpg') await downloadAllPagesIndividually(project, 'jpeg')
      addNotification('Export terminé', 'success')
    } catch (err) {
      addNotification(err.message || 'Export échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleBack = () => {
    if (project) saveProject(project)
    setView('library')
    refresh()
  }

  if (view === 'library') {
    return (
      <div style={{ minHeight: '100dvh', background: FCMB_DARK.bg, color: FCMB_DARK.ink, display: 'flex', flexDirection: 'column' }}>
        <FormaModuleHeader title="FormaCombine" dark={FCMB_DARK}>
          <Btn onClick={handleNew}>+ Nouveau</Btn>
        </FormaModuleHeader>
        <main style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '24px 24px max(24px, env(safe-area-inset-bottom))', maxWidth: 900, margin: '0 auto', width: '100%' }}>
          <p style={{ color: FCMB_DARK.muted, marginBottom: 20 }}>
            Regroupez PDF, images, textes, FormaDoc, FormaTab et pages Forma en un document exportable.
          </p>
          {projects.length === 0 ? (
            <div style={cardStyle}>
              <p>Aucun projet. Créez une combinaison pour commencer.</p>
              <Btn primary onClick={handleNew}>Créer un projet</Btn>
            </div>
          ) : (
            projects.map((p) => (
              <div key={p.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: 12, color: FCMB_DARK.muted, marginTop: 4 }}>
                    {p.pages?.length || 0} pages · {new Date(p.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <Btn primary onClick={() => openProject(p.id)}>Ouvrir</Btn>
                <Btn danger onClick={() => handleDeleteProject(p.id)}>Suppr.</Btn>
              </div>
            ))
          )}
          {exports.length > 0 && (
            <>
              <h2 style={{ fontSize: 16, marginTop: 32, marginBottom: 4, color: FCMB_DARK.accent2 }}>PDF combinés</h2>
              <p style={{ fontSize: 12, color: FCMB_DARK.muted, marginBottom: 12 }}>Exports récents enregistrés localement</p>
              {exports.map((ex) => (
                <div key={ex.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <strong>{ex.name}.pdf</strong>
                    <div style={{ fontSize: 12, color: FCMB_DARK.muted, marginTop: 4 }}>
                      {ex.pageCount || ex.fileCount || 0} pages · {exportSizeLabel(ex)} · {new Date(ex.createdAt).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <Btn onClick={() => openExport(ex)}>Ouvrir</Btn>
                  <Btn primary onClick={() => downloadExport(ex)}>Télécharger</Btn>
                  <Btn onClick={() => shareExport(ex)}>Partager</Btn>
                  <Btn danger onClick={() => { deleteCombineExport(ex.id); refresh() }}>Suppr.</Btn>
                </div>
              ))}
            </>
          )}
          {exports.length === 0 && (
            <div style={{ ...cardStyle, marginTop: 32, color: FCMB_DARK.muted, fontSize: 13 }}>
              Les PDF combinés exportés apparaîtront ici dans « PDF combinés ».
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: FCMB_DARK.bg, color: FCMB_DARK.ink }}>
      <FormaModuleHeader title="FormaCombine" dark={FCMB_DARK} style={{ ...headerStyle, position: 'relative' }}>
        <Btn onClick={handleBack}>← Projets</Btn>
        <input
          value={project?.name || ''}
          onChange={(e) => updateProject({ name: e.target.value })}
          style={{
            flex: 1, maxWidth: 280, background: '#1a1e28', border: `1px solid ${FCMB_DARK.border}`,
            borderRadius: 6, padding: '6px 10px', color: FCMB_DARK.ink, fontSize: 14,
          }}
        />
        <Btn onClick={() => fileRef.current?.click()} disabled={busy}>+ Fichiers</Btn>
        <Btn onClick={() => setImportModal(true)} disabled={busy}>Forma</Btn>
        <Btn onClick={() => addPages([blankPage()])}>Blanc</Btn>
        <Btn onClick={() => {
          const t = prompt('Titre de section :', 'Section')
          if (t) addPages([titlePage(t)])
        }}>Titre</Btn>
        <Btn onClick={() => addPages([separatorPage()])}>Sépar.</Btn>
        <Btn primary onClick={() => handleExport('pdf-dl')} disabled={busy || !project?.pages?.length}>⬇ PDF</Btn>
        <Btn onClick={() => handleExport('pdf-share')} disabled={busy || !project?.pages?.length}>Partager</Btn>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: FCMB_DARK.muted }}>
          <input
            type="checkbox"
            checked={project?.settings?.pageNumbers ?? true}
            onChange={(e) => updateProject({ settings: { ...project.settings, pageNumbers: e.target.checked } })}
          />
          N°
        </label>
        <select
          onChange={(e) => { if (e.target.value) { handleExport(e.target.value); e.target.value = '' } }}
          disabled={busy || !project?.pages?.length}
          style={{ padding: '6px 8px', borderRadius: 6, background: '#222833', color: FCMB_DARK.ink, border: `1px solid ${FCMB_DARK.border}` }}
          defaultValue=""
        >
          <option value="" disabled>Exporter…</option>
          <option value="pdf-dl">PDF combiné + télécharger</option>
          <option value="pdf-share">PDF combiné + partager</option>
          <option value="png">ZIP PNG</option>
          <option value="jpg">ZIP JPG</option>
          <option value="folder">Dossier complet (ZIP)</option>
          <option value="pages-png">Pages PNG séparées</option>
          <option value="pages-jpg">Pages JPG séparées</option>
        </select>
      </FormaModuleHeader>

      <input ref={fileRef} type="file" multiple hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.docx,.csv,image/*,application/pdf,text/*" onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <CombineSidebar
          pages={project?.pages || []}
          selectedId={selectedId || selectedPage?.id}
          onSelect={setSelectedId}
          onReorder={(from, to) => updateProject({ pages: reorderPages(project.pages, from, to) })}
          onRename={(id, name) => updateProject({ pages: project.pages.map((p) => (p.id === id ? { ...p, name } : p)) })}
          onDelete={(id) => {
            const next = project.pages.filter((p) => p.id !== id)
            updateProject({ pages: next })
            if (selectedId === id) setSelectedId(next[0]?.id || null)
          }}
          onDuplicate={(id) => {
            const idx = project.pages.findIndex((p) => p.id === id)
            if (idx < 0) return
            const copy = clonePage(project.pages[idx], { name: `${project.pages[idx].name} (copie)` })
            const next = [...project.pages]
            next.splice(idx + 1, 0, copy)
            updateProject({ pages: next })
            setSelectedId(copy.id)
          }}
          onRotate={(id) => {
            updateProject({
              pages: project.pages.map((p) => (p.id === id ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p)),
            })
          }}
        />

        <div
          style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
          onDragOver={(e) => { e.preventDefault(); setDropOver(true) }}
          onDragLeave={() => setDropOver(false)}
          onDrop={handleDrop}
        >
          {dropOver && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(122,159,212,0.15)',
              border: `2px dashed ${FCMB_DARK.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: FCMB_DARK.accent2, pointerEvents: 'none',
            }}>
              Déposer les fichiers ici
            </div>
          )}
          {busy && (
            <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 11, background: '#252b3a', padding: '6px 12px', borderRadius: 6, fontSize: 12 }}>
              Traitement…
            </div>
          )}
          {!project?.pages?.length ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              color: FCMB_DARK.muted, gap: 12,
            }}>
              <div style={{ fontSize: 48, opacity: 0.3 }}>📎</div>
              <p>Glissez-déposez des fichiers ici</p>
              <p style={{ fontSize: 12 }}>PDF · Images · Texte · Word (.docx)</p>
              <Btn primary onClick={() => fileRef.current?.click()}>Parcourir</Btn>
            </div>
          ) : (
            <CombinePreview
              page={selectedPage}
              pageNumber={project.settings?.pageNumbers ? selectedIdx + 1 : null}
            />
          )}
        </div>
      </div>

      <CombineImportModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onImportInternal={handleInternalImport}
      />
    </div>
  )
}

const headerStyle = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
  borderBottom: `1px solid ${FCMB_DARK.border}`, background: FCMB_DARK.surface, flexWrap: 'wrap',
}

const cardStyle = {
  background: FCMB_DARK.panel, border: `1px solid ${FCMB_DARK.border}`, borderRadius: 10,
  padding: 16, marginBottom: 10,
}

function Btn({ children, onClick, primary, danger, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 12px', borderRadius: 6, border: `1px solid ${FCMB_DARK.border}`,
        background: danger ? '#3a1f1f' : primary ? FCMB_DARK.accent : '#222833',
        color: danger ? '#f88' : primary ? '#fff' : FCMB_DARK.ink,
        cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 12, opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  )
}
