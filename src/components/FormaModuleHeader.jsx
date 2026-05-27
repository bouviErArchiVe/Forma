import { useNavigate } from 'react-router-dom'
import BrandLogo from '@/components/BrandLogo'
import { useTheme } from '@/hooks/useAppearance'

/** En-tête module Forma — logo accueil + titre réutilisable */
export default function FormaModuleHeader({
  title,
  subtitle,
  onHome,
  children,
  sticky = false,
  style,
  dark,
}) {
  const navigate = useNavigate()
  const { T } = useTheme()
  const goHome = onHome || (() => navigate('/'))

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      borderBottom: `1px solid ${dark?.border || T.border}`,
      background: dark?.panel || T.surface,
      color: dark?.ink || T.ink,
      flexShrink: 0,
      position: sticky ? 'sticky' : undefined,
      top: sticky ? 0 : undefined,
      zIndex: sticky ? 20 : undefined,
      ...style,
    }}>
      <button
        type="button"
        onClick={goHome}
        title="Accueil Forma"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
      >
        <BrandLogo src={T?.img} alt={T?.n} size="sm" showText={false} accent={dark?.accent || T.accent} />
      </button>
      {(title || subtitle) && (
        <div style={{ minWidth: 0 }}>
          {title && (
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, fontFamily: "'Syne',sans-serif" }}>
              {title}
            </h1>
          )}
          {subtitle && (
            <div style={{ fontSize: 11, color: dark?.muted || T.muted, marginTop: title ? 2 : 0 }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
      {children && (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0,
        }}>
          {children}
        </div>
      )}
    </header>
  )
}
