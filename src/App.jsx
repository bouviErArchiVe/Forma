// src/App.jsx
import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLoading from '@/components/AppLoading'
import AppLayout from '@/components/AppLayout'
import AuthPage from '@/pages/AuthPage'
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
          <Route path="/editor/*" element={<Navigate to="/" replace />} />
          <Route path="/moodboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </BrowserRouter>
  )
}
