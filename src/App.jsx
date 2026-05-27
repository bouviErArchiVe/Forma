// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import LibraryPage from '@/pages/LibraryPage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import MoodboardPage from '@/pages/MoodboardPage'
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
        <Route path="/" element={<ProtectedRoute><LibraryPage /></ProtectedRoute>} />
        <Route path="/editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
        <Route path="/moodboard" element={<ProtectedRoute><MoodboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
