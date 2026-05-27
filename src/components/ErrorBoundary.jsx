import { Component } from 'react'
import { resetFormaLocalData } from '@/lib/storage'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, showDetails: false }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Forma ErrorBoundary]', error, info?.componentStack)
  }

  handleResetData = () => {
    if (!confirm('Réinitialiser toutes les données locales Forma sur cet appareil ?')) return
    resetFormaLocalData()
    window.location.href = '/'
  }

  render() {
    const { error, showDetails } = this.state
    const { children, title = 'Une erreur est survenue' } = this.props

    if (!error) return children

    return (
      <div
        className="forma-page-shell"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: 24,
          background: 'var(--forma-bg, #faf4ee)',
        }}
      >
        <div style={{
          maxWidth: 440,
          width: '100%',
          padding: 24,
          borderRadius: 16,
          background: 'var(--forma-surface, #fff)',
          border: '1px solid var(--forma-border, #e6e6e6)',
          boxShadow: '0 12px 40px rgba(0,0,0,.12)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, marginBottom: 8, color: 'var(--forma-ink, #1c1c24)' }}>
            {title}
          </h2>
          <p style={{ fontSize: 13, color: 'var(--forma-muted, #888)', lineHeight: 1.5, marginBottom: 16 }}>
            {error?.message || 'Erreur inattendue'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => this.setState({ error: null, showDetails: false })}
              style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--forma-border, #e6e6e6)', background: 'var(--forma-bg, #faf4ee)', color: 'var(--forma-ink, #1c1c24)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Réessayer
            </button>
            <a
              href="/"
              style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--forma-accent, #d4714a)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}
            >
              Retour accueil
            </a>
            <button
              type="button"
              onClick={this.handleResetData}
              style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid #e9456044', background: '#e9456010', color: '#e94560', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Réinitialiser données locales
            </button>
          </div>
          <button
            type="button"
            onClick={() => this.setState((s) => ({ showDetails: !s.showDetails }))}
            style={{ background: 'none', border: 'none', color: 'var(--forma-muted, #888)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showDetails ? 'Masquer le détail' : 'Voir le détail de l\'erreur'}
          </button>
          {showDetails && (
            <pre style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: 'var(--forma-bg, #faf4ee)',
              border: '1px solid var(--forma-border, #e6e6e6)',
              fontSize: 10,
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: 160,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--forma-ink, #1c1c24)',
            }}>
              {error?.stack || error?.message}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
