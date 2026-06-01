import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CommandPalette } from './components/CommandPalette'
import { ConfirmDialog } from './components/ConfirmDialog'
import { MultiTabBanner, OfflineBanner } from './components/OfflineBanner'
import { Onboarding } from './components/Onboarding'
import { PwaInstallBanner } from './components/PwaInstallBanner'
import { Toast } from './components/Toast'
import { useSettingsStore } from './stores/settingsStore'

interface ErrorBoundaryState { error: Error | null }
class AppErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(_err: Error, info: ErrorInfo) {
    console.error('[Forma] Erreur non gérée:', _err, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 bg-gray-950 text-gray-100">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-semibold">Une erreur est survenue</h1>
          <p className="text-sm text-gray-400 max-w-md text-center">{this.state.error.message}</p>
          <button
            type="button"
            className="px-4 py-2 bg-forma-accent text-white rounded-lg text-sm"
            onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
          >
            Retour à la bibliothèque
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const LibraryPage = lazy(() => import('./pages/LibraryPage').then((m) => ({ default: m.LibraryPage })))
const EditorPage = lazy(() => import('./pages/EditorPage').then((m) => ({ default: m.EditorPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const PlansPage = lazy(() => import('./pages/PlansPage').then((m) => ({ default: m.PlansPage })))
const ShareViewPage = lazy(() => import('./pages/ShareViewPage').then((m) => ({ default: m.ShareViewPage })))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })))
const TrashPage = lazy(() => import('./pages/TrashPage').then((m) => ({ default: m.TrashPage })))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-forma-muted text-sm">
      Chargement…
    </div>
  )
}

export default function App() {
  const applyTheme = useSettingsStore((s) => s.applyTheme)

  useEffect(() => {
    applyTheme()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = () => applyTheme()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [applyTheme])

  return (
    <AppErrorBoundary>
    <BrowserRouter>
      <div className="h-full min-h-screen flex flex-col bg-forma-bg text-forma-text">
        <OfflineBanner />
        <MultiTabBanner />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/document/:id" element={<EditorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/share/:token" element={<ShareViewPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <CommandPalette />
        <ConfirmDialog />
        <Onboarding />
        <PwaInstallBanner />
        <Toast />
      </div>
    </BrowserRouter>
    </AppErrorBoundary>
  )
}
