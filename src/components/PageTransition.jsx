import { useLocation } from 'react-router-dom'

/** Transition légère entre routes (fade + slide, CSS only). */
export default function PageTransition({ children }) {
  const location = useLocation()
  const isEditor = location.pathname.startsWith('/editor')

  return (
    <div
      key={location.pathname}
      className={`forma-route-enter${isEditor ? ' forma-route-enter--editor' : ''}`}
      style={{ minHeight: '100%', height: '100%' }}
    >
      {children}
    </div>
  )
}
