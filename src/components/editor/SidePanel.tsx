import { useEffect, useState } from 'react'
import { AIPanel } from './panels/AIPanel'
import { AudioPanel } from './panels/AudioPanel'
import { SearchPanel } from './panels/SearchPanel'
import { SharePanel } from './panels/SharePanel'
import { OCRPanel } from './panels/OCRPanel'
import { StudyPanel } from './panels/StudyPanel'
import { HistoryPanel } from './panels/HistoryPanel'
import { OutlinePanel } from './panels/OutlinePanel'
import type { DocumentSearchHit } from '../../lib/search'
import type { Page } from '../../types'

const LAST_PANEL_KEY = 'forma-last-panel'

export type SidePanelId =
  | 'search'
  | 'outline'
  | 'audio'
  | 'ai'
  | 'ocr'
  | 'study'
  | 'share'
  | 'history'
  | null

type Panel = SidePanelId

interface SidePanelProps {
  notebookId: string
  page: Page
  pageIndex: number
  pageText: string
  studySnippet?: string
  onOcrText?: (text: string) => void
  onAddStudy?: (front: string, back: string) => void
  onSelectPage?: (pageId: string) => void
  onPageRestored?: (page: Page) => void
  onSearchHighlight?: (hit: DocumentSearchHit | null) => void
  /** Ouvre un panneau (ex. Ctrl+F → search) */
  openPanel?: SidePanelId
}

const PANEL_ICONS: Record<NonNullable<SidePanelId>, string> = {
  search: '⌕',
  outline: '≡',
  audio: '🎙',
  ai: '✦',
  ocr: '⊡',
  study: '📚',
  share: '↗',
  history: '⏱',
}

const PANEL_LABELS: Record<NonNullable<SidePanelId>, string> = {
  search: 'Recherche',
  outline: 'Plan',
  audio: 'Audio',
  ai: 'IA',
  ocr: 'OCR',
  study: 'Révision',
  share: 'Partage',
  history: 'Versions',
}

export function SidePanel({
  notebookId,
  page,
  pageIndex,
  pageText,
  studySnippet = '',
  onOcrText,
  onAddStudy,
  onSelectPage,
  onPageRestored,
  onSearchHighlight,
  openPanel,
}: SidePanelProps) {
  const pageId = page.id
  const [open, setOpen] = useState<Panel>(null)

  useEffect(() => {
    if (openPanel) setOpen(openPanel)
  }, [openPanel])

  useEffect(() => {
    if (open) localStorage.setItem(LAST_PANEL_KEY, open)
  }, [open])

  const panelIds = Object.keys(PANEL_ICONS) as NonNullable<SidePanelId>[]

  return (
    <>
      {/* Icon dock */}
      <div className="w-11 shrink-0 bg-forma-surface border-l border-forma-border flex flex-col items-center pt-2 pb-3 gap-0.5">
        {panelIds.map((id) => (
          <button
            key={id}
            type="button"
            title={`${PANEL_LABELS[id]} (${id === 'search' ? 'Ctrl+F' : id === 'history' ? '15 max' : ''})`}
            onClick={() => setOpen(open === id ? null : id)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all duration-150 ${
              open === id
                ? 'bg-forma-accent text-white shadow-sm'
                : 'text-forma-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-forma-text'
            }`}
          >
            <span className={id === 'ai' ? 'text-sm font-bold' : ''}>{PANEL_ICONS[id]}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      {open && (
        <aside
          className="w-72 shrink-0 bg-forma-surface border-l border-forma-border flex flex-col overflow-hidden panel-slide-right"
          key={open}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-forma-border shrink-0">
            <h3 className="text-sm font-semibold text-forma-text">{PANEL_LABELS[open]}</h3>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-forma-muted hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-forma-text transition-colors text-base"
              title="Fermer"
            >
              ×
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-3">
            {open === 'search' && (
              <SearchPanel
                notebookId={notebookId}
                pageId={pageId}
                onSelectPage={onSelectPage}
                onHighlight={onSearchHighlight}
              />
            )}
            {open === 'outline' && (
              <OutlinePanel page={page} pageIndex={pageIndex} onHighlight={onSearchHighlight} />
            )}
            {open === 'audio' && (
              <AudioPanel notebookId={notebookId} pageId={pageId} onSelectPage={onSelectPage} />
            )}
            {open === 'ai' && (
              <AIPanel
                page={page}
                notebookName={notebookId}
                contextText={pageText}
                onAddStudyPairs={
                  onAddStudy
                    ? async (pairs) => {
                        for (const p of pairs) await onAddStudy(p.front, p.back)
                      }
                    : undefined
                }
              />
            )}
            {open === 'ocr' && (
              <OCRPanel
                pageId={pageId}
                onInsertText={onOcrText}
                onAddToStudy={onAddStudy ? (t) => onAddStudy(t.slice(0, 120), t) : undefined}
              />
            )}
            {open === 'study' && (
              <StudyPanel notebookId={notebookId} pageText={pageText} selectionText={studySnippet} />
            )}
            {open === 'share' && <SharePanel notebookId={notebookId} />}
            {open === 'history' && onPageRestored && (
              <HistoryPanel page={page} onRestored={onPageRestored} />
            )}
          </div>
        </aside>
      )}
    </>
  )
}
