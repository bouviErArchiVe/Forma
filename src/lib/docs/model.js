/** Modèle document Forma Docs — pages HTML, templates, TOC. */

export const DOC_TEMPLATES = {
  blank: {
    label: 'Document vierge',
    pages: [{ html: '<h1>Nouveau document</h1><p>Commencez à écrire…</p>' }],
  },
  notes: {
    label: 'Prise de notes',
    pages: [{ html: '<h1>Titre du cours</h1><p><strong>Date :</strong> </p><h2>Points clés</h2><ul><li>Point 1</li><li>Point 2</li></ul><h2>Notes</h2><p></p>' }],
  },
  course: {
    label: 'Cours',
    pages: [{ html: '<h1>Matière — Cours n°</h1><h2>Introduction</h2><p></p><h2>Développement</h2><p></p><h2>Conclusion</h2><p></p>' }],
  },
  technical: {
    label: 'Fiche technique',
    pages: [{ html: '<h1>Fiche technique</h1><h2>Projet</h2><p></p><h2>Matériaux</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>Élément</th><th>Spécification</th><th>Quantité</th></tr><tr><td></td><td></td><td></td></tr></table><h2>Observations</h2><p></p>' }],
  },
  report: {
    label: 'Rapport',
    pages: [{ html: '<h1>Rapport</h1><p style="text-align:center;color:#666">Sous-titre</p><hr/><h2>1. Contexte</h2><p></p><h2>2. Analyse</h2><p></p><h2>3. Conclusion</h2><p></p>' }],
  },
  quote: {
    label: 'Devis',
    pages: [{ html: '<h1>Devis</h1><p><strong>Client :</strong> </p><p><strong>Date :</strong> </p><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>Désignation</th><th>Qté</th><th>P.U.</th><th>Total</th></tr><tr><td></td><td></td><td></td><td></td></tr></table><p><strong>Total HT :</strong> </p>' }],
  },
  archTable: {
    label: 'Tableau architectural',
    pages: [{ html: '<h1>Tableau architectural</h1><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;text-align:center"><tr style="background:#e8eef4"><th>Niveau</th><th>Surface (m²)</th><th>Usage</th><th>Notes</th></tr><tr><td>RDC</td><td></td><td></td><td></td></tr><tr><td>R+1</td><td></td><td></td><td></td></tr></table>' }],
  },
}

const PAGE_W = 794
const PAGE_H = 1123

export function createPage(html = '<p></p>') {
  return { id: `pg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, html }
}

export function createDoc(name = 'Nouveau document', templateId = 'blank') {
  const tpl = DOC_TEMPLATES[templateId] || DOC_TEMPLATES.blank
  const now = Date.now()
  return {
    id: `doc_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    templateId,
    createdAt: now,
    updatedAt: now,
    locked: false,
    viewMode: 'pages',
    zoom: 1,
    pageNumbers: true,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
    lineHeight: 1.6,
    paragraphSpacing: 12,
    pages: tpl.pages.map((p) => createPage(p.html)),
    settings: { marginMm: 20 },
  }
}

export function cloneDoc(doc, { name } = {}) {
  const now = Date.now()
  return {
    ...JSON.parse(JSON.stringify(doc)),
    id: `doc_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || `${doc.name} (copie)`,
    createdAt: now,
    updatedAt: now,
    pages: doc.pages.map((p) => ({ ...p, id: createPage().id })),
  }
}

export function addPage(doc, at = doc.pages.length, html = '<p></p>') {
  const pages = [...doc.pages]
  pages.splice(at, 0, createPage(html))
  return { ...doc, pages, updatedAt: Date.now() }
}

export function deletePage(doc, index) {
  if (doc.pages.length <= 1) return doc
  const pages = doc.pages.filter((_, i) => i !== index)
  return { ...doc, pages, updatedAt: Date.now() }
}

export function duplicatePage(doc, index) {
  const src = doc.pages[index]
  if (!src) return doc
  const pages = [...doc.pages]
  pages.splice(index + 1, 0, { ...createPage(src.html), html: src.html })
  return { ...doc, pages, updatedAt: Date.now() }
}

export function updatePageHtml(doc, pageIndex, html) {
  const pages = doc.pages.map((p, i) => (i === pageIndex ? { ...p, html } : p))
  return { ...doc, pages, updatedAt: Date.now() }
}

export function extractToc(pages) {
  const items = []
  pages.forEach((page, pi) => {
    const div = typeof document !== 'undefined' ? document.createElement('div') : null
    if (!div) return
    div.innerHTML = page.html || ''
    div.querySelectorAll('h1,h2,h3').forEach((el, i) => {
      const level = parseInt(el.tagName[1], 10)
      const text = el.textContent?.trim() || `Section ${i + 1}`
      const id = `toc-${pi}-${i}`
      el.id = id
      items.push({ id, text, level, pageIndex: pi })
    })
  })
  return items
}

export function buildTocHtml(pages) {
  const items = []
  pages.forEach((page, pi) => {
    const re = /<h([123])[^>]*>(.*?)<\/h\1>/gi
    let m
    let i = 0
    const html = page.html || ''
    while ((m = re.exec(html)) !== null) {
      const text = m[2].replace(/<[^>]+>/g, '').trim()
      if (text) items.push({ level: parseInt(m[1], 10), text, pageIndex: pi, idx: i++ })
    }
  })
  if (!items.length) return '<p style="color:#888">Aucun titre (H1/H2/H3) trouvé.</p>'
  return `<ul style="list-style:none;padding:0;margin:0">${items.map((it) =>
    `<li style="margin-left:${(it.level - 1) * 16}px;padding:4px 0"><a href="#" data-page="${it.pageIndex}">${textEsc(it.text)}</a></li>`
  ).join('')}</ul>`
}

function textEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function findInDoc(pages, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return []
  const hits = []
  pages.forEach((page, pi) => {
    const plain = (page.html || '').replace(/<[^>]+>/g, ' ').toLowerCase()
    if (plain.includes(q)) hits.push({ pageIndex: pi, snippet: plain.slice(Math.max(0, plain.indexOf(q) - 20), plain.indexOf(q) + q.length + 20) })
  })
  return hits
}

export function replaceInDoc(pages, find, replace) {
  if (!find) return pages
  const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  return pages.map((p) => ({
    ...p,
    html: (p.html || '').replace(re, replace),
  }))
}

export function insertSheetEmbedHtml(sheetId, sheetName) {
  return `<div contenteditable="false" data-embed="sheet" data-sheet-id="${sheetId}" style="border:1px solid #ccd3dc;border-radius:8px;padding:8px;margin:12px 0;background:#fafbfc"><strong>📊 ${textEsc(sheetName || 'Tableau')}</strong><div data-sheet-render="${sheetId}"></div></div><p></p>`
}

export { PAGE_W, PAGE_H }
