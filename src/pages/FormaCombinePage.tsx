import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { CombineImportModal } from '../components/formacombine/CombineImportModal'
import { CombinePreview } from '../components/formacombine/CombinePreview'
import { CombineSidebar } from '../components/formacombine/CombineSidebar'
import { GlassButton } from '../components/ui/GlassButton'
import {
  downloadAllPagesIndividually,
  downloadCombinedPdf,
  downloadCombinedZip,
  downloadProjectBundle,
} from '../lib/formacombine/export'
import { importCombineFiles, importInternalSource } from '../lib/formacombine/import'
import {
  blankPage,
  clonePage,
  reorderPages,
  separatorPage,
  titlePage,
} from '../lib/formacombine/model'
import {
  autosaveProject,
  createProjectRecord,
  deleteProject,
  getProject,
  listProjects,
  saveProject,
} from '../services/formacombine'
import { useToastStore } from '../stores/toastStore'
import type { FormaCombineProject, InternalCombineSource } from '../types'

type View = 'library' | 'editor'
type ExportKind =
  | 'pdf-dl'
  | 'png'
  | 'jpg'
  | 'folder'
  | 'pages-png'
  | 'pages-jpg'

export function FormaCombinePage() {
  const [view, setView] = useState<View>('library')
  const [projects, setProjects] = useState<FormaCombineProject[]>([])
  const [project, setProject] = useState<FormaCombineProject | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [importModal, setImportModal] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dropOver, setDropOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    setProjects(await listProjects())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!project) return
    setSaving(true)
    void autosaveProject(project).finally(() => setSaving(false))
  }, [project])

  const selectedPage =
    project?.pages.find((p) => p.id === selectedId) || project?.pages[0] || null
  const selectedIdx =
    project?.pages.findIndex((p) => p.id === (selectedId || selectedPage?.id)) ?? -1

  const updateProject = (patch: Partial<FormaCombineProject>) => {
    setProject((prev) => (prev ? { ...prev, ...patch, updatedAt: Date.now() } : prev))
  }

  const openProject = async (id: string) => {
    const p = await getProject(id)
    if (!p) return
    setProject(structuredClone(p))
    setSelectedId(p.pages[0]?.id ?? null)
    setView('editor')
  }

  const handleNew = async () => {
    const p = await createProjectRecord(`Combinaison ${projects.length + 1}`)
    await refresh()
    setProject(p)
    setSelectedId(null)
    setView('editor')
    useToastStore.getState().show('Projet FormaCombine créé')
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Supprimer ce projet ?')) return
    await deleteProject(id)
    if (project?.id === id) {
      setProject(null)
      setView('library')
    }
    await refresh()
  }

  const addPages = (newPages: FormaCombineProject['pages']) => {
    if (!newPages.length || !project) return
    updateProject({ pages: [...project.pages, ...newPages] })
    setSelectedId(newPages[0]!.id)
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !project) return
    setBusy(true)
    let imported = 0
    for (const file of files) {
      try {
        const pages = await importCombineFiles([file])
        if (pages.length) {
          addPages(pages)
          imported += pages.length
        }
      } catch (err) {
        useToastStore.getState().show(
          `${file.name} : ${err instanceof Error ? err.message : 'Import échoué'}`,
        )
      }
    }
    if (imported) useToastStore.getState().show(`${imported} page(s) importée(s)`)
    setBusy(false)
  }

  const handleInternalImport = async (item: InternalCombineSource) => {
    setBusy(true)
    try {
      const pages = await importInternalSource(item)
      addPages(pages)
      useToastStore.getState().show(`${pages.length} page(s) ajoutée(s)`)
    } catch (err) {
      useToastStore.getState().show(err instanceof Error ? err.message : 'Import échoué')
    } finally {
      setBusy(false)
    }
  }

  const handleExport = async (kind: ExportKind) => {
    if (!project?.pages.length) return
    setBusy(true)
    try {
      if (kind === 'pdf-dl') await downloadCombinedPdf(project)
      else if (kind === 'png') await downloadCombinedZip(project, 'png')
      else if (kind === 'jpg') await downloadCombinedZip(project, 'jpeg')
      else if (kind === 'folder') await downloadProjectBundle(project)
      else if (kind === 'pages-png') await downloadAllPagesIndividually(project, 'png')
      else if (kind === 'pages-jpg') await downloadAllPagesIndividually(project, 'jpeg')
      useToastStore.getState().show('Export terminé')
    } catch (err) {
      useToastStore.getState().show(err instanceof Error ? err.message : 'Export échoué')
    } finally {
      setBusy(false)
    }
  }

  const handleBack = async () => {
    if (project) await saveProject(project)
    setView('library')
    await refresh()
  }

  if (view === 'library') {
    return (
      <div className="min-h-full flex flex-col max-w-4xl mx-auto w-full p-4">
        <header className="forma-glass-header rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-3 border border-forma-border/50">
          <BrandLogo size="sm" subtitle="FormaCombine" />
          <div className="flex-1" />
          <GlassButton accent onClick={() => void handleNew()}>
            + Nouveau
          </GlassButton>
          <Link to="/" className="text-sm text-forma-accent hover:underline">
            ← Bibliothèque
          </Link>
        </header>

        <p className="text-sm text-forma-muted mb-6">
          Regroupez PDF, images, textes et pages Forma en un document exportable
        </p>

        {projects.length === 0 ? (
          <div className="forma-glass-panel rounded-xl p-6 border border-forma-border/40 text-center">
            <p className="text-forma-muted mb-4">Aucun projet. Créez une combinaison pour commencer.</p>
            <GlassButton accent onClick={() => void handleNew()}>
              Créer un projet
            </GlassButton>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((p) => (
              <article
                key={p.id}
                className="forma-glass-panel rounded-xl p-4 border border-forma-border/40 flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-[10rem]">
                  <h3 className="font-medium text-sm">{p.name}</h3>
                  <p className="text-xs text-forma-muted">
                    {p.pages.length} pages · {new Date(p.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <GlassButton accent size="sm" onClick={() => void openProject(p.id)}>
                  Ouvrir
                </GlassButton>
                <button
                  type="button"
                  className="text-xs text-red-600 px-2"
                  onClick={() => void handleDeleteProject(p.id)}
                >
                  Supprimer
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="min-h-full flex flex-col h-screen max-h-screen">
      <header className="forma-glass-header px-3 py-2 flex flex-wrap items-center gap-2 border-b border-forma-border/50 shrink-0">
        <button
          type="button"
          className="text-sm text-forma-accent hover:underline"
          onClick={() => void handleBack()}
        >
          ← Projets
        </button>
        <BrandLogo size="sm" subtitle="FormaCombine" />
        <input
          value={project.name}
          onChange={(e) => updateProject({ name: e.target.value })}
          className="flex-1 min-w-[8rem] max-w-xs font-medium bg-transparent border-b border-forma-border focus:border-forma-accent outline-none text-sm px-1"
        />
        {saving && <span className="text-xs text-forma-muted">Enregistrement…</span>}
        <GlassButton size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          + Fichiers
        </GlassButton>
        <GlassButton size="sm" onClick={() => setImportModal(true)} disabled={busy}>
          Forma
        </GlassButton>
        <GlassButton size="sm" onClick={() => addPages([blankPage()])}>
          Blanc
        </GlassButton>
        <GlassButton
          size="sm"
          onClick={() => {
            const t = window.prompt('Titre de section :', 'Section')
            if (t) addPages([titlePage(t)])
          }}
        >
          Titre
        </GlassButton>
        <GlassButton size="sm" onClick={() => addPages([separatorPage()])}>
          Sépar.
        </GlassButton>
        <GlassButton
          accent
          size="sm"
          onClick={() => void handleExport('pdf-dl')}
          disabled={busy || !project.pages.length}
        >
          ⬇ PDF
        </GlassButton>
        <label className="flex items-center gap-1 text-xs text-forma-muted">
          <input
            type="checkbox"
            checked={project.settings.pageNumbers}
            onChange={(e) =>
              updateProject({ settings: { ...project.settings, pageNumbers: e.target.checked } })
            }
          />
          N°
        </label>
        <select
          onChange={(e) => {
            if (e.target.value) {
              void handleExport(e.target.value as ExportKind)
              e.target.value = ''
            }
          }}
          disabled={busy || !project.pages.length}
          className="px-2 py-1 rounded-md border border-forma-border bg-forma-surface text-xs"
          defaultValue=""
        >
          <option value="" disabled>
            Exporter…
          </option>
          <option value="pdf-dl">PDF combiné</option>
          <option value="png">ZIP PNG</option>
          <option value="jpg">ZIP JPG</option>
          <option value="folder">Dossier complet (ZIP)</option>
          <option value="pages-png">Pages PNG séparées</option>
          <option value="pages-jpg">Pages JPG séparées</option>
        </select>
      </header>

      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.docx,.csv,image/*,application/pdf,text/*"
        onChange={(e) => {
          void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="flex flex-1 min-h-0">
        <CombineSidebar
          pages={project.pages}
          selectedId={selectedId || selectedPage?.id || null}
          onSelect={setSelectedId}
          onReorder={(from, to) => updateProject({ pages: reorderPages(project.pages, from, to) })}
          onRename={(id, name) =>
            updateProject({
              pages: project.pages.map((p) => (p.id === id ? { ...p, name } : p)),
            })
          }
          onDelete={(id) => {
            const next = project.pages.filter((p) => p.id !== id)
            updateProject({ pages: next })
            if (selectedId === id) setSelectedId(next[0]?.id ?? null)
          }}
          onDuplicate={(id) => {
            const idx = project.pages.findIndex((p) => p.id === id)
            if (idx < 0) return
            const copy = clonePage(project.pages[idx]!, { name: `${project.pages[idx]!.name} (copie)` })
            const next = [...project.pages]
            next.splice(idx + 1, 0, copy)
            updateProject({ pages: next })
            setSelectedId(copy.id)
          }}
          onRotate={(id) =>
            updateProject({
              pages: project.pages.map((p) =>
                p.id === id ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } : p,
              ),
            })
          }
        />

        <div
          className="flex-1 flex flex-col relative min-w-0"
          onDragOver={(e) => {
            e.preventDefault()
            setDropOver(true)
          }}
          onDragLeave={() => setDropOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDropOver(false)
            void handleFiles(e.dataTransfer.files)
          }}
        >
          {dropOver && (
            <div className="absolute inset-0 z-10 bg-forma-accent/15 border-2 border-dashed border-forma-accent flex items-center justify-center text-lg text-forma-accent pointer-events-none">
              Déposer les fichiers ici
            </div>
          )}
          {busy && (
            <div className="absolute top-3 right-3 z-20 bg-forma-panel px-3 py-1.5 rounded-md text-xs border border-forma-border">
              Traitement…
            </div>
          )}
          {!project.pages.length ? (
            <div className="flex-1 flex flex-col items-center justify-center text-forma-muted gap-3">
              <div className="text-5xl opacity-30">📎</div>
              <p>Glissez-déposez des fichiers ici</p>
              <p className="text-xs">PDF · Images · Texte · Word (.docx)</p>
              <GlassButton accent onClick={() => fileRef.current?.click()}>
                Parcourir
              </GlassButton>
            </div>
          ) : (
            <CombinePreview
              page={selectedPage}
              pageNumber={project.settings.pageNumbers ? selectedIdx + 1 : null}
            />
          )}
        </div>
      </div>

      <CombineImportModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onImportInternal={(item) => void handleInternalImport(item)}
      />
    </div>
  )
}
