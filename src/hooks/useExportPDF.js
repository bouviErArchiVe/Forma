// src/hooks/useExportPDF.js
import { useCallback } from 'react'
import useAppStore from '@/stores/useAppStore'
import { BRAND } from '@/config/branding'

export function useExportPDF() {
  const { activeNotebook, activePage, scale, getTheme } = useAppStore()

  const exportPDF = useCallback(async (canvasRef, title) => {
    try {
      const { default: jsPDF } = await import('jspdf')
      const { default: html2canvas } = await import('html2canvas')

      const pageEl =
        (canvasRef?.current && canvasRef.current.closest?.('[data-forma-page]')) ||
        document.querySelector?.('[data-forma-page]') ||
        document.getElementById('forma-page')
      if (!pageEl) throw new Error('Page introuvable pour l\'export PDF')

      const notification = document.createElement('div')
      notification.textContent = '⏳ Génération du PDF…'
      notification.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#1c1c24;color:#fff;padding:12px 24px;borderRadius:8px;zIndex:9999;fontSize:14px'
      document.body.appendChild(notification)

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#fafaf7',
        width: 794,
        height: 1123,
        logging: false,
      })

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297)

      // Add metadata
      pdf.setProperties({
        title: title || activeNotebook?.title || `${BRAND.name} Export`,
        author: BRAND.name,
        subject: `Architecture notebook — ${scale}`,
        creator: BRAND.name
      })

      const filename = `${(title || activeNotebook?.title || BRAND.shortName).replace(/[^a-z0-9]/gi, '_').toLowerCase()}_p${activePage}.pdf`
      pdf.save(filename)

      document.body.removeChild(notification)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Erreur lors de la génération du PDF. Réessaie.')
    }
  }, [activeNotebook, activePage, scale])

  return { exportPDF }
}
