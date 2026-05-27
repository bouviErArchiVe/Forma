// src/App.jsx
import { useEffect, lazy, Suspense } from 'react'
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
import ProformaPage from '@/pages/ProformaPage'
const FormatcalPage = lazy(() => import('@/pages/FormatcalPage'))
const FormaCombinePage = lazy(() => import('@/pages/FormaCombinePage'))
const FormaFolderPage = lazy(() => import('@/pages/FormaFolderPage'))
const FormaReviewPage = lazy(() => import('@/pages/FormaReviewPage'))
const FormaPresentPage = lazy(() => import('@/pages/FormaPresentPage'))
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

function ActivityTracker() {
  const recordAppActivity = useAppStore((s) => s.recordAppActivity)
  useEffect(() => { recordAppActivity() }, [recordAppActivity])
  return null
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
          <Route path="/moodboard" element={<ProtectedRoute><ErrorBoundary title="Erreur FMoodboard"><MoodboardPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/fmoodboard" element={<ProtectedRoute><ErrorBoundary title="Erreur FMoodboard"><MoodboardPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formulas" element={<ProtectedRoute><ErrorBoundary title="Erreur Formules"><FormulasPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formules" element={<ProtectedRoute><ErrorBoundary title="Erreur Formules"><FormulasPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/sheets" element={<ProtectedRoute><ErrorBoundary title="Erreur FormaTab"><SheetsPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formatab" element={<ProtectedRoute><ErrorBoundary title="Erreur FormaTab"><SheetsPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/docs" element={<ProtectedRoute><ErrorBoundary title="Erreur FormaDoc"><DocsPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formadoc" element={<ProtectedRoute><ErrorBoundary title="Erreur FormaDoc"><DocsPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/proforma" element={<ProtectedRoute><ErrorBoundary title="Erreur Proforma"><ProformaPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formatcal" element={<ProtectedRoute><ErrorBoundary title="Erreur FormatCal"><Suspense fallback={<AppLoading />}><FormatcalPage /></Suspense></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formacombine" element={<ProtectedRoute><ErrorBoundary title="Erreur FormaCombine"><Suspense fallback={<AppLoading />}><FormaCombinePage /></Suspense></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formafolder" element={<ProtectedRoute><ErrorBoundary title="Erreur FormaFolder"><Suspense fallback={<AppLoading />}><FormaFolderPage /></Suspense></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formareview" element={<ProtectedRoute><ErrorBoundary title="Erreur FormaReview"><Suspense fallback={<AppLoading />}><FormaReviewPage /></Suspense></ErrorBoundary></ProtectedRoute>} />
          <Route path="/formapresent" element={<ProtectedRoute><ErrorBoundary title="Erreur FormaPresent"><Suspense fallback={<AppLoading />}><FormaPresentPage /></Suspense></ErrorBoundary></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><ErrorBoundary title="Erreur FPause"><GamesPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/fpause" element={<ProtectedRoute><ErrorBoundary title="Erreur FPause"><GamesPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/translate" element={<ProtectedRoute><ErrorBoundary title="Erreur traduction scan"><TranslateScanPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><ErrorBoundary title="Erreur compte"><AccountPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/account/:tab" element={<ProtectedRoute><ErrorBoundary title="Erreur compte"><AccountPage /></ErrorBoundary></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  )
}
