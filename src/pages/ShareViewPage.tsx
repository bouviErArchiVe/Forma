import { useEffect, useState } from 'react'
import { useEditorStore } from '../stores/editorStore'
import { Link, useParams } from 'react-router-dom'
import { PageCanvas } from '../canvas/PageCanvas'
import { db } from '../db'
import { getNotebook } from '../services/library'
import { getPages, updatePage } from '../services/pages'
import type { Notebook, Page } from '../types'
import type { ShareLink } from '../types'

export function ShareViewPage() {
  const { token } = useParams<{ token: string }>()
  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [link, setLink] = useState<ShareLink | null>(null)
  const [idx, setIdx] = useState(0)
  const [error, setError] = useState('')

  const canEdit = link?.permission === 'edit'

  useEffect(() => {
    if (canEdit) {
      useEditorStore.setState({ readMode: false })
    } else {
      useEditorStore.setState({ readMode: true })
    }
    return () => {
      useEditorStore.setState({ readMode: false })
    }
  }, [canEdit])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIdx((i) => Math.max(0, i - 1))
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIdx((i) => Math.min(pages.length - 1, i + 1))
      }
      if (e.key === 'Home') {
        e.preventDefault()
        setIdx(0)
      }
      if (e.key === 'End') {
        e.preventDefault()
        setIdx(Math.max(0, pages.length - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pages.length])

  useEffect(() => {
    if (!token) return
    ;(async () => {
      const found = await db.shareLinks.where('token').equals(token).first()
      if (!found) {
        setError('Lien invalide ou expiré')
        return
      }
      setLink(found)
      const nb = await getNotebook(found.notebookId)
      if (!nb) {
        setError('Document introuvable')
        return
      }
      setNotebook(nb)
      setPages(await getPages(nb.id))
    })()
  }, [token])

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link to="/" className="text-forma-accent">
          Accueil
        </Link>
      </div>
    )
  }

  if (!notebook || !pages.length) {
    return <div className="p-8 text-center text-forma-muted">Chargement…</div>
  }

  const page = pages[idx]

  return (
    <div className="min-h-full flex flex-col bg-gray-900">
      <header className="flex items-center gap-3 px-4 py-3 bg-black/40 text-white">
        <Link to="/" className="text-sm opacity-80 hover:opacity-100">
          Forma
        </Link>
        <span className="font-medium">{notebook.name}</span>
        <span className="text-xs opacity-60">
          {canEdit ? 'Édition (partage local)' : 'Lecture seule (partage local)'}
        </span>
        <button
          type="button"
          className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href)
          }}
        >
          Copier le lien
        </button>
        <div className="flex-1" />
        <button type="button" disabled={idx <= 0} onClick={() => setIdx(idx - 1)} className="px-2">
          ‹
        </button>
        <span className="text-sm">
          {idx + 1}/{pages.length}
        </span>
        <button
          type="button"
          disabled={idx >= pages.length - 1}
          onClick={() => setIdx(idx + 1)}
          className="px-2"
        >
          ›
        </button>
      </header>
      <div className="flex-1 overflow-auto flex justify-center p-8">
        <PageCanvas
          page={page}
          orientation={notebook.orientation}
          scale={0.85}
          onPageChange={
            canEdit
              ? async (p) => {
                  await updatePage(p)
                  setPages((prev) => prev.map((x) => (x.id === p.id ? p : x)))
                }
              : () => {}
          }
        />
      </div>
    </div>
  )
}
