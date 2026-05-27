import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { bootstrapFormaTheme } from '@/theme/bootstrapTheme'
import ThemeProvider from '@/theme/ThemeProvider'
import App from './App.jsx'

bootstrapFormaTheme()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
