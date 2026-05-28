// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLoading from '@/components/AppLoading'
import AppLayout from '@/components/AppLayout'
import AuthPage from '@/pages/AuthPage'
import AccountPage from '@/pages/AccountPage'
import EditorPage from '@/pages/EditorPage'
import MoodboardPage from '@/pages/MoodboardPage'
import GamesPage from '@/pages/GamesPage'
import FormulasPage from '@/pages/FormulasPage'
import SheetsPage from '@/pages/SheetsPage'
import DocsPage from '@/pages/DocsPage'
import FormatcalPage from '@/pages/FormatcalPage'
import FormaCombinePage from '@/pages/FormaCombinePage'
import FormaFolderPage from '@/pages/FormaFolderPage'
import FormaReviewPage from '@/pages/FormaReviewPage'
import FormaPresentPage from '@/pages/FormaPresentPage'
import FormaLibraryPage from '@/pages/FormaLibraryPage'
import FormaAIPage from '@/pages/FormaAIPage'
import FormaDicoPage from '@/pages/FormaDicoPage'
import FormaMessagePage from '@/pages/FormaMessagePage'
import FormaHubPage from '@/pages/FormaHubPage'
import TranslateScanPage from '@/pages/TranslateScanPage'
import Notifications from '@/components/Notifications'
import SyncRecoveryModal from '@/components/sync/SyncRecoveryModal'
import GlobalSyncStatus from '@/components/sync/GlobalSyncStatus'
import FormaAILayer from '@/components/formaai/FormaAILayer'
import { useSyncBootstrap } from '@/hooks/useSyncBootstrap'
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
  const initVisualProfiles = useAppStore((s) => s.initVisualProfiles)
  useEffect(() => {
    recordAppActivity()
    initVisualProfiles()
  }, [recordAppActivity, initVisualProfiles])
  return null
}

function ProtectedRoute({ children }) {
  const { loading } = useAuth()
  if (loading) return <AppLoading />
  return children
}

function SyncLayer() {
  useSyncBootstrap()
  return (
    <>
      <SyncRecoveryModal />
      <GlobalSyncStatus />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ActivityTracker />
      <SyncLayer />
      <FormaAILayer />
      <Notifications />
      <EasterEggLayer />
      <PageTransition>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/editor/:id" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/editor" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
          <Route path="/moodboard" element={<ProtectedRoute><MoodboardPage /></ProtectedRoute>} />
          <Route path="/fmoodboard" element={<ProtectedRoute><MoodboardPage /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
          <Route path="/fpause" element={<ProtectedRoute><GamesPage /></ProtectedRoute>} />
          <Route path="/formulas" element={<ProtectedRoute><FormulasPage /></ProtectedRoute>} />
          <Route path="/formules" element={<ProtectedRoute><FormulasPage /></ProtectedRoute>} />
          <Route path="/sheets" element={<ProtectedRoute><SheetsPage /></ProtectedRoute>} />
          <Route path="/formatab" element={<ProtectedRoute><SheetsPage /></ProtectedRoute>} />
          <Route path="/docs" element={<ProtectedRoute><DocsPage /></ProtectedRoute>} />
          <Route path="/formadoc" element={<ProtectedRoute><DocsPage /></ProtectedRoute>} />
          <Route path="/formatcal" element={<ProtectedRoute><FormatcalPage /></ProtectedRoute>} />
          <Route path="/formacombine" element={<ProtectedRoute><FormaCombinePage /></ProtectedRoute>} />
          <Route path="/formafolder" element={<ProtectedRoute><FormaFolderPage /></ProtectedRoute>} />
          <Route path="/formareview" element={<ProtectedRoute><FormaReviewPage /></ProtectedRoute>} />
          <Route path="/formapresent" element={<ProtectedRoute><FormaPresentPage /></ProtectedRoute>} />
          <Route path="/formalibrary" element={<ProtectedRoute><FormaLibraryPage /></ProtectedRoute>} />
          <Route path="/formaai" element={<ProtectedRoute><FormaAIPage /></ProtectedRoute>} />
          <Route path="/formadico" element={<ProtectedRoute><FormaDicoPage /></ProtectedRoute>} />
          <Route path="/formamessage" element={<ProtectedRoute><FormaMessagePage /></ProtectedRoute>} />
          <Route path="/formahub" element={<ProtectedRoute><FormaHubPage /></ProtectedRoute>} />
          <Route path="/translate" element={<ProtectedRoute><TranslateScanPage /></ProtectedRoute>} />
          <Route path="/account/*" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  )
}
