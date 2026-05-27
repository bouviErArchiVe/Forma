import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Forma ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    const { children, title = 'Une erreur est survenue' } = this.props

    if (!error) return children

    return (
      <div className="forma-page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          maxWidth: 420,
          width: '100%',
          padding: 24,
          borderRadius: 16,
          background: 'var(--forma-surface)',
          border: '1px solid var(--forma-border)',
          boxShadow: '0 12px 40px rgba(0,0,0,.12)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, marginBottom: 8, color: 'var(--forma-ink)' }}>{title}</h2>
          <p style={{ fontSize: 13, color: 'var(--forma-muted)', lineHeight: 1.5, marginBottom: 16 }}>
            {error?.message || 'Erreur inattendue'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid var(--forma-border)', background: 'var(--forma-bg)', color: 'var(--forma-ink)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
            >
              Réessayer
            </button>
            <Link
              to="/"
              style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: 'var(--forma-accent, #d4714a)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}
            >
              Retour bibliothèque
            </Link>
          </div>
        </div>
      </div>
    )
  }
}
