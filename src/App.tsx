import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppBackground } from './components/layout/AppBackground'
import { CommandPalette } from './components/CommandPalette'
import { ConfirmDialog } from './components/ConfirmDialog'
import { MultiTabBanner, OfflineBanner } from './components/OfflineBanner'
import { Onboarding } from './components/Onboarding'
import { PwaInstallBanner } from './components/PwaInstallBanner'
import { Toast } from './components/Toast'
import { useSettingsStore } from './stores/settingsStore'

const LibraryPage = lazy(() => import('./pages/LibraryPage').then((m) => ({ default: m.LibraryPage })))
const EditorPage = lazy(() => import('./pages/EditorPage').then((m) => ({ default: m.EditorPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const PlansPage = lazy(() => import('./pages/PlansPage').then((m) => ({ default: m.PlansPage })))
const ShareViewPage = lazy(() => import('./pages/ShareViewPage').then((m) => ({ default: m.ShareViewPage })))
const TemplatesPage = lazy(() => import('./pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })))
const TrashPage = lazy(() => import('./pages/TrashPage').then((m) => ({ default: m.TrashPage })))
const FormulasPage = lazy(() => import('./pages/FormulasPage').then((m) => ({ default: m.FormulasPage })))
const MoodboardPage = lazy(() => import('./pages/MoodboardPage').then((m) => ({ default: m.MoodboardPage })))
const FormaDocPage = lazy(() => import('./pages/FormaDocPage').then((m) => ({ default: m.FormaDocPage })))
const FormaTabPage = lazy(() => import('./pages/FormaTabPage').then((m) => ({ default: m.FormaTabPage })))
const FormaPresentPage = lazy(() =>
  import('./pages/FormaPresentPage').then((m) => ({ default: m.FormaPresentPage })),
)
const FormatcalPage = lazy(() =>
  import('./pages/FormatcalPage').then((m) => ({ default: m.FormatcalPage })),
)
const FormaReviewPage = lazy(() =>
  import('./pages/FormaReviewPage').then((m) => ({ default: m.FormaReviewPage })),
)
const FormaCombinePage = lazy(() =>
  import('./pages/FormaCombinePage').then((m) => ({ default: m.FormaCombinePage })),
)
const FormaAIPage = lazy(() => import('./pages/FormaAIPage').then((m) => ({ default: m.FormaAIPage })))
const FPausePage = lazy(() => import('./pages/FPausePage').then((m) => ({ default: m.FPausePage })))

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
    <BrowserRouter>
      <AppBackground />
      <div className="relative h-full min-h-screen flex flex-col">
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
            <Route path="/formulas" element={<FormulasPage />} />
            <Route path="/moodboard" element={<MoodboardPage />} />
            <Route path="/formadoc" element={<FormaDocPage />} />
            <Route path="/formatab" element={<FormaTabPage />} />
            <Route path="/formapresent" element={<FormaPresentPage />} />
            <Route path="/formatcal" element={<FormatcalPage />} />
            <Route path="/formareview" element={<FormaReviewPage />} />
            <Route path="/formacombine" element={<FormaCombinePage />} />
            <Route path="/formaai" element={<FormaAIPage />} />
            <Route path="/fpause" element={<FPausePage />} />
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
  )
}
