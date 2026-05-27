import { highlightParts } from '@/lib/formaai/search/normalize'
import { FAI_DARK } from '@/lib/formaai/constants'

export default function HighlightText({ text, query, style, matchStyle }) {
  const parts = highlightParts(text, query)
  return (
    <span style={style}>
      {parts.map((p, i) => (
        <span
          key={i}
          style={p.match ? {
            background: FAI_DARK.highlight,
            color: '#1a1e28',
            borderRadius: 2,
            padding: '0 2px',
            fontWeight: 600,
            ...matchStyle,
          } : undefined}
        >
          {p.text}
        </span>
      ))}
    </span>
  )
}
