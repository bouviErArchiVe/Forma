import { CANVAS_TEXT_FONTS, canvasFontCss, preloadCanvasFont } from '@/lib/fontUtils'

/** Sélecteur visuel de polices manuscrites pour l'outil texte canvas. */
export default function TextFontPicker({ T, value, onChange, compact = false }) {
  const current = value || 'Patrick Hand'

  const pick = (id) => {
    preloadCanvasFont(id)
    onChange?.(id)
  }

  if (compact) {
    return (
      <select
        value={current}
        onChange={(e) => pick(e.target.value)}
        style={{
          width: '100%',
          padding: '5px 6px',
          borderRadius: 7,
          border: `1px solid ${T.border}`,
          background: T.bg,
          color: T.ink,
          fontSize: 10,
          outline: 'none',
          cursor: 'pointer',
          fontFamily: canvasFontCss(current),
        }}
      >
        {CANVAS_TEXT_FONTS.map((f) => (
          <option key={f.id} value={f.id} style={{ fontFamily: canvasFontCss(f.id) }}>
            {f.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 5,
          maxHeight: 168,
          overflowY: 'auto',
        }}
      >
        {CANVAS_TEXT_FONTS.map((f) => {
          const active = current === f.id
          return (
            <button
              key={f.id}
              type="button"
              title={f.label}
              onClick={() => pick(f.id)}
              style={{
                padding: '6px 8px',
                borderRadius: 8,
                border: `1px solid ${active ? T.accent : T.border}`,
                background: active ? `${T.accent}14` : T.bg,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minHeight: 44,
              }}
            >
              <span
                style={{
                  fontFamily: canvasFontCss(f.id),
                  fontSize: 15,
                  color: T.ink,
                  lineHeight: 1.1,
                }}
              >
                Aa Bb
              </span>
              <span style={{ fontSize: 7, color: active ? T.accent : T.muted, fontWeight: active ? 700 : 500 }}>
                {f.label}
              </span>
            </button>
          )
        })}
      </div>
      <div
        style={{
          fontSize: 13,
          color: T.ink,
          fontFamily: canvasFontCss(current),
          lineHeight: 1.35,
          padding: '6px 8px',
          borderRadius: 8,
          background: `${T.accent}08`,
          border: `1px solid ${T.border}`,
        }}
      >
        Le croquis rapide — 123
      </div>
    </div>
  )
}
