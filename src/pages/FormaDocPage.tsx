import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { DocEditor, DocEditorToolbar } from '../components/docs/DocEditor'
import { DocPreview, docPlainSnippet } from '../components/docs/DocPreview'
import { GlassButton } from '../components/ui/GlassButton'
import { exportDocumentMd, exportDocumentPdf, exportDocumentTxt } from '../lib/docs/export'
import { DOC_TEMPLATE_IDS, DOC_TEMPLATES } from '../lib/docs/model'
import {
  autosaveDocument,
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  searchDocuments,
  sortDocuments,
  type DocumentSortBy,
  type DocumentSortDir,
} from '../services/formadoc'
import { useToastStore } from '../stores/toastStore'
import type { FormaDocTemplateId, FormaDocument } from '../types'

type View = 'library' | 'editor'

export function FormaDocPage() {
  const [view, setView] = useState<View>('library')
  const [docs, setDocs] = useState<FormaDocument[]>([])
  const [activeDoc, setActiveDoc] = useState<FormaDocument | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<DocumentSortBy>('updated')
  const [sortDir, setSortDir] = useState<DocumentSortDir>('desc')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTemplate, setNewTemplate] = useState<FormaDocTemplateId>('blank')
  const [exporting, setExporting] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadDocs = useCallback(async () => {
    const list = search.trim() ? await searchDocuments(search) : await listDocuments()
    setDocs(sortDocuments(list, sortBy, sortDir))
  }, [search, sortBy, sortDir])

  useEffect(() => {
    void loadDocs()
  }, [loadDocs])

  const displayed = useMemo(() => docs, [docs])

  const openDoc = (doc: FormaDocument) => {
    setActiveDoc(doc)
    setView('editor')
  }

  const handleCreate = async () => {
    const doc = await createDocument(newName.trim() || 'Nouveau document', newTemplate)
    setShowNew(false)
    setNewName('')
    await loadDocs()
    openDoc(doc)
  }

  const handleDocChange = (doc: FormaDocument) => {
    setActiveDoc(doc)
    setSaving(true)
    void autosaveDocument(doc).finally(() => setSaving(false))
  }

  const handleRename = async (name: string) => {
    if (!activeDoc || !name.trim()) return
    handleDocChange({ ...activeDoc, name: name.trim() })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce document ?')) return
    await deleteDocument(id)
    if (activeDoc?.id === id) {
      setActiveDoc(null)
      setView('library')
    }
    await loadDocs()
    useToastStore.getState().show('Document supprimé')
  }

  const handleDuplicate = async (id: string) => {
    const copy = await duplicateDocument(id)
    if (copy) {
      await loadDocs()
      openDoc(copy)
    }
  }

  const handleExportPdf = async () => {
    if (!activeDoc) return
    setExporting(true)
    try {
      await exportDocumentPdf(activeDoc)
      useToastStore.getState().show('PDF exporté')
    } catch (err) {
      useToastStore.getState().show(err instanceof Error ? err.message : 'Export échoué', 5000)
    } finally {
      setExporting(false)
    }
  }

  if (view === 'editor' && activeDoc) {
    return (
      <div className="min-h-full flex flex-col p-4 max-w-6xl mx-auto w-full">
        <header className="forma-glass-header rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 border border-forma-border/50">
          <button
            type="button"
            onClick={() => {
              setView('library')
              void loadDocs()
            }}
            className="text-sm text-forma-accent hover:underline shrink-0"
          >
            ← Bibliothèque docs
          </button>
          <BrandLogo size="sm" subtitle="FormaDoc" />
          <input
            value={activeDoc.name}
            onChange={(e) => setActiveDoc({ ...activeDoc, name: e.target.value })}
            onBlur={(e) => void handleRename(e.target.value)}
            className="flex-1 min-w-[12rem] font-medium bg-transparent border-b border-transparent focus:border-forma-accent outline-none text-sm"
          />
          {saving && <span className="text-xs text-forma-muted">Enregistrement…</span>}
          <DocEditorToolbar
            exporting={exporting}
            onExportTxt={() => {
              exportDocumentTxt(activeDoc)
              useToastStore.getState().show('TXT exporté')
            }}
            onExportMd={() => {
              exportDocumentMd(activeDoc)
              useToastStore.getState().show('MD exporté')
            }}
            onExportPdf={() => void handleExportPdf()}
          />
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => void handleDelete(activeDoc.id)}
          >
            Supprimer
          </button>
        </header>
        <DocEditor doc={activeDoc} onChange={handleDocChange} />
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col max-w-6xl mx-auto w-full p-4">
      <header className="forma-glass-header rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-3 border border-forma-border/50">
        <BrandLogo size="sm" subtitle="FormaDoc" />
        <div className="flex-1" />
        <Link to="/" className="text-sm text-forma-accent hover:underline">
          ← Bibliothèque
        </Link>
      </header>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="flex-1 min-w-[12rem] border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={`${sortBy}-${sortDir}`}
          onChange={(e) => {
            const [by, dir] = e.target.value.split('-') as [DocumentSortBy, DocumentSortDir]
            setSortBy(by)
            setSortDir(dir)
          }}
          className="border rounded-lg px-2 py-2 text-sm"
        >
          <option value="updated-desc">Modifié ↓</option>
          <option value="updated-asc">Modifié ↑</option>
          <option value="name-asc">Nom A→Z</option>
          <option value="name-desc">Nom Z→A</option>
        </select>
        <GlassButton accent onClick={() => setShowNew(true)}>
          + Document
        </GlassButton>
      </div>

      {showNew && (
        <div className="forma-glass-panel rounded-xl p-4 mb-4 border border-forma-border/50 space-y-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du document"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DOC_TEMPLATE_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setNewTemplate(id)}
                className={`text-left p-3 rounded-xl border text-sm ${
                  newTemplate === id ? 'border-forma-accent bg-forma-accent/10' : 'border-forma-border/40'
                }`}
              >
                {DOC_TEMPLATES[id].label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <GlassButton accent onClick={() => void handleCreate()}>
              Créer
            </GlassButton>
            <GlassButton onClick={() => setShowNew(false)}>Annuler</GlassButton>
          </div>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="text-center py-20 text-forma-muted">
          <p className="text-4xl mb-3">📄</p>
          <p>Aucun document — créez-en un avec + Document</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((doc) => (
            <article
              key={doc.id}
              className="forma-glass-panel rounded-xl p-4 border border-forma-border/40 flex flex-col gap-3 hover:ring-1 hover:ring-forma-accent/20 transition-all"
            >
              <div className="flex justify-center">
                <DocPreview doc={doc} />
              </div>
              <div>
                <h2 className="font-medium text-sm truncate">{doc.name}</h2>
                <p className="text-xs text-forma-muted mt-1 line-clamp-2">{docPlainSnippet(doc)}</p>
                <p className="text-[10px] text-forma-muted mt-1">
                  {doc.pages.length} page{doc.pages.length > 1 ? 's' : ''} ·{' '}
                  {new Date(doc.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                <GlassButton accent size="sm" onClick={() => openDoc(doc)}>
                  Ouvrir
                </GlassButton>
                <GlassButton size="sm" onClick={() => void handleDuplicate(doc.id)}>
                  Dupliquer
                </GlassButton>
                <button
                  type="button"
                  className="text-xs text-red-600 px-2"
                  onClick={() => void handleDelete(doc.id)}
                >
                  Supprimer
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
