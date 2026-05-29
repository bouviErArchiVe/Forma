import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('tesseract')) return 'ocr'
          if (id.includes('jszip')) return 'zip'
          if (id.includes('pdfjs') || id.includes('pdf-lib')) return 'pdf'
        },
      },
    },
  },
})
