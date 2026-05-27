import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrapFormaTheme } from '@/theme/bootstrapTheme'
import ThemeProvider from '@/theme/ThemeProvider'
import ErrorBoundary from '@/components/ErrorBoundary'
import { BRAND } from '@/config/branding'
import App from './App.jsx'
import { showFatalBootScreen } from '@/lib/bootError'

function renderApp() {
  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('Élément #root introuvable')

  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary title={`${BRAND.appName} n'a pas pu démarrer`}>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  )
}

try {
  bootstrapFormaTheme()
  renderApp()
} catch (error) {
  console.error(`[${BRAND.appName} boot]`, error)
  showFatalBootScreen(error)
}
