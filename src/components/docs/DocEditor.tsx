import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormaDocument } from '../../types'
import {
  PAGE_H,
  PAGE_W,
  addDocumentPage,
  deleteDocumentPage,
  duplicateDocumentPage,
  updateDocumentPageHtml,
} from '../../lib/docs/model'
import { GlassButton } from '../ui/GlassButton'

interface DocEditorProps {
  doc: FormaDocument
  onChange: (doc: FormaDocument) => void
}

function execCmd(cmd: string, val?: string) {
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand(cmd, false, val ?? undefined)
}

export function DocEditor({ doc, onChange }: DocEditorProps) {
  const [activePage, setActivePage] = useState(0)
  const editorRefs = useRef<(HTMLDivElement | null)[]>([])

  const page = doc.pages[activePage]

  useEffect(() => {
    setActivePage((i) => Math.min(i, Math.max(0, doc.pages.length - 1)))
  }, [doc.pages.length])

  useEffect(() => {
    const el = editorRefs.current[activePage]
    if (!el || el.innerHTML === (page?.html || '')) return
    el.innerHTML = page?.html || '<p></p>'
  }, [activePage, page?.html])

  const syncPage = useCallback(
    (index: number, html: string) => {
      onChange(updateDocumentPageHtml(doc, index, html))
    },
    [doc, onChange],
  )

  const handleInput = (index: number) => {
    const el = editorRefs.current[index]
    if (el) syncPage(index, el.innerHTML)
  }

  const focusEditor = () => editorRefs.current[activePage]?.focus()

  const run = (cmd: string, val?: string) => {
    focusEditor()
    execCmd(cmd, val)
    handleInput(activePage)
  }

  const insertHtml = (html: string) => {
    focusEditor()
    execCmd('insertHTML', html)
    handleInput(activePage)
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        insertHtml(
          `<img src="${reader.result}" style="max-width:100%;border-radius:6px;margin:8px 0" alt=""/>`,
        )
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <div className="flex flex-1 min-h-0 gap-3">
      <aside className="w-36 shrink-0 forma-glass-panel rounded-xl p-2 border border-forma-border/40 overflow-y-auto">
        <p className="text-[11px] text-forma-muted px-1 mb-2">Pages ({doc.pages.length})</p>
        {doc.pages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePage(i)}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs mb-1 ${
              activePage === i ? 'bg-forma-accent/15 text-forma-accent font-medium' : 'hover:bg-white/40'
            }`}
          >
            Page {i + 1}
          </button>
        ))}
        <div className="flex flex-col gap-1 mt-2 pt-2 border-t border-forma-border/30">
          <button
            type="button"
            className="text-xs text-forma-muted hover:text-forma-text"
            onClick={() => {
              onChange(addDocumentPage(doc))
              setActivePage(doc.pages.length)
            }}
          >
            + Page
          </button>
          <button
            type="button"
            className="text-xs text-forma-muted hover:text-forma-text"
            onClick={() => onChange(duplicateDocumentPage(doc, activePage))}
          >
            Dupliquer
          </button>
          {doc.pages.length > 1 && (
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() => {
                onChange(deleteDocumentPage(doc, activePage))
                setActivePage(Math.max(0, activePage - 1))
              }}
            >
              Supprimer
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex flex-wrap gap-1 mb-3 p-2 forma-glass-panel rounded-xl border border-forma-border/40">
          {(
            [
              ['bold', 'B', 'bold'],
              ['italic', 'I', 'italic'],
              ['underline', 'U', 'underline'],
            ] as const
          ).map(([cmd, label]) => (
            <button
              key={cmd}
              type="button"
              onClick={() => run(cmd)}
              className="px-2 py-1 text-sm border rounded-lg min-w-[2rem] hover:bg-white/40"
            >
              {label}
            </button>
          ))}
          <span className="w-px bg-forma-border/50 mx-1" />
          {(
            [
              ['formatBlock', 'H1', 'h1'],
              ['formatBlock', 'H2', 'h2'],
              ['formatBlock', 'H3', 'h3'],
            ] as const
          ).map(([cmd, label, tag]) => (
            <button
              key={label}
              type="button"
              onClick={() => run(cmd, tag)}
              className="px-2 py-1 text-xs border rounded-lg hover:bg-white/40"
            >
              {label}
            </button>
          ))}
          <span className="w-px bg-forma-border/50 mx-1" />
          <button type="button" onClick={() => run('insertUnorderedList')} className="px-2 py-1 text-sm border rounded-lg">
            •
          </button>
          <button type="button" onClick={() => run('insertOrderedList')} className="px-2 py-1 text-sm border rounded-lg">
            1.
          </button>
          <button type="button" onClick={() => run('insertHorizontalRule')} className="px-2 py-1 text-sm border rounded-lg">
            ―
          </button>
          <button type="button" onClick={insertImage} className="px-2 py-1 text-sm border rounded-lg">
            🖼
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-neutral-200/50 dark:bg-neutral-900/50 rounded-xl p-6">
          {doc.pages.map((p, i) => (
            <div
              key={p.id}
              className={`mx-auto mb-8 bg-white shadow-lg rounded-sm ${i === activePage ? '' : 'hidden'}`}
              style={{
                width: PAGE_W,
                minHeight: PAGE_H,
                fontFamily: doc.fontFamily,
                fontSize: doc.fontSize,
                lineHeight: doc.lineHeight,
                padding: 48,
                boxSizing: 'border-box',
              }}
            >
              <div
                ref={(el) => {
                  editorRefs.current[i] = el
                }}
                contentEditable
                suppressContentEditableWarning
                className="outline-none min-h-[900px] doc-editor-content"
                onInput={() => handleInput(i)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function DocEditorToolbar({
  onExportTxt,
  onExportMd,
  onExportPdf,
  exporting,
}: {
  onExportTxt: () => void
  onExportMd: () => void
  onExportPdf: () => void
  exporting: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <GlassButton size="sm" onClick={onExportTxt}>
        TXT
      </GlassButton>
      <GlassButton size="sm" onClick={onExportMd}>
        MD
      </GlassButton>
      <GlassButton size="sm" disabled={exporting} onClick={onExportPdf}>
        {exporting ? '…' : 'PDF'}
      </GlassButton>
    </div>
  )
}
