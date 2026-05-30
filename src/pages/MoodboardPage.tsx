import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MoodboardCanvasItem } from '../components/moodboard/MoodboardCanvasItem'
import { MoodboardGridCard } from '../components/moodboard/MoodboardGridCard'
import { CalculatorDrawer } from '../components/tools/CalculatorDrawer'
import { BrandLogo } from '../components/BrandLogo'
import { GlassButton } from '../components/ui/GlassButton'
import { downloadMoodboardPng } from '../lib/moodboard/export'
import {
  addImageFromFile,
  addImageFromRemoteUrl,
  bringImageToFront,
  copyMoodboardLink,
  createBoard,
  deleteBoard,
  deleteImage,
  getArchivedBoards,
  getBoards,
  getStarredImages,
  resolveBoardImages,
  resolveImageUrl,
  toggleArchiveBoard,
  toggleStarImage,
  updateImage,
  type ResolvedMoodboardImage,
} from '../services/moodboard'
import { useToastStore } from '../stores/toastStore'
import type { MoodboardBoard } from '../types'

const BOARD_EMOJIS = ['🎨', '🌅', '🏛', '🌿', '🌊', '🔥', '💎', '🌙', '⭐', '🎭', '🏙', '🖼']
const BOARD_COLORS = ['#c8622a', '#3d6b8c', '#4a7c59', '#4527a0', '#e65100', '#0277bd', '#2d6a4f']

type NavTab = 'boards' | 'starred' | 'archives'
type ViewMode = 'grid' | 'canvas'

export function MoodboardPage() {
  const [searchParams] = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)

  const [boards, setBoards] = useState<MoodboardBoard[]>([])
  const [archivedBoards, setArchivedBoards] = useState<MoodboardBoard[]>([])
  const [images, setImages] = useState<ResolvedMoodboardImage[]>([])
  const [starredImages, setStarredImages] = useState<ResolvedMoodboardImage[]>([])
  const [nav, setNav] = useState<NavTab>('boards')
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNewBoard, setShowNewBoard] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('🎨')
  const [newColor, setNewColor] = useState(BOARD_COLORS[0])
  const [urlInput, setUrlInput] = useState('')
  const [showUrl, setShowUrl] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [lightbox, setLightbox] = useState<ResolvedMoodboardImage | null>(null)

  const activeBoard = boards.find((b) => b.id === activeBoardId)

  const loadBoards = useCallback(async () => {
    setBoards(await getBoards())
    setArchivedBoards(await getArchivedBoards())
    const starred = await getStarredImages()
    setStarredImages(
      await Promise.all(
        starred.map(async (img) => ({ ...img, url: await resolveImageUrl(img) })),
      ),
    )
  }, [])

  const loadImages = useCallback(async (boardId: string) => {
    setImages(await resolveBoardImages(boardId))
  }, [])

  useEffect(() => {
    void loadBoards()
  }, [loadBoards])

  useEffect(() => {
    const boardParam = searchParams.get('board')
    if (boardParam) setActiveBoardId(boardParam)
  }, [searchParams])

  useEffect(() => {
    if (activeBoardId) void loadImages(activeBoardId)
    else setImages([])
  }, [activeBoardId, loadImages])

  const displayImages = useMemo(() => {
    const q = search.trim().toLowerCase()
    const match = (i: ResolvedMoodboardImage) => {
      if (!q) return true
      return (
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (nav === 'starred') return starredImages.filter(match)
    if (!activeBoardId) return []
    return images.filter(match)
  }, [nav, activeBoardId, images, starredImages, search])

  const gridCols = viewMode === 'grid' ? 'columns-2 md:columns-3 xl:columns-4 gap-3' : ''

  const handleCreateBoard = async () => {
    if (!newName.trim()) return
    const board = await createBoard(newName.trim(), newEmoji, newColor)
    setShowNewBoard(false)
    setNewName('')
    await loadBoards()
    setActiveBoardId(board.id)
    setNav('boards')
  }

  const handleFiles = async (files: FileList | null) => {
    if (!activeBoardId || !files?.length) return
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      await addImageFromFile(activeBoardId, file)
    }
    await loadImages(activeBoardId)
    useToastStore.getState().show(`${files.length} image(s) ajoutée(s)`)
  }

  const handleAddUrl = async () => {
    if (!activeBoardId || !urlInput.trim()) return
    await addImageFromRemoteUrl(activeBoardId, urlInput.trim())
    setUrlInput('')
    setShowUrl(false)
    await loadImages(activeBoardId)
  }

  const handleExport = async () => {
    if (!displayImages.length) return
    setExporting(true)
    try {
      await downloadMoodboardPng(displayImages, {
        boardName: activeBoard?.name ?? 'moodboard',
        mode: viewMode,
      })
      useToastStore.getState().show('PNG exporté')
    } catch (err) {
      useToastStore.getState().show(err instanceof Error ? err.message : 'Export échoué', 5000)
    } finally {
      setExporting(false)
    }
  }

  const reloadView = useCallback(async () => {
    await loadBoards()
    if (activeBoardId) await loadImages(activeBoardId)
  }, [activeBoardId, loadBoards, loadImages])

  const patchImage = async (id: string, patch: Partial<ResolvedMoodboardImage>) => {
    await updateImage(id, patch)
    await reloadView()
  }

  return (
    <div className="min-h-full flex flex-col">
      <header className="forma-glass-header px-4 py-3 flex items-center gap-3 flex-wrap border-b border-forma-border/50">
        <Link to="/" className="text-sm text-forma-accent hover:underline shrink-0">
          ← Bibliothèque
        </Link>
        <BrandLogo size="sm" subtitle="FMoodboard" />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowCalc((v) => !v)}
          className={`text-sm px-2 py-1 border rounded-lg ${showCalc ? 'border-forma-accent bg-forma-accent/10' : ''}`}
        >
          🧮
        </button>
        {activeBoardId && displayImages.length > 0 && (
          <>
            <GlassButton size="sm" disabled={exporting} onClick={() => void handleExport()}>
              {exporting ? '…' : '⬇ PNG'}
            </GlassButton>
            <GlassButton
              size="sm"
              onClick={async () => {
                const ok = await copyMoodboardLink(activeBoardId)
                useToastStore.getState().show(ok ? 'Lien copié' : 'Copie impossible')
              }}
            >
              🔗
            </GlassButton>
          </>
        )}
        {activeBoardId && (
          <>
            <div className="flex border rounded-lg overflow-hidden text-sm">
              {(['grid', 'canvas'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setViewMode(m)}
                  className={`px-3 py-1 ${viewMode === m ? 'bg-forma-accent text-white' : ''}`}
                >
                  {m === 'grid' ? '▦' : '🖼'}
                </button>
              ))}
            </div>
            <GlassButton
              accent
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              + Image
            </GlassButton>
            <button
              type="button"
              className="text-xs text-forma-muted"
              onClick={() => setShowUrl((v) => !v)}
            >
              URL
            </button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </header>

      <div className="flex flex-1 min-h-0">
        <aside
          className={`forma-glass-panel border-r border-forma-border/50 flex flex-col shrink-0 transition-all ${
            sidebarCollapsed ? 'w-14' : 'w-56'
          }`}
        >
          <div className="p-3 border-b border-forma-border/40 flex items-center justify-between">
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold">FMoodboard</span>
            )}
            <button type="button" className="text-forma-muted text-xs" onClick={() => setSidebarCollapsed((v) => !v)}>
              {sidebarCollapsed ? '»' : '«'}
            </button>
          </div>

          {!sidebarCollapsed && (
            <div className="p-2 space-y-1 border-b border-forma-border/40">
              {(
                [
                  ['boards', '📋', 'Mes boards'],
                  ['starred', '★', 'Favoris'],
                  ['archives', '📦', 'Archives'],
                ] as const
              ).map(([id, icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setNav(id)
                    if (id !== 'boards') setActiveBoardId(null)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm ${
                    nav === id ? 'bg-forma-accent/15 text-forma-accent font-medium' : 'text-forma-muted'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {nav === 'boards' &&
              boards.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setActiveBoardId(b.id)
                    setNav('boards')
                  }}
                  className={`w-full text-left px-2 py-2 rounded-xl text-sm flex items-center gap-2 ${
                    activeBoardId === b.id ? 'bg-forma-accent/15 text-forma-accent' : 'hover:bg-white/30'
                  }`}
                  title={b.name}
                >
                  <span>{b.emoji}</span>
                  {!sidebarCollapsed && <span className="truncate flex-1">{b.name}</span>}
                </button>
              ))}
            {nav === 'archives' &&
              archivedBoards.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveBoardId(b.id)}
                  className="w-full text-left px-2 py-2 rounded-xl text-sm opacity-70"
                >
                  {b.emoji} {!sidebarCollapsed && b.name}
                </button>
              ))}
          </div>

          {!sidebarCollapsed && nav === 'boards' && (
            <div className="p-2 border-t border-forma-border/40">
              {showNewBoard ? (
                <div className="space-y-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nom"
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                  <div className="flex flex-wrap gap-1">
                    {BOARD_EMOJIS.slice(0, 8).map((e) => (
                      <button key={e} type="button" onClick={() => setNewEmoji(e)} className="text-lg">
                        {e}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {BOARD_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`w-5 h-5 rounded-full border-2 ${newColor === c ? 'border-forma-accent scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                      />
                    ))}
                  </div>
                  <GlassButton accent size="sm" className="w-full" onClick={() => void handleCreateBoard()}>
                    Créer
                  </GlassButton>
                </div>
              ) : (
                <GlassButton size="sm" className="w-full" onClick={() => setShowNewBoard(true)}>
                  + Board
                </GlassButton>
              )}
            </div>
          )}
        </aside>

        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap gap-2 items-center border-b border-forma-border/30">
            <h1 className="text-sm font-medium">
              {activeBoard ? `${activeBoard.emoji} ${activeBoard.name}` : nav === 'starred' ? '★ Favoris' : 'Moodboard'}
            </h1>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="ml-auto border rounded-lg px-2 py-1 text-sm max-w-xs"
            />
            {activeBoard && (
              <button
                type="button"
                className="text-xs text-forma-muted"
                onClick={async () => {
                  await toggleArchiveBoard(activeBoard.id)
                  await loadBoards()
                }}
              >
                {activeBoard.archived ? 'Désarchiver' : 'Archiver'}
              </button>
            )}
            {activeBoard && (
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={async () => {
                  if (!confirm(`Supprimer « ${activeBoard.name} » ?`)) return
                  await deleteBoard(activeBoard.id)
                  setActiveBoardId(null)
                  await loadBoards()
                }}
              >
                Supprimer
              </button>
            )}
          </div>

          {showUrl && activeBoardId && (
            <div className="px-4 py-2 flex gap-2 border-b border-forma-border/30">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://…"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <GlassButton size="sm" onClick={() => void handleAddUrl()}>
                Ajouter
              </GlassButton>
            </div>
          )}

          <div className="flex-1 overflow-auto p-4">
            {!activeBoardId && nav === 'boards' && (
              <div className="text-center py-20 text-forma-muted">
                <p className="text-4xl mb-3">🎭</p>
                <p>Sélectionnez ou créez un moodboard</p>
              </div>
            )}

            {displayImages.length === 0 && (activeBoardId || nav === 'starred') && (
              <div className="text-center py-16 text-forma-muted">
                <p>Aucune image — glissez des fichiers ou utilisez + Image</p>
              </div>
            )}

            {viewMode === 'grid' && displayImages.length > 0 && (
              <div className={gridCols}>
                {displayImages.map((img) => (
                  <MoodboardGridCard
                    key={img.id}
                    image={img}
                    onStar={() => void toggleStarImage(img.id).then(() => reloadView())}
                    onDelete={() => void deleteImage(img.id).then(() => reloadView())}
                    onOpen={() => setLightbox(img)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'canvas' && displayImages.length > 0 && activeBoardId && (
              <div
                className="relative min-h-[600px] bg-[#f0f0f0] dark:bg-neutral-900 rounded-xl border border-forma-border/40"
                style={{ minWidth: 800 }}
                onClick={() => setSelectedId(null)}
              >
                {displayImages.map((img) => (
                  <MoodboardCanvasItem
                    key={img.id}
                    image={img}
                    selected={selectedId === img.id}
                    onSelect={() => setSelectedId(img.id)}
                    onBringToFront={() => void bringImageToFront(img.id).then(() => loadImages(activeBoardId))}
                    onUpdate={(patch) => void patchImage(img.id, patch)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {lightbox?.url && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox.url} alt={lightbox.name} className="max-w-full max-h-full rounded-lg" />
        </div>
      )}

      <CalculatorDrawer open={showCalc} onClose={() => setShowCalc(false)} />
    </div>
  )
}
