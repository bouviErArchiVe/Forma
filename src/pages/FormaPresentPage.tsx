import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '../components/BrandLogo'
import { PresentMode } from '../components/formapresent/PresentMode'
import { PresentSidebar } from '../components/formapresent/PresentSidebar'
import { PresentStage } from '../components/formapresent/PresentStage'
import { PresentToolbar } from '../components/formapresent/PresentToolbar'
import { GlassButton } from '../components/ui/GlassButton'
import { usePresentEditor } from '../hooks/usePresentEditor'
import { createElement } from '../lib/formapresent/model'
import { PRESENT_TEMPLATE_LIST } from '../lib/formapresent/constants'
import {
  autosaveDeck,
  createDeckFromTemplate,
  deleteDeck,
  duplicateDeck,
  getDeck,
  listDecks,
  saveDeck,
  searchDecks,
} from '../services/formapresent'
import { useToastStore } from '../stores/toastStore'
import type { FormaDeck, FormaPresentTemplateId } from '../types'

type View = 'library' | 'editor'

export function FormaPresentPage() {
  const [view, setView] = useState<View>('library')
  const [decks, setDecks] = useState<FormaDeck[]>([])
  const [deck, setDeck] = useState<FormaDeck | null>(null)
  const [search, setSearch] = useState('')
  const [presentMode, setPresentMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)

  const editor = usePresentEditor(deck, setDeck)

  const loadDecks = useCallback(async () => {
    const list = search.trim() ? await searchDecks(search) : await listDecks()
    setDecks(list)
  }, [search])

  useEffect(() => {
    void loadDecks()
  }, [loadDecks])

  useEffect(() => {
    if (!deck) return
    setSaving(true)
    void autosaveDeck(deck).finally(() => setSaving(false))
  }, [deck])

  const openDeck = async (id: string) => {
    const d = await getDeck(id)
    if (!d) return
    setDeck(structuredClone(d))
    editor.setSelectedSlideId(d.slides[0]?.id ?? null)
    setView('editor')
  }

  const handleNew = async (templateId: FormaPresentTemplateId) => {
    const d = await createDeckFromTemplate(templateId, `Présentation ${decks.length + 1}`)
    await loadDecks()
    setDeck(d)
    editor.setSelectedSlideId(d.slides[0]?.id ?? null)
    setView('editor')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette présentation ?')) return
    await deleteDeck(id)
    if (deck?.id === id) {
      setDeck(null)
      setView('library')
    }
    await loadDecks()
  }

  const handleDuplicate = async (id: string) => {
    const copy = await duplicateDeck(id)
    if (copy) {
      await loadDecks()
      await openDeck(copy.id)
    }
  }

  const handleImageFiles = (files: FileList | null) => {
    if (!files?.length || !editor.currentSlide) return
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const reader = new FileReader()
      reader.onload = () => {
        const el = createElement('image', {
          dataUrl: String(reader.result),
          label: file.name,
        })
        editor.addElement(editor.currentSlide!.id, el)
      }
      reader.readAsDataURL(file)
    }
    useToastStore.getState().show('Image(s) ajoutée(s)')
  }

  const selectedElement =
    editor.currentSlide?.elements.find((el) => el.id === editor.selectedElementId) ?? null

  const startSlideIndex = deck
    ? Math.max(0, deck.slides.findIndex((s) => s.id === editor.selectedSlideId))
    : 0

  if (presentMode && deck) {
    return (
      <PresentMode
        deck={deck}
        startIndex={startSlideIndex}
        onClose={() => setPresentMode(false)}
      />
    )
  }

  if (view === 'editor' && deck) {
    return (
      <div className="min-h-full flex flex-col h-screen max-h-screen">
        <header className="forma-glass-header px-4 py-2 flex flex-wrap items-center gap-3 border-b border-forma-border/50 shrink-0">
          <button
            type="button"
            className="text-sm text-forma-accent hover:underline"
            onClick={async () => {
              await saveDeck(deck)
              setView('library')
              await loadDecks()
            }}
          >
            ← Bibliothèque
          </button>
          <BrandLogo size="sm" subtitle="FormaPresent" />
          <input
            value={deck.title}
            onChange={(e) => setDeck({ ...deck, title: e.target.value })}
            onBlur={(e) => setDeck({ ...deck, title: e.target.value.trim() || deck.title })}
            className="flex-1 min-w-[10rem] font-medium bg-transparent border-b border-transparent focus:border-forma-accent outline-none text-sm"
          />
          {saving && <span className="text-xs text-forma-muted">Enregistrement…</span>}
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => void handleDelete(deck.id)}
          >
            Supprimer
          </button>
        </header>

        <PresentToolbar
          settings={deck.settings}
          selectedElement={selectedElement}
          onAddText={() => editor.currentSlide && editor.addTextElement(editor.currentSlide.id)}
          onAddImage={() => imageRef.current?.click()}
          onAlign={editor.alignSelected}
          onToggleGrid={() => editor.updateSettings({ showGrid: !deck.settings.showGrid })}
          onToggleGuides={() => editor.updateSettings({ showGuides: !deck.settings.showGuides })}
          onToggleSnap={() => editor.updateSettings({ snapToGrid: !deck.settings.snapToGrid })}
          onUpdateElement={(patch) =>
            editor.currentSlide &&
            editor.selectedElementId &&
            editor.updateElement(editor.currentSlide.id, editor.selectedElementId, patch)
          }
          onDeleteElement={() =>
            editor.currentSlide &&
            editor.selectedElementId &&
            editor.deleteElement(editor.currentSlide.id, editor.selectedElementId)
          }
          onPresent={() => setPresentMode(true)}
        />

        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleImageFiles(e.target.files)
            e.target.value = ''
          }}
        />

        <div className="flex flex-1 min-h-0">
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
            settings={deck.settings}
            selectedElementId={editor.selectedElementId}
            onSelectElement={editor.setSelectedElementId}
            onUpdateElement={editor.updateElement}
            onDeselect={() => editor.setSelectedElementId(null)}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col max-w-6xl mx-auto w-full p-4">
      <header className="forma-glass-header rounded-xl px-4 py-3 mb-6 flex flex-wrap items-center gap-3 border border-forma-border/50">
        <BrandLogo size="sm" subtitle="FormaPresent" />
        <div className="flex-1" />
        <Link to="/" className="text-sm text-forma-accent hover:underline">
          ← Bibliothèque
        </Link>
      </header>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher…"
        className="w-full border rounded-lg px-3 py-2 text-sm mb-6"
      />

      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3">Nouvelle présentation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PRESENT_TEMPLATE_LIST.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => void handleNew(t.id as FormaPresentTemplateId)}
              className="forma-glass-panel rounded-xl p-4 border border-forma-border/40 hover:ring-1 hover:ring-forma-accent/30 text-left"
            >
              <span className="text-2xl">{t.emoji}</span>
              <p className="text-sm font-medium mt-2">{t.label}</p>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3">Présentations récentes</h2>
        {decks.length === 0 ? (
          <p className="text-forma-muted text-sm py-8 text-center">
            Aucune présentation — choisissez un modèle ci-dessus
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((d) => (
              <article
                key={d.id}
                className="forma-glass-panel rounded-xl p-4 border border-forma-border/40 flex flex-col gap-2"
              >
                <h3 className="font-medium text-sm truncate">{d.title}</h3>
                <p className="text-xs text-forma-muted">
                  {d.slides.length} slide{d.slides.length > 1 ? 's' : ''} ·{' '}
                  {new Date(d.updatedAt).toLocaleDateString('fr-FR')}
                </p>
                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  <GlassButton accent size="sm" onClick={() => void openDeck(d.id)}>
                    Ouvrir
                  </GlassButton>
                  <GlassButton size="sm" onClick={() => void handleDuplicate(d.id)}>
                    Dupliquer
                  </GlassButton>
                  <button
                    type="button"
                    className="text-xs text-red-600 px-2"
                    onClick={() => void handleDelete(d.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
