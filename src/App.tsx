import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CommandPalette } from './components/CommandPalette'
import { ConfirmDialog } from './components/ConfirmDialog'
import { MultiTabBanner, OfflineBanner } from './components/OfflineBanner'
import { Onboarding } from './components/Onboarding'
import { PwaInstallBanner } from './components/PwaInstallBanner'
import { StorageStatusBanner } from './components/StorageStatusBanner'
import { Toast } from './components/Toast'
import { seedExampleNotebookIfEmpty } from './lib/onboarding-seed'
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
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const FormAIPage = lazy(() => import('./modules/formai/FormAIPage').then((m) => ({ default: m.FormAIPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const TasksPage = lazy(() => import('./pages/TasksPage').then((m) => ({ default: m.TasksPage })))
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })))
const ProjectWorkspacePage = lazy(() => import('./pages/ProjectWorkspacePage').then((m) => ({ default: m.ProjectWorkspacePage })))
const SubjectWorkspacePage = lazy(() => import('./pages/SubjectWorkspacePage').then((m) => ({ default: m.SubjectWorkspacePage })))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage').then((m) => ({ default: m.ResourcesPage })))
const ImportHubPage = lazy(() => import('./pages/ImportHubPage').then((m) => ({ default: m.ImportHubPage })))
const ComplianceCheckerPage = lazy(() => import('./pages/ComplianceCheckerPage').then((m) => ({ default: m.ComplianceCheckerPage })))
const StudyStatsPage = lazy(() => import('./pages/StudyStatsPage').then((m) => ({ default: m.StudyStatsPage })))
const StudyHubPage = lazy(() => import('./pages/StudyHubPage').then((m) => ({ default: m.StudyHubPage })))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-forma-muted text-sm">
      Chargement…
    </div>
  )
}

export default function App() {
  const applyTheme = useSettingsStore((s) => s.applyTheme)
  const onboardingDone = useSettingsStore((s) => s.onboardingDone)
  const setExampleNotebookId = useSettingsStore((s) => s.setExampleNotebookId)

  useEffect(() => {
    applyTheme()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const fn = () => applyTheme()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [applyTheme])

  // Crée un carnet d'exemple au tout premier lancement (bibliothèque vide + onboarding non vu).
  // Pas de drapeau "cancelled" : `setExampleNotebookId` est une action zustand (sûre après
  // démontage), et en StrictMode c'est la première invocation — nettoyée — qui crée le carnet.
  useEffect(() => {
    if (onboardingDone) return
    void (async () => {
      try {
        const id = await seedExampleNotebookIfEmpty()
        if (id) setExampleNotebookId(id)
      } catch (err) {
        console.error('[Forma] Échec de la création du carnet d’exemple:', err)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppErrorBoundary>
    <BrowserRouter>
      <div className="h-full min-h-screen flex flex-col bg-forma-bg text-forma-text">
        <OfflineBanner />
        <MultiTabBanner />
        <StorageStatusBanner />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/document/:id" element={<EditorPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/share/:token" element={<ShareViewPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/trash" element={<TrashPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/formai" element={<FormAIPage />} />
            <Route path="/formai/:conversationId" element={<FormAIPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectWorkspacePage />} />
            <Route path="/subjects/:id" element={<SubjectWorkspacePage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/import" element={<ImportHubPage />} />
            <Route path="/compliance" element={<ComplianceCheckerPage />} />
            <Route path="/study" element={<StudyHubPage />} />
            <Route path="/study/stats" element={<StudyStatsPage />} />
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
