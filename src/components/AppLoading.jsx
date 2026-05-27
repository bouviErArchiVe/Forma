import { BRAND } from '@/config/branding'

/** Ecran de chargement initial, visible avant le premier rendu React. */
export default function AppLoading({ label = 'Chargement…' }) {
  return (
    <div className="forma-app-loading">
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: 28,
            color: 'var(--forma-ink, #1c1c24)',
            marginBottom: 4,
            letterSpacing: 0.5,
          }}
        >
          {BRAND.appName}
        </div>
        <div style={{ fontSize: 11, color: 'var(--forma-muted, #888)', marginBottom: 6 }}>
          par {BRAND.ecosystemName}
        </div>
        <div style={{ fontSize: 13, color: 'var(--forma-muted, #888)' }}>{label}</div>
      </div>
    </div>
  )
}
