// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import ErrorBoundary from '@/components/ErrorBoundary'
import AppLoading from '@/components/AppLoading'
import LibraryPage from '@/pages/LibraryPage'
import EditorPage from '@/pages/EditorPage'
import AuthPage from '@/pages/AuthPage'
import MoodboardPage from '@/pages/MoodboardPage'
import FormulasPage from '@/pages/FormulasPage'
import SheetsPage from '@/pages/SheetsPage'
import DocsPage from '@/pages/DocsPage'
import GamesPage from '@/pages/GamesPage'
import TranslateScanPage from '@/pages/TranslateScanPage'
import AccountPage from '@/pages/AccountPage'
import Notifications from '@/components/Notifications'
import EmojiBurst from '@/components/easter-eggs/EmojiBurst'
import PageTransition from '@/components/PageTransition'
import useAppStore from '@/stores/useAppStore'

function EasterEggLayer() {
  const burst = useAppStore((s) => s.easterEggBurst)
  const clearEasterEgg = useAppStore((s) => s.clearEasterEgg)
  return <EmojiBurst burst={burst} onDone={clearEasterEgg} />
}

function ProtectedRoute({ children }) {
  const { loading } = useAuth()
  if (loading) return <AppLoading />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <ActivityTracker />
      <Notifications />
      <EasterEggLayer />
      <PageTransition>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><ErrorBoundary title="Erreur bibliothèque"><LibraryPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/editor/:id" element={<ProtectedRoute><ErrorBoundary title="Erreur éditeur"><EditorPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/moodboard" element={<ProtectedRoute><ErrorBoundary title="Erreur moodboard"><MoodboardPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formulas" element={<ProtectedRoute><ErrorBoundary title="Erreur formules"><FormulasPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/sheets" element={<ProtectedRoute><ErrorBoundary title="Erreur tableur"><SheetsPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/docs" element={<ProtectedRoute><ErrorBoundary title="Erreur documents"><DocsPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><ErrorBoundary title="Erreur jeux"><GamesPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/translate" element={<ProtectedRoute><ErrorBoundary title="Erreur traduction scan"><TranslateScanPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><ErrorBoundary title="Erreur compte"><AccountPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/account/:tab" element={<ProtectedRoute><ErrorBoundary title="Erreur compte"><AccountPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  )
}
