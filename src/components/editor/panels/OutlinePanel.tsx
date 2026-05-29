import { computePageStats } from '../../../lib/page-stats'
import type { DocumentSearchHit } from '../../../lib/search'
import type { Page } from '../../../types'

interface OutlinePanelProps {
  page: Page
  pageIndex: number
  onHighlight?: (hit: DocumentSearchHit | null) => void
}

export function OutlinePanel({ page, pageIndex, onHighlight }: OutlinePanelProps) {
  const texts = page.texts.filter((t) => t.content.trim())
  const hasPdf = !!page.pdfText?.trim()
  const hasInk = !!page.inkText?.trim()

  const stats = computePageStats(page)

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-forma-muted">
        Page {pageIndex} · {stats.strokes} traits · {stats.words} mots · {stats.images} image(s)
      </p>
      {!texts.length && !hasPdf && !hasInk && (
        <p className="text-forma-muted text-xs">Aucun bloc texte indexé.</p>
      )}
      <ul className="space-y-1">
        {texts.map((t, i) => (
          <li key={t.id}>
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent hover:border-forma-border"
              onClick={() =>
                onHighlight?.({
                  pageId: page.id,
                  pageIndex,
                  snippet: t.content.slice(0, 80),
                  source: 'text',
                  textId: t.id,
                })
              }
            >
              <span className="text-[10px] text-forma-muted">#{i + 1}</span>
              <p className="line-clamp-2">{t.content.trim() || '(vide)'}</p>
            </button>
          </li>
        ))}
      </ul>
      {hasPdf && (
        <details className="text-xs">
          <summary className="cursor-pointer text-forma-muted">Texte PDF indexé</summary>
          <p className="mt-1 max-h-24 overflow-y-auto text-forma-muted whitespace-pre-wrap">
            {page.pdfText!.slice(0, 400)}
            {page.pdfText!.length > 400 ? '…' : ''}
          </p>
        </details>
      )}
      {hasInk && (
        <details className="text-xs">
          <summary className="cursor-pointer text-forma-muted">OCR manuscrit (encre)</summary>
          <p className="mt-1 max-h-24 overflow-y-auto text-forma-muted whitespace-pre-wrap">
            {page.inkText!.slice(0, 400)}
            {page.inkText!.length > 400 ? '…' : ''}
          </p>
        </details>
      )}
    </div>
  )
}
