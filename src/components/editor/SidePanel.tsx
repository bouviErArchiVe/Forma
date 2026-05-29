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

  const tabs: { id: Panel; label: string; hint: string }[] = [
    { id: 'search', label: 'Recherche', hint: 'Ctrl+F' },
    { id: 'outline', label: 'Plan', hint: 'Blocs' },
    { id: 'audio', label: 'Audio', hint: 'Micro' },
    { id: 'ai', label: 'IA', hint: 'Local' },
    { id: 'ocr', label: 'OCR', hint: 'Scan' },
    { id: 'study', label: 'Révision', hint: 'SM-2' },
    { id: 'share', label: 'Partage', hint: 'Lien' },
    { id: 'history', label: 'Versions', hint: '15 max' },
  ]

  return (
    <>
      <div className="w-12 shrink-0 bg-forma-surface border-l border-forma-border flex flex-col items-center py-2 gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            title={`${t.label} (${t.hint})`}
            onClick={() => setOpen(open === t.id ? null : t.id)}
            className={`w-9 h-9 rounded text-xs font-medium ${
              open === t.id ? 'bg-forma-accent text-white' : 'hover:bg-gray-100'
            }`}
          >
            {t.label.slice(0, 2)}
          </button>
        ))}
      </div>
      {open && (
        <aside className="w-72 shrink-0 bg-forma-surface border-l border-forma-border overflow-y-auto p-3">
          <button type="button" className="text-xs text-forma-muted mb-2" onClick={() => setOpen(null)}>
            Fermer ×
          </button>
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
        </aside>
      )}
    </>
  )
}
