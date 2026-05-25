// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import useAppStore from '@/stores/useAppStore'
import LibraryPage from '@/pages/LibraryPage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import Notifications from '@/components/Notifications'

const SYSTEM_FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#888' }}>
      Chargement…
    </div>
  )
  // Allow access without auth for now (offline-first)
  return children
}

export default function App() {
  const { getTheme } = useAppStore()
  const T = getTheme()

  useEffect(() => {
    // System fonts (Syne for labels, JetBrains Mono for code/timer) — loaded once
    if (!document.getElementById('forma-system-fonts')) {
      const link = document.createElement('link')
      link.id = 'forma-system-fonts'
      link.href = SYSTEM_FONTS
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }

    // Theme font — updated whenever theme changes
    let themeLink = document.getElementById('forma-theme-font')
    if (!themeLink) {
      themeLink = document.createElement('link')
      themeLink.id = 'forma-theme-font'
      themeLink.rel = 'stylesheet'
      document.head.appendChild(themeLink)
    }
    themeLink.href = `https://fonts.googleapis.com/css2?family=${T.fontUrl}&display=swap`

    // Global styles — reuse same element
    let style = document.getElementById('forma-global-style')
    if (!style) {
      style = document.createElement('style')
      style.id = 'forma-global-style'
      document.head.appendChild(style)
    }
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; overflow: hidden; }
      body { font-family: '${T.font}', sans-serif; -webkit-font-smoothing: antialiased; background: ${T.bg}; color: ${T.ink}; }
      :root { --accent: ${T.accent}; }
      #root { height: 100%; }
      button, input, select, textarea { font-family: '${T.font}', sans-serif; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      .fade-up { animation: fadeUp .28s ease forwards; }
    `
  }, [T.bg, T.ink, T.border, T.fontUrl, T.font])

  return (
    <BrowserRouter>
      <Notifications />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
