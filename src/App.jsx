// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import ErrorBoundary from '@/components/ErrorBoundary'
import LibraryPage from '@/pages/LibraryPage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import MoodboardPage from '@/pages/MoodboardPage'
import FormulasPage from '@/pages/FormulasPage'
import GamesPage from '@/pages/GamesPage'
import AccountPage from '@/pages/AccountPage'
import Notifications from '@/components/Notifications'

function ProtectedRoute({ children }) {
  const { loading } = useAuth()
  if (loading) {
    return (
      <div className="forma-app-loading">
        Chargement…
      </div>
    )
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Notifications />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><ErrorBoundary title="Erreur bibliothèque"><LibraryPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/editor/:id" element={<ProtectedRoute><ErrorBoundary title="Erreur éditeur"><EditorPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/moodboard" element={<ProtectedRoute><ErrorBoundary title="Erreur moodboard"><MoodboardPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/formulas" element={<ProtectedRoute><ErrorBoundary title="Erreur formules"><FormulasPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><ErrorBoundary title="Erreur jeux"><GamesPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/account" element={<ProtectedRoute><ErrorBoundary title="Erreur compte"><AccountPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="/account/:tab" element={<ProtectedRoute><ErrorBoundary title="Erreur compte"><AccountPage /></ErrorBoundary></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
