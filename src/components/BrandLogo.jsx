import { BRAND } from '@/config/branding'

const SIZES = {
  sm: { img: 36, text: 14, gap: 6 },
  md: { img: 52, text: 17, gap: 8 },
  lg: { img: 72, text: 22, gap: 10 },
}

/** Logo Forma centré — img thème + wordmark */
export default function BrandLogo({
  src,
  alt,
  size = 'md',
  showText = true,
  subtitle,
  accent,
  ink,
  muted,
  className = '',
  style,
}) {
  const s = SIZES[size] || SIZES.md
  const word = BRAND.shortName.charAt(0) + BRAND.shortName.slice(1).toLowerCase()

  return (
    <div
      className={`forma-logo-container ${className}`.trim()}
      style={style}
    >
      {src && (
        <img
          src={src}
          alt={alt || BRAND.name}
          className="forma-logo"
          style={{
            width: s.img,
            height: s.img,
            borderRadius: size === 'lg' ? 18 : size === 'sm' ? 10 : 14,
            boxShadow: accent ? `0 6px 20px ${accent}44` : undefined,
          }}
        />
      )}
      {showText && (
        <div
          className="forma-logo-wordmark"
          style={{
            marginTop: s.gap,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: s.text,
            color: ink || 'inherit',
            lineHeight: 1,
          }}
        >
          {word}
        </div>
      )}
      {subtitle && (
        <div
          style={{
            marginTop: 4,
            fontSize: size === 'lg' ? 13 : 10,
            color: muted || 'inherit',
            textAlign: 'center',
            lineHeight: 1.35,
            maxWidth: 280,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  )
}

/** Vignette thème — icône parfaitement centrée, label en dessous */
export function ThemePreviewThumb({ theme, selected, onSelect, selectedLabel = '✓' }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        padding: 0,
        border: `2px solid ${selected ? '#c8622a' : 'rgba(128,128,128,.25)'}`,
        borderRadius: 13,
        overflow: 'hidden',
        cursor: 'pointer',
        background: 'none',
        transition: 'all .15s',
        width: '100%',
      }}
    >
      <div
        style={{
          height: 80,
          background: `linear-gradient(135deg,${theme.panel},${theme.surface})`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="forma-logo-container" style={{ height: '100%', padding: '10px 8px 18px' }}>
          {theme.img ? (
            <img
              src={theme.img}
              alt={theme.n}
              className="forma-logo"
              style={{
                width: 56,
                height: 56,
                borderRadius: 10,
                boxShadow: '0 2px 10px rgba(0,0,0,.25)',
              }}
            />
          ) : (
            <span style={{ fontSize: 28, lineHeight: 1, display: 'block' }}>{theme.e}</span>
          )}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 9,
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            color: `${theme.surface}cc`,
            padding: '3px 6px 5px',
            pointerEvents: 'none',
          }}
        >
          {theme.n}
        </div>
      </div>
      <div
        style={{
          padding: '5px 10px',
          background: theme.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          position: 'relative',
          minHeight: 26,
        }}
      >
        <div style={{ display: 'flex', gap: 3 }}>
          {[theme.accent, theme.a2, theme.a3].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: c }} />
          ))}
        </div>
        {selected && (
          <div
            style={{
              position: 'absolute',
              right: 8,
              fontSize: 9,
              color: theme.accent,
              fontWeight: 800,
            }}
          >
            {selectedLabel}
          </div>
        )}
      </div>
    </button>
  )
}
