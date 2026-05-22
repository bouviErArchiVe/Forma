// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import useAppStore from '@/stores/useAppStore'
import LibraryPage from '@/pages/LibraryPage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import Notifications from '@/components/Notifications'

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Nunito:wght@400;500;600;700&display=swap"

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif', fontSize: 14, color: '#888' }}>
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
    // Load fonts
    const link = document.createElement('link')
    link.href = FONT_LINK
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    // Apply global styles
    const style = document.createElement('style')
    style.textContent = `
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { height: 100%; overflow: hidden; }
      body { font-family: 'Nunito', sans-serif; -webkit-font-smoothing: antialiased; background: ${T.bg}; color: ${T.ink}; }
      #root { height: 100%; }
      button, input, select, textarea { font-family: 'Nunito', sans-serif; }
      ::-webkit-scrollbar { width: 5px; height: 5px; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
      .fade-up { animation: fadeUp .28s ease forwards; }
    `
    document.head.appendChild(style)
  }, [T.bg, T.ink, T.border])

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
