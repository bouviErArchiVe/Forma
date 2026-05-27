import { highlightParts } from '@/lib/formalibrary/search'
import { FLB_DARK } from '@/lib/formalibrary/constants'

export default function HighlightText({ text, query }) {
  const parts = highlightParts(text, query)
  return (
    <span>
      {parts.map((p, i) => (
        <span key={i} style={p.match ? { background: FLB_DARK.highlight, color: '#1a1e28', borderRadius: 2, padding: '0 1px' } : undefined}>
          {p.text}
        </span>
      ))}
    </span>
  )
}
