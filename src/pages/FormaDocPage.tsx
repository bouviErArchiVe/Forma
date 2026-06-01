/**
 * FormaDoc — éditeur de document riche minimal.
 *
 * Architecture :
 * - contenteditable <div> natif (pas de dépendance externe)
 * - Formatage via document.execCommand (standard, universel)
 * - Sauvegarde : débounce 800 ms → schedulePageSave (infra existante)
 * - Stockage : page.content (HTML string, champ optionnel sur Page)
 * - Export : impression + markdown (lib/formadoc-export.ts)
 * - Récupération crash : autosave IndexedDB existant
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getNotebook, renameNotebook } from '../services/library'
import { getPages } from '../services/pages'
import { schedulePageSave, subscribeAutosaveStatus } from '../services/autosave'
import { normalizePage } from '../types'
import { countWordsInHtml, downloadFormaDocMarkdown, printFormaDoc } from '../lib/formadoc-export'
import { useToastStore } from '../stores/toastStore'
import { pushRecent } from '../lib/recent'
import type { Notebook, Page } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormatCommand =
  | 'bold' | 'italic' | 'underline' | 'strikeThrough'
  | 'justifyLeft' | 'justifyCenter' | 'justifyRight' | 'justifyFull'
  | 'insertUnorderedList' | 'insertOrderedList'
  | 'removeFormat'

// ─── Toolbar button groups ─────────────────────────────────────────────────────

const BLOCK_STYLES = [
  { label: 'H1', title: 'Titre 1', tag: 'H1', formatBlock: 'h1' },
  { label: 'H2', title: 'Titre 2', tag: 'H2', formatBlock: 'h2' },
  { label: 'H3', title: 'Titre 3', tag: 'H3', formatBlock: 'h3' },
  { label: 'P',  title: 'Paragraphe', tag: 'P', formatBlock: 'p' },
]

const INLINE_FORMATS: { label: string; title: string; cmd: FormatCommand; style?: string }[] = [
  { label: 'B',  title: 'Gras (Ctrl+B)',      cmd: 'bold',          style: 'font-bold' },
  { label: 'I',  title: 'Italique (Ctrl+I)',   cmd: 'italic',        style: 'italic' },
  { label: 'U',  title: 'Souligné (Ctrl+U)',   cmd: 'underline',     style: 'underline' },
  { label: 'S',  title: 'Barré',               cmd: 'strikeThrough', style: 'line-through' },
]

const ALIGN_FORMATS: { label: string; title: string; cmd: FormatCommand }[] = [
  { label: '⇤', title: 'Aligner à gauche',  cmd: 'justifyLeft' },
  { label: '≡', title: 'Centrer',            cmd: 'justifyCenter' },
  { label: '⇥', title: 'Aligner à droite',  cmd: 'justifyRight' },
]

const LIST_FORMATS: { label: string; title: string; cmd: FormatCommand }[] = [
  { label: '• —', title: 'Liste à puces',     cmd: 'insertUnorderedList' },
  { label: '1 —', title: 'Liste numérotée',   cmd: 'insertOrderedList' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function FormaDocPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [notebook, setNotebook] = useState<Notebook | null>(null)
  const [page, setPage] = useState<Page | null>(null)
  const [title, setTitle] = useState('')
  const [editingTitle, setEditingTitle] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
  const [wordCount, setWordCount] = useState(0)
  const [loaded, setLoaded] = useState(false)

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return
    void (async () => {
      const nb = await getNotebook(id)
      if (!nb || nb.deletedAt) { navigate('/'); return }
      setNotebook(nb)
      setTitle(nb.name)
      pushRecent(id)

      const pages = await getPages(id)
      const p = pages[0]
      if (!p) { navigate('/'); return }
      setPage(p)

      // Inject HTML content into editor
      const html = p.content ?? '<p></p>'
      if (editorRef.current) {
        editorRef.current.innerHTML = html
        // Place cursor at end
        const sel = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        sel?.removeAllRanges()
        sel?.addRange(range)
        editorRef.current.focus()
      }
      setWordCount(countWordsInHtml(html))
      setLoaded(true)
    })()
  }, [id, navigate])

  // ── Autosave status subscription ─────────────────────────────────────────

  useEffect(() => {
    return subscribeAutosaveStatus((status) => {
      if (status === 'saving') setSaveStatus('saving')
      else if (status === 'error') setSaveStatus('error')
      else setSaveStatus('saved')
    })
  }, [])

  // ── Debounced save ────────────────────────────────────────────────────────

  const scheduleSave = useCallback(() => {
    if (!page) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(() => {
      if (!editorRef.current || !page) return
      const html = editorRef.current.innerHTML
      const updated = normalizePage({ ...page, content: html })
      setPage(updated)
      schedulePageSave(updated)
      setWordCount(countWordsInHtml(html))
    }, 800)
  }, [page])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  // ── execCommand wrapper ────────────────────────────────────────────────────

  const exec = useCallback((cmd: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    scheduleSave()
  }, [scheduleSave])

  const applyBlock = useCallback((tag: string) => {
    exec('formatBlock', tag)
  }, [exec])

  // ── Image insertion ────────────────────────────────────────────────────────

  const MAX_IMAGE_BYTES = 10 * 1024 * 1024
  const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

  const handleImageFile = useCallback((file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      useToastStore.getState().show(`Format non supporté : ${file.type || 'inconnu'}`, 4000)
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1)
      useToastStore.getState().show(`Image trop volumineuse (${mb} Mo, max 10 Mo)`, 4000)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      editorRef.current?.focus()
      document.execCommand('insertHTML', false,
        `<img src="${dataUrl}" alt="" style="max-width:100%;height:auto;border-radius:6px;margin:8px 0;" />`
      )
      scheduleSave()
    }
    reader.onerror = () => useToastStore.getState().show("Impossible de lire l'image", 4000)
    reader.readAsDataURL(file)
  }, [scheduleSave])

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const ctrl = e.ctrlKey || e.metaKey
    if (ctrl && e.key === 'z') { e.preventDefault(); exec('undo'); return }
    if (ctrl && e.shiftKey && e.key === 'Z') { e.preventDefault(); exec('redo'); return }
    if (ctrl && e.key === 'y') { e.preventDefault(); exec('redo'); return }
    if (ctrl && e.key === 'b') { e.preventDefault(); exec('bold'); return }
    if (ctrl && e.key === 'i') { e.preventDefault(); exec('italic'); return }
    if (ctrl && e.key === 'u') { e.preventDefault(); exec('underline'); return }
    // Ensure <p> not <div> on Enter in empty block
    if (e.key === 'Enter' && !e.shiftKey) {
      const sel = window.getSelection()
      if (sel?.rangeCount) {
        const node = sel.getRangeAt(0).startContainer
        const el = (node.nodeType === Node.TEXT_NODE ? node.parentElement : node as HTMLElement)
        const tag = (el as HTMLElement)?.tagName?.toLowerCase()
        if (tag === 'h1' || tag === 'h2' || tag === 'h3') {
          // After heading, insert paragraph
          e.preventDefault()
          exec('insertParagraph')
          exec('formatBlock', 'p')
          return
        }
      }
    }
  }, [exec])

  // ── Paste handling (strip dangerous styles, keep structure) ────────────────

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text/plain')
    const html = e.clipboardData.getData('text/html')
    if (html) {
      // Strip potentially harmful attributes but keep structure
      e.preventDefault()
      const clean = sanitizePastedHtml(html)
      document.execCommand('insertHTML', false, clean)
      scheduleSave()
    } else if (text) {
      e.preventDefault()
      const lines = text.split('\n')
      const htmlLines = lines.map((l) => `<p>${escapeHtml(l) || '<br>'}</p>`).join('')
      document.execCommand('insertHTML', false, htmlLines)
      scheduleSave()
    }
  }, [scheduleSave])

  // ── Title rename ───────────────────────────────────────────────────────────

  const commitTitle = useCallback(async () => {
    const trimmed = title.trim()
    if (!trimmed || !notebook || trimmed === notebook.name) {
      setTitle(notebook?.name ?? '')
      setEditingTitle(false)
      return
    }
    await renameNotebook(notebook.id, trimmed)
    setNotebook((n) => n ? { ...n, name: trimmed } : n)
    setEditingTitle(false)
  }, [title, notebook])

  // ── Export actions ─────────────────────────────────────────────────────────

  const handlePrint = () => {
    const html = editorRef.current?.innerHTML ?? ''
    printFormaDoc(html, title)
  }

  const handleExportMarkdown = () => {
    const html = editorRef.current?.innerHTML ?? ''
    downloadFormaDocMarkdown(html, title)
    useToastStore.getState().show('Markdown exporté')
  }

  // ── Active format detection ────────────────────────────────────────────────

  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const [activeBlock, setActiveBlock] = useState<string>('p')

  const updateActiveFormats = useCallback(() => {
    if (!document.queryCommandSupported('bold')) return
    const active = new Set<string>()
    if (document.queryCommandState('bold')) active.add('bold')
    if (document.queryCommandState('italic')) active.add('italic')
    if (document.queryCommandState('underline')) active.add('underline')
    if (document.queryCommandState('strikeThrough')) active.add('strikeThrough')
    if (document.queryCommandState('insertUnorderedList')) active.add('insertUnorderedList')
    if (document.queryCommandState('insertOrderedList')) active.add('insertOrderedList')
    if (document.queryCommandState('justifyLeft')) active.add('justifyLeft')
    if (document.queryCommandState('justifyCenter')) active.add('justifyCenter')
    if (document.queryCommandState('justifyRight')) active.add('justifyRight')
    setActiveFormats(active)
    // Block type
    try {
      const val = document.queryCommandValue('formatBlock').toLowerCase()
      setActiveBlock(val || 'p')
    } catch { /* ignore */ }
  }, [])

  const handleSelectionChange = useCallback(() => {
    updateActiveFormats()
  }, [updateActiveFormats])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [handleSelectionChange])

  // ─── UI ─────────────────────────────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forma-bg">
        <div className="text-forma-muted text-sm animate-pulse">Chargement du document…</div>
      </div>
    )
  }

  const tbBtn = (active: boolean, onClick: () => void, title: string, label: string, extraClass = '') =>
    <button
      key={label + title}
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      className={`px-2 h-7 rounded text-xs font-medium transition-all duration-100 ${extraClass} ${
        active
          ? 'bg-forma-accent text-white shadow-sm'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-forma-text'
      }`}
    >
      {label}
    </button>

  return (
    <div className="min-h-screen flex flex-col bg-forma-bg text-forma-text">
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-forma-surface border-b border-forma-border shadow-sm flex items-center gap-2 px-3 py-2">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Retour à la bibliothèque"
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 text-forma-muted hover:text-forma-text transition-colors shrink-0"
        >
          ←
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void commitTitle()
                if (e.key === 'Escape') { setTitle(notebook?.name ?? ''); setEditingTitle(false) }
              }}
              className="forma-input w-full max-w-xs text-sm"
              autoFocus
            />
          ) : (
            <button
              type="button"
              className="text-sm font-semibold truncate max-w-xs text-left hover:text-forma-accent transition-colors"
              onClick={() => setEditingTitle(true)}
              title="Cliquer pour renommer"
            >
              {notebook?.name ?? ''}
            </button>
          )}
        </div>

        {/* Save status */}
        <span className={`text-xs shrink-0 ${
          saveStatus === 'error' ? 'text-red-500' :
          saveStatus === 'saving' ? 'text-amber-500' :
          'text-forma-muted'
        }`}>
          {saveStatus === 'error' ? '⚠ Erreur' : saveStatus === 'saving' ? '…' : '✓'}
        </span>

        {/* Word count */}
        <span className="text-xs text-forma-muted shrink-0 hidden sm:inline">
          {wordCount} mot{wordCount !== 1 ? 's' : ''}
        </span>

        {/* Export menu */}
        <ExportDropdown onPrint={handlePrint} onMarkdown={handleExportMarkdown} />
      </header>

      {/* ── Format toolbar ───────────────────────────────────────────────────── */}
      <div
        className="sticky top-[48px] z-10 bg-forma-surface border-b border-forma-border px-3 py-1.5 flex flex-wrap gap-1 items-center"
        onMouseDown={(e) => e.preventDefault()} // keep editor focus
      >
        {/* Block styles */}
        <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
          {BLOCK_STYLES.map(({ label, title: t, formatBlock }) =>
            tbBtn(activeBlock === formatBlock, () => applyBlock(formatBlock), t, label)
          )}
        </div>

        {/* Inline formats */}
        <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
          {INLINE_FORMATS.map(({ label, title: t, cmd, style }) =>
            tbBtn(activeFormats.has(cmd), () => exec(cmd), t, label, style ?? '')
          )}
        </div>

        {/* Lists */}
        <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
          {LIST_FORMATS.map(({ label, title: t, cmd }) =>
            tbBtn(activeFormats.has(cmd), () => exec(cmd), t, label)
          )}
        </div>

        {/* Alignment */}
        <div className="flex gap-0.5 border-r border-forma-border pr-2 mr-1">
          {ALIGN_FORMATS.map(({ label, title: t, cmd }) =>
            tbBtn(activeFormats.has(cmd), () => exec(cmd), t, label)
          )}
        </div>

        {/* Image */}
        <button
          type="button"
          title="Insérer une image"
          onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click() }}
          className="px-2 h-7 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-forma-text transition-colors"
        >
          🖼
        </button>

        {/* Clear format */}
        <button
          type="button"
          title="Supprimer le formatage"
          onMouseDown={(e) => { e.preventDefault(); exec('removeFormat') }}
          className="px-2 h-7 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-700 text-forma-muted transition-colors ml-auto"
        >
          ✕ format
        </button>
      </div>

      {/* ── Editor body ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex justify-center py-8 px-4 overflow-auto">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleSave}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          spellCheck
          className="formadoc-editor w-full max-w-[720px] min-h-[calc(100vh-200px)] bg-forma-surface rounded-xl shadow-sm border border-forma-border px-10 py-10 outline-none focus:ring-2 focus:ring-forma-accent/20 text-forma-text"
          style={{ lineHeight: '1.75', fontSize: '15px' }}
          data-placeholder="Commencez à écrire…"
          aria-label="Éditeur de document"
          role="textbox"
          aria-multiline="true"
        />
      </div>

      {/* Image file input */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleImageFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// ─── Export dropdown ──────────────────────────────────────────────────────────

function ExportDropdown({ onPrint, onMarkdown }: { onPrint: () => void; onMarkdown: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs px-2.5 py-1 border border-forma-border rounded-lg bg-forma-surface hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        Exporter ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 bg-forma-surface border border-forma-border rounded-xl shadow-lg py-1 min-w-[160px] text-sm">
            <button
              type="button"
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { setOpen(false); onPrint() }}
            >
              🖨 Imprimer / PDF
            </button>
            <button
              type="button"
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => { setOpen(false); onMarkdown() }}
            >
              📄 Markdown (.md)
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip dangerous attributes from pasted HTML, keep safe structure. */
function sanitizePastedHtml(html: string): string {
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  // Remove script, style, meta, link elements
  for (const tag of ['script', 'style', 'meta', 'link', 'iframe', 'object', 'embed']) {
    for (const el of Array.from(tmp.querySelectorAll(tag))) el.remove()
  }
  // Strip dangerous attributes
  const dangerousAttrs = ['onload', 'onerror', 'onclick', 'onmouseover', 'onfocus',
    'onblur', 'onkeydown', 'onkeyup', 'onkeypress', 'onsubmit', 'onchange']
  for (const el of Array.from(tmp.querySelectorAll('*'))) {
    for (const attr of dangerousAttrs) el.removeAttribute(attr)
    // Remove javascript: hrefs
    const href = el.getAttribute('href') ?? ''
    if (href.trim().toLowerCase().startsWith('javascript:')) el.removeAttribute('href')
    // Strip style (can contain expressions)
    el.removeAttribute('style')
    // Strip class (not needed, avoids layout bleed)
    el.removeAttribute('class')
  }
  return tmp.innerHTML
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
