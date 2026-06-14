/**
 * ImportHubPage — hub d'importation unifié (/import).
 *
 * L'utilisateur choisit un fichier (PDF, TXT, MD, CSV, image), une
 * destination, une matière, un projet et des tags. Réutilise les imports
 * existants (PDF, Markdown, image) ; TXT/CSV → FormaDoc. Erreurs propres.
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon } from '../components/ui/Icon'
import { db } from '../db'
import { createNotebookFromMarkdown } from '../lib/markdown-import'
import { importPdfFile } from '../lib/pdf-import'
import {
  createFormaDoc,
  createNotebookFromImage,
  createNotebookFromPdf,
} from '../services/library'
import { listProjects } from '../services/projects'
import { useToastStore } from '../stores/toastStore'
import type { Notebook, Project } from '../types'

type Destination = 'auto' | 'notebook' | 'formadoc'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function ImportHubPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [destination, setDestination] = useState<Destination>('auto')
  const [subjectId, setSubjectId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [subjects, setSubjects] = useState<Notebook[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const all = await db.notebooks.filter((n) => n.type === 'subject' && !n.deletedAt).toArray()
      setSubjects(all.sort((a, b) => a.name.localeCompare(b.name)))
      setProjects(await listProjects())
    })
  }, [])

  const detected = file
    ? file.type === 'application/pdf'
      ? 'PDF → carnet annotable'
      : /^image\//.test(file.type)
        ? 'Image → carnet'
        : /\.md$/i.test(file.name)
          ? 'Markdown → carnet'
          : /\.csv$/i.test(file.name)
            ? 'CSV → document'
            : 'Texte → document'
    : ''

  const runImport = async () => {
    if (!file) return
    setBusy(true)
    try {
      let nb: Notebook
      // « Document texte » force un FormaDoc — possible seulement pour du texte.
      const isText = !(file.type === 'application/pdf' || /^image\//.test(file.type))
      const asDoc = destination === 'formadoc' && isText
      if (file.type === 'application/pdf') {
        const { pages, pdfSourceDataUrl } = await importPdfFile(file, { lazy: true })
        nb = await createNotebookFromPdf(file.name.replace(/\.pdf$/i, ''), null, pages, pdfSourceDataUrl)
      } else if (/^image\//.test(file.type)) {
        nb = await createNotebookFromImage(file.name, null, file)
      } else if (/\.md$/i.test(file.name) && !asDoc) {
        const id = await createNotebookFromMarkdown(file, null, 'lined')
        const got = await db.notebooks.get(id)
        if (!got) throw new Error('Import Markdown échoué')
        nb = got
      } else {
        // TXT / CSV / autre texte → FormaDoc
        const text = await file.text()
        nb = await createFormaDoc(file.name.replace(/\.[^.]+$/, ''), null)
        const page = await db.pages.where('notebookId').equals(nb.id).first()
        if (page) {
          const html = `<h1>${escapeHtml(file.name)}</h1><pre>${escapeHtml(text.slice(0, 50000))}</pre>`
          await db.pages.update(page.id, { content: html })
        }
      }

      // Rattachements matière / projet
      const patch: Partial<Notebook> = {}
      if (subjectId) patch.subjectId = subjectId
      if (projectId) patch.projectId = projectId
      if (Object.keys(patch).length > 0) await db.notebooks.update(nb.id, { ...patch, updatedAt: Date.now() })

      useToastStore.getState().show('Import réussi')
      navigate(`/document/${nb.id}`)
    } catch (err) {
      useToastStore.getState().show(err instanceof Error ? `Import échoué : ${err.message}` : 'Import échoué', 6000)
    } finally {
      setBusy(false)
    }
  }

  const field = 'w-full text-sm border border-forma-border rounded-lg px-2.5 py-1.5 bg-forma-bg focus:outline-none focus:border-forma-accent'

  return (
    <div className="min-h-full p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-forma-muted hover:text-forma-accent transition-colors">
          <Icon name="chevron-left" className="w-4 h-4" />
          Tableau de bord
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-forma-text inline-flex items-center gap-2 mb-1">
        <Icon name="upload" className="w-5 h-5 text-forma-accent" />
        Importer du contenu
      </h1>
      <p className="text-xs text-forma-muted mb-5">PDF, image, Markdown, TXT ou CSV → un document Forma, rattaché si besoin à une matière et un projet.</p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1">Fichier</label>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp,.md,.txt,.csv,text/plain,text/markdown,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs"
          />
          {detected && <p className="text-[11px] text-forma-accent mt-1">{detected}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1">Destination</label>
          <select value={destination} onChange={(e) => setDestination(e.target.value as Destination)} className={field}>
            <option value="auto">Automatique (selon le type)</option>
            <option value="notebook">Carnet</option>
            <option value="formadoc">Document texte</option>
          </select>
          <p className="text-[10px] text-forma-muted mt-1">Le type de fichier détermine le meilleur format ; « Automatique » est recommandé.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1">Matière</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={field}>
              <option value="">— Aucune —</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-forma-muted uppercase tracking-wide mb-1">Projet</label>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={field}>
              <option value="">— Aucun —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <button
          type="button"
          disabled={!file || busy}
          onClick={() => void runImport()}
          className="w-full text-sm py-2 rounded-lg bg-forma-accent text-white hover:bg-forma-accent-hover disabled:opacity-40 transition-colors inline-flex items-center justify-center gap-1.5"
        >
          <Icon name="upload" className="w-4 h-4" />
          {busy ? 'Import en cours…' : 'Importer'}
        </button>
      </div>
    </div>
  )
}
