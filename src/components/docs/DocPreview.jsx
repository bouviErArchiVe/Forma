import { htmlToPlain } from '@/lib/docs/htmlUtils'
import { PAGE_W, PAGE_H } from '@/lib/docs/model'

export default function DocPreview({ doc, pageIndex = 0, scale = 0.22 }) {
  const page = doc?.pages?.[pageIndex] || doc?.pages?.[0]
  if (!page) return null
  const w = PAGE_W * scale
  const h = PAGE_H * scale

  return (
    <div style={{
      width: w, height: h, overflow: 'hidden', background: '#fff',
      border: '1px solid #ddd', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,.08)',
      fontFamily: doc.fontFamily || 'Inter,sans-serif', fontSize: (doc.fontSize || 14) * scale,
      lineHeight: doc.lineHeight || 1.6, padding: 16 * scale, boxSizing: 'border-box',
    }}>
      <div dangerouslySetInnerHTML={{ __html: page.html || '' }} style={{ transformOrigin: 'top left', pointerEvents: 'none' }} />
    </div>
  )
}

export function DocPreviewStrip({ doc, maxPages = 1 }) {
  const count = Math.min(doc?.pages?.length || 0, maxPages)
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {Array.from({ length: count }, (_, i) => (
        <DocPreview key={i} doc={doc} pageIndex={i} scale={0.12} />
      ))}
    </div>
  )
}

export function docPlainSnippet(doc, maxLen = 120) {
  const text = (doc?.pages || []).map((p) => htmlToPlain(p.html)).join(' ')
  return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
}
