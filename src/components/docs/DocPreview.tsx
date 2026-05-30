import type { FormaDocument } from '../../types'
import { docPlainSnippet, htmlToPlain } from '../../lib/docs/htmlUtils'
import { PAGE_H, PAGE_W } from '../../lib/docs/model'

interface DocPreviewProps {
  doc: FormaDocument
  pageIndex?: number
  scale?: number
}

export function DocPreview({ doc, pageIndex = 0, scale = 0.22 }: DocPreviewProps) {
  const page = doc.pages[pageIndex] ?? doc.pages[0]
  if (!page) return null
  const w = PAGE_W * scale
  const h = PAGE_H * scale

  return (
    <div
      className="bg-white border border-neutral-200 rounded shadow-sm overflow-hidden shrink-0"
      style={{
        width: w,
        height: h,
        fontFamily: doc.fontFamily,
        fontSize: doc.fontSize * scale,
        lineHeight: doc.lineHeight,
        padding: 16 * scale,
        boxSizing: 'border-box',
      }}
    >
      <div
        className="pointer-events-none"
        dangerouslySetInnerHTML={{ __html: page.html || '' }}
      />
    </div>
  )
}

export { docPlainSnippet, htmlToPlain }
