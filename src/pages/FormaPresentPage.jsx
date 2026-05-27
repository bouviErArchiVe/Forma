import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BrandLogo from '@/components/BrandLogo'
import PresentSidebar from '@/components/formapresent/PresentSidebar'
import PresentStage from '@/components/formapresent/PresentStage'
import PresentToolbar from '@/components/formapresent/PresentToolbar'
import PresentImportModal from '@/components/formapresent/PresentImportModal'
import PresentMode from '@/components/formapresent/PresentMode'
import useAppStore from '@/stores/useAppStore'
import useMoodboardStore from '@/stores/useMoodboardStore'
import { usePresentEditor } from '@/hooks/usePresentEditor'
import { FPR_DARK, TEMPLATE_IDS } from '@/lib/formapresent/constants'
import { buildTemplate } from '@/lib/formapresent/templates'
import {
  listDecks, getDeck, saveDeck, deleteDeck, autosaveDeck,
} from '@/lib/formapresent/persistence'
import {
  importFileAsElement, importVideoFile, importInternalAsElement, importMoodboardAsElement,
} from '@/lib/formapresent/import'
import {
  downloadDeckPdf, downloadDeckZip, downloadDeckHtml, downloadAllSlidesIndividually,
} from '@/lib/formapresent/export'

export default function FormaPresentPage() {
  const navigate = useNavigate()
  const addNotification = useAppStore((s) => s.addNotification)
  const moodboardImages = useMoodboardStore((s) => s.images)
  const moodboardBoards = useMoodboardStore((s) => s.boards)

  const [view, setView] = useState('library')
  const [decks, setDecks] = useState([])
  const [deck, setDeck] = useState(null)
  const [importModal, setImportModal] = useState(false)
  const [presentMode, setPresentMode] = useState(false)
  const [busy, setBusy] = useState(false)

  const imageRef = useRef(null)
  const videoRef = useRef(null)

  const editor = usePresentEditor(deck || {}, setDeck)

  const refresh = useCallback(() => setDecks(listDecks()), [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (!deck) return undefined
    autosaveDeck(deck)
    return undefined
  }, [deck])

  const openDeck = (id) => {
    const d = getDeck(id)
    if (!d) return
    setDeck(JSON.parse(JSON.stringify(d)))
    editor.setSelectedSlideId(d.slides?.[0]?.id || null)
    setView('editor')
  }

  const handleNew = (templateId) => {
    const d = buildTemplate(templateId, `Présentation ${decks.length + 1}`)
    saveDeck(d)
    refresh()
    openDeck(d.id)
    addNotification(`Présentation ${TEMPLATE_IDS[templateId]?.label || ''} créée`, 'success')
  }

  const handleDelete = (id) => {
    deleteDeck(id)
    refresh()
    if (deck?.id === id) { setDeck(null); setView('library') }
  }

  const handleBack = () => {
    if (deck) saveDeck(deck)
    setView('library')
    refresh()
  }

  const handleExport = async (kind) => {
    if (!deck?.slides?.length) return
    setBusy(true)
    try {
      if (kind === 'pdf') await downloadDeckPdf(deck)
      else if (kind === 'png') await downloadDeckZip(deck, 'png')
      else if (kind === 'jpg') await downloadDeckZip(deck, 'jpg')
      else if (kind === 'html') await downloadDeckHtml(deck)
      else if (kind === 'slides') await downloadAllSlidesIndividually(deck, 'png')
      addNotification('Export terminé', 'success')
    } catch (err) {
      addNotification(err.message || 'Export échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleImageFile = async (files) => {
    if (!files?.length || !editor.currentSlide) return
    setBusy(true)
    try {
      for (const file of files) {
        const el = await importFileAsElement(file)
        editor.addElement(editor.currentSlide.id, el)
      }
      addNotification('Image(s) ajoutée(s)', 'success')
    } catch (err) {
      addNotification(err.message || 'Import échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleVideoFile = async (files) => {
    if (!files?.length || !editor.currentSlide) return
    setBusy(true)
    try {
      const el = await importVideoFile(files[0])
      editor.addElement(editor.currentSlide.id, el)
      addNotification('Vidéo ajoutée', 'success')
    } catch (err) {
      addNotification(err.message || 'Import vidéo échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleInternalImport = async (item) => {
    if (!editor.currentSlide) return
    setBusy(true)
    try {
      let el
      if (item.type === 'moodboard') {
        const imgs = moodboardImages.filter((i) => i.board_id === item.id)
        el = await importMoodboardAsElement(item.id, item.name, imgs)
      } else {
        el = await importInternalAsElement(item)
      }
      editor.addElement(editor.currentSlide.id, el)
      addNotification(`${item.name} inséré`, 'success')
    } catch (err) {
      addNotification(err.message || 'Import échoué', 'error')
    } finally {
      setBusy(false)
    }
  }

  const selectedElement = editor.currentSlide?.elements?.find((el) => el.id === editor.selectedElementId)

  if (presentMode && deck) {
    const startIdx = deck.slides.findIndex((s) => s.id === editor.selectedSlideId)
    return (
      <PresentMode
        deck={deck}
        startIndex={Math.max(0, startIdx)}
        onClose={() => setPresentMode(false)}
      />
    )
  }

  if (view === 'library') {
    return (
      <div style={{ minHeight: '100vh', background: FPR_DARK.bg, color: FPR_DARK.ink }}>
        <header style={headerStyle}>
          <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
            <BrandLogo size="sm" showText={false} />
          </button>
          <h1 style={{ margin: 0, fontSize: 18, flex: 1 }}>FormaPresent</h1>
        </header>

        <div style={{ padding: '24px 32px', maxWidth: 960, margin: '0 auto' }}>
          <p style={{ color: FPR_DARK.muted, fontSize: 14, marginBottom: 24 }}>
            Présentations intégrées — slides, texte, images, vidéos, Proforma, FormaTab, moodboards. Mode plein écran avec laser et notes.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 32 }}>
            {Object.values(TEMPLATE_IDS).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleNew(t.id)}
                style={{
                  padding: 16, borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  background: FPR_DARK.panel, border: `1px solid ${FPR_DARK.border}`, color: FPR_DARK.ink,
                }}
              >
                <span style={{ fontSize: 28 }}>{t.icon}</span>
                <div style={{ fontWeight: 600, marginTop: 8, fontSize: 13 }}>{t.label}</div>
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Présentations récentes</h2>
          {decks.length === 0 ? (
            <p style={{ color: FPR_DARK.muted }}>Aucune présentation. Choisissez un template ci-dessus.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {decks.map((d) => {
                const tmpl = TEMPLATE_IDS[d.template]
                return (
                  <div key={d.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    background: FPR_DARK.panel, borderRadius: 10, border: `1px solid ${FPR_DARK.border}`,
                  }}>
                    <span style={{ fontSize: 20 }}>{tmpl?.icon || '📽'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{d.title}</div>
                      <div style={{ fontSize: 11, color: FPR_DARK.muted }}>
                        {d.slides?.length || 0} slide(s) · {tmpl?.label || d.template}
                      </div>
                    </div>
                    <Btn onClick={() => openDeck(d.id)}>Ouvrir</Btn>
                    <Btn muted onClick={() => handleDelete(d.id)}>Suppr.</Btn>
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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: FPR_DARK.bg, color: FPR_DARK.ink }}>
      <header style={headerStyle}>
        <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
          <BrandLogo size="sm" showText={false} />
        </button>
        <Btn onClick={handleBack}>← Retour</Btn>
        <input
          value={deck?.title || ''}
          onChange={(e) => setDeck((prev) => ({ ...prev, title: e.target.value, updatedAt: Date.now() }))}
          style={{
            flex: 1, background: 'transparent', border: 'none', color: FPR_DARK.ink,
            fontSize: 16, fontWeight: 600, outline: 'none',
          }}
        />
        <select
          value=""
          onChange={(e) => { if (e.target.value) handleExport(e.target.value); e.target.value = '' }}
          disabled={busy}
          style={{
            background: FPR_DARK.surface, color: FPR_DARK.ink, border: `1px solid ${FPR_DARK.border}`,
            borderRadius: 8, padding: '6px 10px', fontSize: 12,
          }}
        >
          <option value="">Exporter…</option>
          <option value="pdf">PDF</option>
          <option value="png">ZIP PNG</option>
          <option value="jpg">ZIP JPG</option>
          <option value="html">HTML (navigateur / PowerPoint)</option>
          <option value="slides">PNG individuels</option>
        </select>
      </header>

      <PresentToolbar
        onAddText={() => editor.currentSlide && editor.addTextElement(editor.currentSlide.id)}
        onAddImage={() => imageRef.current?.click()}
        onAddVideo={() => videoRef.current?.click()}
        onImportForma={() => setImportModal(true)}
        onAlign={editor.alignSelected}
        onToggleGrid={() => editor.updateSettings({ showGrid: !deck.settings?.showGrid })}
        onToggleGuides={() => editor.updateSettings({ showGuides: !deck.settings?.showGuides })}
        onToggleSnap={() => editor.updateSettings({ snapToGrid: !deck.settings?.snapToGrid })}
        settings={deck?.settings}
        selectedElement={selectedElement}
        onUpdateElement={(patch) => editor.currentSlide && editor.updateElement(editor.currentSlide.id, editor.selectedElementId, patch)}
        onDeleteElement={() => editor.currentSlide && editor.deleteElement(editor.currentSlide.id, editor.selectedElementId)}
        onPresent={() => setPresentMode(true)}
      />

      <input ref={imageRef} type="file" accept="image/*,.pdf" multiple style={{ display: 'none' }} onChange={(e) => handleImageFile(e.target.files)} />
      <input ref={videoRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => handleVideoFile(e.target.files)} />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <PresentSidebar
          deck={deck}
          selectedSlideId={editor.selectedSlideId}
          onSelectSlide={editor.setSelectedSlideId}
          onAddSlide={() => editor.addSlide()}
          onDuplicateSlide={editor.duplicateSlide}
          onDeleteSlide={editor.deleteSlide}
          onUpdateSlide={editor.updateSlide}
          onReorder={editor.reorder}
        />

        <PresentStage
          slide={editor.currentSlide}
          settings={deck?.settings}
          selectedElementId={editor.selectedElementId}
          onSelectElement={editor.setSelectedElementId}
          onUpdateElement={editor.updateElement}
          onDeselect={() => editor.setSelectedElementId(null)}
        />
      </div>

      <PresentImportModal
        open={importModal}
        onClose={() => setImportModal(false)}
        onImportInternal={handleInternalImport}
        moodboards={moodboardBoards.filter((b) => !b.archived)}
      />
    </div>
  )
}

const headerStyle = {
  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
  background: FPR_DARK.panel, borderBottom: `1px solid ${FPR_DARK.border}`,
}

function Btn({ children, onClick, muted, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: muted ? 'transparent' : FPR_DARK.accent,
        color: muted ? FPR_DARK.muted : '#fff',
        border: muted ? `1px solid ${FPR_DARK.border}` : 'none',
        borderRadius: 8, padding: '6px 12px', cursor: disabled ? 'wait' : 'pointer',
        fontSize: 13, fontWeight: 600, opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}
