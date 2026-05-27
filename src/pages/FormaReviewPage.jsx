import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import ReviewSidebar from '@/components/formareview/ReviewSidebar'
import ReviewCanvas from '@/components/formareview/ReviewCanvas'
import ReviewToolbar from '@/components/formareview/ReviewToolbar'
import ReviewThreadPanel from '@/components/formareview/ReviewThreadPanel'
import useAppStore from '@/stores/useAppStore'
import { useAuth } from '@/hooks/useAuth'
import { useReviewEditor } from '@/hooks/useReviewEditor'
import { FRV_DARK, REVIEW_MODES } from '@/lib/formareview/constants'
import { countOpenPins } from '@/lib/formareview/model'
import {
  listSessions, getSession, saveSession, createAndSaveSession, deleteSession, autosaveSession,
} from '@/lib/formareview/persistence'
import { importFiles, importFromLibraryItem } from '@/lib/formareview/import'

export default function FormaReviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const addNotification = useAppStore((s) => s.addNotification)
  const fileRef = useRef(null)

  const [view, setView] = useState('library')
  const [sessions, setSessions] = useState([])
  const [session, setSession] = useState(null)
  const [selectedPageId, setSelectedPageId] = useState(null)
  const [busy, setBusy] = useState(false)

  const editor = useReviewEditor(session || {}, setSession)

  const refresh = useCallback(() => setSessions(listSessions()), [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const pending = sessionStorage.getItem('formareview-pending-library')
    if (!pending) return
    sessionStorage.removeItem('formareview-pending-library')
    let item
    try { item = JSON.parse(pending) } catch { return }
    if (!item?.dataUrl && !item?.previewUrl) return
    const s = createAndSaveSession(`Révision — ${item.name || 'Document'}`, { mode: 'plans' })
    const page = importFromLibraryItem(item)
    const full = { ...s, pages: [page], updatedAt: Date.now() }
    saveSession(full)
    refresh()
    setSession(JSON.parse(JSON.stringify(full)))
    setSelectedPageId(page.id)
    setView('editor')
    addNotification('Document ouvert dans FormaReview', 'success')
  }, [refresh, addNotification])

  useEffect(() => {
    if (!session) return undefined
    autosaveSession(session)
    return undefined
  }, [session])

  useEffect(() => {
    if (session && user?.id) {
      setSession((prev) => prev ? {
        ...prev,
        settings: {
          ...prev.settings,
          authorId: user.id,
          authorName: user.user_metadata?.full_name || user.email?.split('@')[0] || prev.settings?.authorName,
        },
      } : prev)
    }
  }, [user?.id])

  const currentPage = session?.pages?.find((p) => p.id === selectedPageId) || session?.pages?.[0] || null
  const pagePins = (session?.pins || []).filter((p) => p.pageId === currentPage?.id)
  const pageMarkups = (session?.markups || []).filter((m) => m.pageId === currentPage?.id)

  const openSession = (id) => {
    const s = getSession(id)
    if (!s) return
    setSession(JSON.parse(JSON.stringify(s)))
    setSelectedPageId(s.pages?.[0]?.id || null)
    setView('editor')
  }

  const handleNew = async (mode = 'plans') => {
    const modeInfo = REVIEW_MODES[mode]
    const s = createAndSaveSession(`Révision ${sessions.length + 1}`, {
      mode,
      description: modeInfo?.label || '',
      settings: { authorRole: mode === 'prof' ? 'prof' : mode === 'jury' ? 'jury' : 'team' },
    })
    refresh()
    openSession(s.id)
    addNotification('Session FormaReview créée', 'success')
  }

  const handleDelete = (id) => {
    deleteSession(id)
    refresh()
    if (session?.id === id) { setSession(null); setView('library') }
  }

  const handleImportPages = async (files) => {
    if (!files?.length || !session) return
    setBusy(true)
    try {
      const pages = await importFiles(Array.from(files))
      setSession((prev) => ({
        ...prev,
        pages: [...(prev.pages || []), ...pages],
        updatedAt: Date.now(),
      }))
      if (!selectedPageId) setSelectedPageId(pages[0]?.id)
      addNotification(`${pages.length} page(s) importée(s)`, 'success')
    } catch (err) {
      addNotification(err.message || 'Import échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleBack = () => {
    if (session) saveSession(session)
    setView('library')
    refresh()
  }

  const handleRoleChange = (role) => {
    setSession((prev) => ({
      ...prev,
      settings: { ...prev.settings, authorRole: role },
      updatedAt: Date.now(),
    }))
  }

  const handlePlacePin = (x, y) => {
    if (!currentPage) return
    editor.addPin(currentPage.id, x, y)
  }

  if (view === 'library') {
    return (
      <div style={{ minHeight: '100dvh', background: FRV_DARK.bg, color: FRV_DARK.ink, display: 'flex', flexDirection: 'column' }}>
        <FormaModuleHeader title="FormaReview" dark={FRV_DARK} />

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '24px 32px max(24px, env(safe-area-inset-bottom))', maxWidth: 960, margin: '0 auto', width: '100%' }}>
          <p style={{ color: FRV_DARK.muted, fontSize: 14, marginBottom: 24 }}>
            Corrections collaboratives — commentaires, pins, surlignages, flèches et dessins sur vos plans.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
            {Object.values(REVIEW_MODES).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleNew(m.id)}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: FRV_DARK.panel, border: `1px solid ${FRV_DARK.border}`, color: FRV_DARK.ink,
                }}
              >
                <span style={{ fontSize: 24 }}>{m.icon}</span>
                <div style={{ fontWeight: 600, marginTop: 8 }}>{m.label}</div>
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Sessions récentes</h2>
          {sessions.length === 0 ? (
            <p style={{ color: FRV_DARK.muted }}>Aucune session. Créez une révision ci-dessus.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map((s) => {
                const mode = REVIEW_MODES[s.mode]
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: FRV_DARK.panel, borderRadius: 10, border: `1px solid ${FRV_DARK.border}`,
                  }}>
                    <span style={{ fontSize: 20 }}>{mode?.icon || '📝'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: FRV_DARK.muted }}>
                        {s.pages?.length || 0} page(s) · {countOpenPins(s)} pin(s) ouvert(s) · {s.comments?.length || 0} commentaire(s)
                      </div>
                    </div>
                    <Btn onClick={() => openSession(s.id)}>Ouvrir</Btn>
                    <Btn muted onClick={() => handleDelete(s.id)}>Suppr.</Btn>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: FRV_DARK.bg, color: FRV_DARK.ink }}>
      <FormaModuleHeader title={session?.title || 'FormaReview'} dark={FRV_DARK} style={headerStyle}>
        <Btn onClick={handleBack}>← Retour</Btn>
        <Btn onClick={() => fileRef.current?.click()} disabled={busy}>
          {busy ? '…' : '+ Pages'}
        </Btn>
        <input ref={fileRef} type="file" accept="image/*,application/pdf,.pdf" multiple style={{ display: 'none' }} onChange={(e) => handleImportPages(e.target.files)} />
      </FormaModuleHeader>

      <ReviewToolbar
        tool={editor.tool}
        onToolChange={editor.setTool}
        color={editor.color}
        onColorChange={editor.setColor}
        role={session?.settings?.authorRole || 'prof'}
        onRoleChange={handleRoleChange}
      />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <ReviewSidebar
          session={session}
          selectedPageId={currentPage?.id}
          onSelectPage={setSelectedPageId}
          onAddPages={handleImportPages}
          onDeletePage={(id) => {
            const nextPages = (session?.pages || []).filter((p) => p.id !== id)
            if (selectedPageId === id) setSelectedPageId(nextPages[0]?.id || null)
            setSession((prev) => ({
              ...prev,
              pages: prev.pages.filter((p) => p.id !== id),
              pins: prev.pins.filter((p) => p.pageId !== id),
              markups: prev.markups.filter((m) => m.pageId !== id),
            }))
          }}
        />

        <ReviewCanvas
          page={currentPage}
          pins={pagePins}
          markups={pageMarkups}
          tool={editor.tool}
          selectedPinId={editor.selectedPinId}
          onPinClick={editor.setSelectedPinId}
          onPlacePin={handlePlacePin}
          onStartDraft={editor.startDraft}
          onUpdateDraft={editor.updateDraft}
          onCommitDraft={() => currentPage && editor.commitDraft(currentPage.id)}
          onAddText={(x, y, text) => currentPage && editor.addTextMarkup(currentPage.id, x, y, text)}
          draftRef={editor.draftRef}
        />

        <ReviewThreadPanel
          session={session}
          selectedPinId={editor.selectedPinId}
          pins={session?.pins || []}
          onAddComment={(opts) => editor.addComment(opts)}
          onReply={(parentId, content) => editor.addComment({ parentId, content, pinId: editor.selectedPinId })}
          onEdit={editor.editComment}
          onResolve={editor.resolveComment}
          onDelete={editor.deleteComment}
          onResolvePin={editor.resolvePin}
        />
      </div>
    </div>
  )
}

const headerStyle = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
  background: FRV_DARK.panel, borderBottom: `1px solid ${FRV_DARK.border}`,
}

function Btn({ children, onClick, muted, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: muted ? 'transparent' : FRV_DARK.accent,
        color: muted ? FRV_DARK.muted : '#1a1e28',
        border: muted ? `1px solid ${FRV_DARK.border}` : 'none',
        borderRadius: 8, padding: '6px 12px', cursor: disabled ? 'wait' : 'pointer',
        fontSize: 13, fontWeight: 600, opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}
