/** FormaPresent — export PDF / PNG / HTML */

import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { SLIDE_SIZE } from './constants'
import { slideToDataUrl, pxToMm, downloadBlob, safeFilename } from './render'

async function renderAllSlides(deck) {
  const out = []
  for (let i = 0; i < deck.slides.length; i += 1) {
    const slide = deck.slides[i]
    const png = await slideToDataUrl(slide, { format: 'png', scale: 1 })
    const jpg = await slideToDataUrl(slide, { format: 'jpeg', quality: 0.92, scale: 1 })
    out.push({ slide, png, jpg, index: i })
  }
  return out
}

export async function exportDeckPdf(deck) {
  const rendered = await renderAllSlides(deck)
  if (!rendered.length) throw new Error('Aucune slide à exporter')

  const wMm = pxToMm(SLIDE_SIZE.width)
  const hMm = pxToMm(SLIDE_SIZE.height)
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [wMm, hMm] })

  rendered.forEach(({ png }, i) => {
    if (i > 0) pdf.addPage([wMm, hMm], 'landscape')
    pdf.addImage(png, 'PNG', 0, 0, wMm, hMm)
  })

  if (deck.title) pdf.setProperties({ title: deck.title })
  return pdf.output('blob')
}

export async function exportDeckZip(deck, { format = 'png' } = {}) {
  const rendered = await renderAllSlides(deck)
  const zip = new JSZip()
  const folderName = (deck.title || 'formapresent').replace(/[^\w\- ]+/g, '_')
  const folder = zip.folder(folderName) || zip

  rendered.forEach(({ png, jpg, index, slide }) => {
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    const data = (format === 'jpeg' ? jpg : png).split(',')[1]
    const fname = `${String(index + 1).padStart(2, '0')}_${(slide.name || 'slide').replace(/[^\w\- ]+/g, '_')}.${ext}`
    folder.file(fname, data, { base64: true })
  })

  zip.file('manifest.json', JSON.stringify({
    title: deck.title,
    template: deck.template,
    exportedAt: Date.now(),
    slideCount: rendered.length,
  }, null, 2))

  return zip.generateAsync({ type: 'blob' })
}

/** Export HTML autonome — importable dans PowerPoint via images ou lecture navigateur */
export async function exportDeckHtml(deck) {
  const rendered = await renderAllSlides(deck)
  const slidesHtml = rendered.map(({ png, slide, index }, i) => `
    <section class="slide" data-transition="${slide.transition || 'fade'}" ${i === 0 ? 'data-active="true"' : ''}>
      <img src="${png}" alt="${slide.name || `Slide ${index + 1}`}" />
      ${slide.notes ? `<aside class="notes">${slide.notes.replace(/</g, '&lt;')}</aside>` : ''}
    </section>`).join('\n')

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>${deck.title || 'Présentation'}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#000;font-family:Inter,sans-serif;overflow:hidden}
  .slide{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .5s,transform .5s;pointer-events:none}
  .slide[data-active="true"]{opacity:1;pointer-events:auto}
  .slide[data-transition="slide"]:not([data-active="true"]){transform:translateX(40px)}
  .slide[data-transition="zoom"]:not([data-active="true"]){transform:scale(.92)}
  .slide img{max-width:100vw;max-height:100vh;object-fit:contain}
  .notes{display:none}
  .nav{position:fixed;bottom:16px;right:16px;color:#fff;font-size:14px;opacity:.6}
</style></head><body>
${slidesHtml}
<div class="nav">← → pour naviguer · Échap pour quitter</div>
<script>
  let i=0; const slides=[...document.querySelectorAll('.slide')];
  function show(n){ slides.forEach((s,j)=>s.dataset.active=j===n); i=n; }
  document.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'||e.key===' ') show(Math.min(slides.length-1,i+1));
    if(e.key==='ArrowLeft') show(Math.max(0,i-1));
  });
</script></body></html>`

  return new Blob([html], { type: 'text/html;charset=utf-8' })
}

export async function downloadDeckPdf(deck) {
  downloadBlob(await exportDeckPdf(deck), safeFilename(deck.title, 'pdf'))
}

export async function downloadDeckZip(deck, format = 'png') {
  downloadBlob(await exportDeckZip(deck, { format }), safeFilename(`${deck.title}_slides`, 'zip'))
}

export async function downloadDeckHtml(deck) {
  downloadBlob(await exportDeckHtml(deck), safeFilename(deck.title, 'html'))
}

export async function downloadAllSlidesIndividually(deck, format = 'png') {
  const rendered = await renderAllSlides(deck)
  for (const { png, jpg, index, slide } of rendered) {
    const url = format === 'jpeg' ? jpg : png
    const ext = format === 'jpeg' ? 'jpg' : 'png'
    const a = document.createElement('a')
    a.href = url
    a.download = `${String(index + 1).padStart(2, '0')}_${(slide.name || 'slide').replace(/[^\w\- ]+/g, '_')}.${ext}`
    a.click()
    await new Promise((r) => setTimeout(r, 120))
  }
}
