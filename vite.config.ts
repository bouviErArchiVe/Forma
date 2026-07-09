import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Proxy dev/preview `/remote-pack/part10/*` → release GitHub `pack-part10-v1`.
 *
 * Miroir LOCAL du rewrite Vercel (voir vercel.json) : le serveur suit les
 * redirections 302 côté serveur (`followRedirects`), donc le navigateur reste
 * en same-origin — exactement le comportement attendu du rewrite en prod.
 * N'affecte QUE le serveur de dev/preview, jamais le bundle applicatif.
 */
const remotePackProxy = {
  '/remote-pack/part10': {
    target: 'https://github.com',
    changeOrigin: true,
    followRedirects: true,
    rewrite: (path: string) =>
      path.replace(/^\/remote-pack\/part10/, '/bouviErArchiVe/Forma/releases/download/pack-part10-v1'),
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
  server: {
    proxy: remotePackProxy,
  },
  preview: {
    proxy: remotePackProxy,
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
