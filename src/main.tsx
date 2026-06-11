import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useSettingsStore } from './stores/settingsStore'

import { setupMemoryPressureListener } from './lib/memory-pressure'
import { runAutoBackupIfDue } from './services/sync'
import { useToastStore } from './stores/toastStore'

setupMemoryPressureListener()

void import('./lib/assets').then(
  ({ migrateAllPdfNotebookSources, migrateInlinePagesBatch, garbageCollectOrphanAssets }) => {
  const runPdf = () => void migrateAllPdfNotebookSources().catch(() => {})
  const runPages = () => {
    void migrateInlinePagesBatch(12)
      .then((n) => {
        if (n > 0) requestIdleCallback?.(runPages, { timeout: 5000 })
      })
      .catch(() => {})
  }
  const runGc = () => void garbageCollectOrphanAssets().catch(() => {})
  const kick = () => {
    runPdf()
    runPages()
    runGc()
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(kick, { timeout: 8000 })
  } else {
    setTimeout(kick, 2000)
  }
},
)

const s = useSettingsStore.getState()
s.applyTheme()
s.applyPaperTone()
runAutoBackupIfDue()
  .then((ok) => {
    if (ok) useToastStore.getState().show('Sauvegarde auto enregistrée (slot cloud)')
  })
  .catch(() => {})

void import('./lib/pwa').then(({ registerPwa }) => registerPwa())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
