import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { ReviewCanvas } from '../components/formareview/ReviewCanvas'
import { ReviewSidebar } from '../components/formareview/ReviewSidebar'
import { ReviewThreadPanel } from '../components/formareview/ReviewThreadPanel'
import { ReviewToolbar } from '../components/formareview/ReviewToolbar'
import { GlassButton } from '../components/ui/GlassButton'
import { useReviewEditor } from '../hooks/useReviewEditor'
import { importReviewFiles } from '../lib/formareview/import'
import { countOpenPins } from '../lib/formareview/model'
import { REVIEW_MODE_LIST } from '../lib/formareview/constants'
import {
  autosaveSession,
  createSessionRecord,
  deleteSession,
  getSession,
  listSessions,
  saveSession,
} from '../services/formareview'
import { useToastStore } from '../stores/toastStore'
import type { FormaReviewMode, FormaReviewRole, FormaReviewSession } from '../types'

type View = 'library' | 'editor'

export function FormaReviewPage() {
  const [view, setView] = useState<View>('library')
  const [sessions, setSessions] = useState<FormaReviewSession[]>([])
  const [session, setSession] = useState<FormaReviewSession | null>(null)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useReviewEditor(session, setSession)

  const refresh = useCallback(async () => {
    setSessions(await listSessions())
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!session) return
    setSaving(true)
    void autosaveSession(session).finally(() => setSaving(false))
  }, [session])

  const openSession = async (id: string) => {
    const s = await getSession(id)
    if (!s) return
    setSession(structuredClone(s))
    setSelectedPageId(s.pages[0]?.id ?? null)
    setView('editor')
  }

  const handleNew = async (mode: FormaReviewMode) => {
    const s = await createSessionRecord(mode, `Révision ${sessions.length + 1}`)
    await refresh()
    setSession(s)
    setSelectedPageId(null)
    setView('editor')
    useToastStore.getState().show('Session FormaReview créée')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette session ?')) return
    await deleteSession(id)
    if (session?.id === id) {
      setSession(null)
      setView('library')
    }
    await refresh()
  }

  const handleImportPages = async (files: FileList) => {
    if (!files.length || !session) return
    setBusy(true)
    try {
      const pages = await importReviewFiles(files)
      setSession((prev) =>
        prev
          ? { ...prev, pages: [...prev.pages, ...pages], updatedAt: Date.now() }
          : prev,
      )
      if (!selectedPageId) setSelectedPageId(pages[0]?.id ?? null)
      useToastStore.getState().show(`${pages.length} page(s) importée(s)`)
    } catch (err) {
      useToastStore.getState().show(err instanceof Error ? err.message : 'Import échoué')
    } finally {
      setBusy(false)
    }
  }

  const handleBack = async () => {
    if (session) await saveSession(session)
    setView('library')
    await refresh()
  }

  const handleRoleChange = (role: FormaReviewRole) => {
    setSession((prev) =>
      prev
        ? {
            ...prev,
            settings: { ...prev.settings, authorRole: role },
            updatedAt: Date.now(),
          }
        : prev,
    )
  }

  const handleDeletePage = (id: string) => {
    if (!session) return
    const nextPages = session.pages.filter((p) => p.id !== id)
    if (selectedPageId === id) setSelectedPageId(nextPages[0]?.id ?? null)
    setSession({
      ...session,
      pages: nextPages,
      pins: session.pins.filter((p) => p.pageId !== id),
      markups: session.markups.filter((m) => m.pageId !== id),
      updatedAt: Date.now(),
    })
  }

  const currentPage =
    session?.pages.find((p) => p.id === selectedPageId) || session?.pages[0] || null
  const pagePins = session?.pins.filter((p) => p.pageId === currentPage?.id) ?? []
  const pageMarkups = session?.markups.filter((m) => m.pageId === currentPage?.id) ?? []

  if (view === 'library') {
    return (
      <div className="min-h-full flex flex-col max-w-4xl mx-auto w-full p-4">
        <header className="forma-glass-header rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-3 border border-forma-border/50">
          <BrandLogo size="sm" subtitle="FormaReview" />
          <div className="flex-1" />
          <Link to="/" className="text-sm text-forma-accent hover:underline">
            ← Bibliothèque
          </Link>
        </header>

        <p className="text-sm text-forma-muted mb-6">
          Corrections collaboratives — commentaires, pins, surlignages
        </p>

        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3">Nouvelle session</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {REVIEW_MODE_LIST.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => void handleNew(m.id)}
                className="forma-glass-panel rounded-xl p-4 border border-forma-border/40 hover:ring-1 hover:ring-forma-accent/30 text-left"
              >
                <span className="text-2xl">{m.icon}</span>
                <p className="text-sm font-medium mt-2">{m.label}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-3">Sessions récentes</h2>
          {sessions.length === 0 ? (
            <p className="text-forma-muted text-sm py-8 text-center">
              Aucune session — créez une révision ci-dessus
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.map((s) => {
                const mode = REVIEW_MODE_LIST.find((m) => m.id === s.mode)
                return (
                  <article
                    key={s.id}
                    className="forma-glass-panel rounded-xl p-4 border border-forma-border/40 flex flex-wrap items-center gap-3"
                  >
                    <span className="text-xl">{mode?.icon || '📝'}</span>
                    <div className="flex-1 min-w-[10rem]">
                      <h3 className="font-medium text-sm">{s.title}</h3>
                      <p className="text-xs text-forma-muted">
                        {s.pages.length} page(s) · {countOpenPins(s)} pin(s) ouvert(s) ·{' '}
                        {s.comments.length} commentaire(s)
                      </p>
                    </div>
                    <GlassButton accent size="sm" onClick={() => void openSession(s.id)}>
                      Ouvrir
                    </GlassButton>
                    <button
                      type="button"
                      className="text-xs text-red-600 px-2"
                      onClick={() => void handleDelete(s.id)}
                    >
                      Supprimer
                    </button>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-full flex flex-col h-screen max-h-screen">
      <header className="forma-glass-header px-4 py-2 flex flex-wrap items-center gap-3 border-b border-forma-border/50 shrink-0">
        <button
          type="button"
          className="text-sm text-forma-accent hover:underline"
          onClick={() => void handleBack()}
        >
          ← Bibliothèque
        </button>
        <BrandLogo size="sm" subtitle="FormaReview" />
        <input
          value={session.title}
          onChange={(e) => setSession({ ...session, title: e.target.value })}
          className="flex-1 min-w-[8rem] font-medium bg-transparent border-b border-transparent focus:border-forma-accent outline-none text-sm"
        />
        {saving && <span className="text-xs text-forma-muted">Enregistrement…</span>}
        <GlassButton size="sm" onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? '…' : '+ Pages'}
        </GlassButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleImportPages(e.target.files)
            e.target.value = ''
          }}
        />
      </header>

      <ReviewToolbar
        tool={editor.tool}
        onToolChange={editor.setTool}
        color={editor.color}
        onColorChange={editor.setColor}
        role={session.settings.authorRole}
        onRoleChange={handleRoleChange}
      />

      <div className="flex flex-1 min-h-0">
        <ReviewSidebar
          session={session}
          selectedPageId={currentPage?.id ?? null}
          onSelectPage={setSelectedPageId}
          onAddPages={(files) => void handleImportPages(files)}
          onDeletePage={handleDeletePage}
        />

        <ReviewCanvas
          page={currentPage}
          pins={pagePins}
          markups={pageMarkups}
          tool={editor.tool}
          color={editor.color}
          selectedPinId={editor.selectedPinId}
          onPinClick={editor.setSelectedPinId}
          onPlacePin={(x, y) => currentPage && editor.addPin(currentPage.id, x, y)}
          onStartDraft={editor.startDraft}
          onUpdateDraft={editor.updateDraft}
          onCommitDraft={() => currentPage && editor.commitDraft(currentPage.id)}
          onAddText={(x, y, text) => currentPage && editor.addTextMarkup(currentPage.id, x, y, text)}
          onEraseAt={editor.eraseAt}
          draftRef={editor.draftRef}
        />

        <ReviewThreadPanel
          session={session}
          selectedPinId={editor.selectedPinId}
          pins={session.pins}
          onAddComment={(opts) => editor.addComment(opts)}
          onReply={(parentId, content) =>
            editor.addComment({ parentId, content, pinId: editor.selectedPinId })
          }
          onEdit={editor.editComment}
          onResolve={editor.resolveComment}
          onDelete={editor.deleteComment}
          onResolvePin={editor.resolvePin}
        />
      </div>
    </div>
  )
}
