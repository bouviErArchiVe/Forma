import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Forma',
        short_name: 'Forma',
        description: 'Le carnet de conception pour architectes & designers',
        theme_color: '#d4714a',
        background_color: '#faf4ee',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', networkTimeoutSeconds: 10 }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: { '@': '/src' }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/pdfjs-dist') || id.includes('pdf.worker')) return 'pdf'
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) return 'pdf-export'
          if (id.includes('node_modules/@supabase')) return 'supabase'
          if (id.includes('node_modules/tesseract.js')) return 'ocr'
          if (id.includes('node_modules/docx') || id.includes('node_modules/jszip')) return 'office'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react-vendor'
          if (id.includes('node_modules/react-router')) return 'router'
          if (id.includes('node_modules/lucide-react')) return 'icons'
        },
      },
    },
  },
})
