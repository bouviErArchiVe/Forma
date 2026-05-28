import useAppStore from '@/stores/useAppStore'
import LibraryPage from '@/pages/LibraryPage'
import EditorPage from '@/pages/EditorPage'
import MoodboardPage from '@/pages/MoodboardPage'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function AppLayout() {
  const activeView = useAppStore((s) => s.activeView)
  const setActiveView = useAppStore((s) => s.setActiveView)
  const getTheme = useAppStore((s) => s.getTheme)
  const T = getTheme()

  const viewWrap = (view, child) => (
    <div style={{
      position: 'absolute',
      inset: 0,
      visibility: activeView === view ? 'visible' : 'hidden',
      opacity: activeView === view ? 1 : 0,
      transition: 'opacity 200ms ease',
      zIndex: activeView === view ? 1 : 0,
      pointerEvents: activeView === view ? 'all' : 'none',
    }}>
      {child}
    </div>
  )

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      background: T.bg,
    }}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', minHeight: 0, minWidth: 0 }}>
        {viewWrap('library', (
          <ErrorBoundary title="Erreur bibliothèque">
            <LibraryPage
              onOpenEditor={() => setActiveView('editor')}
              onOpenMoodboard={() => setActiveView('moodboard')}
            />
          </ErrorBoundary>
        ))}
        {viewWrap('editor', (
          <ErrorBoundary title="Erreur éditeur">
            <EditorPage onBack={() => setActiveView('library')} />
          </ErrorBoundary>
        ))}
        {viewWrap('moodboard', (
          <ErrorBoundary title="Erreur Moodboard">
            <MoodboardPage onBack={() => setActiveView('library')} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  )
}
