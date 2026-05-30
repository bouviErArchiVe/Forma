import { highlightParts } from '../../lib/formaai/normalize'

interface HighlightTextProps {
  text: string
  query: string
}

export function HighlightText({ text, query }: HighlightTextProps) {
  const parts = highlightParts(text, query)
  return (
    <>
      {parts.map((p, i) =>
        p.match ? (
          <mark
            key={i}
            className="bg-forma-accent/30 text-forma-text rounded-[2px] px-0.5 font-semibold"
          >
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  )
}
