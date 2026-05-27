/** FormaAI — index de recherche unifié */

import { loadLocalNotebooks, loadLocalPages } from '@/lib/projectPersistence'
import { listDocs } from '@/lib/docs/persistence'
import { listSheets } from '@/lib/spreadsheet/persistence'
import { listProformaDocs } from '@/lib/proforma/persistence'
import { listProjects as listCombine } from '@/lib/formacombine/persistence'
import { listDecks } from '@/lib/formapresent/persistence'
import { listSessions as listReview } from '@/lib/formareview/persistence'
import { loadLocalFoldersForScope } from '@/lib/folderPersistence'
import { listAssets } from '@/lib/formafolder/assets'
import { FORMULAS } from '@/data/formulas'
import { safeGetLocalStorage, safeJsonParse } from '@/lib/storage'

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractSheetText(sheet) {
  const cells = sheet.cells || {}
  return Object.values(cells)
    .map((c) => c?.value ?? c?.raw ?? '')
    .filter(Boolean)
    .join(' ')
}

function extractProformaText(doc) {
  return (doc.texts || doc.layers?.flatMap((l) => l.texts || []) || [])
    .map((t) => t.content || t.text || '')
    .join(' ')
}

function extractPresentText(deck) {
  return (deck.slides || []).flatMap((s) =>
    (s.elements || []).filter((el) => el.type === 'text').map((el) => el.content || '')
  ).join(' ')
}

function extractPageElementsText(elements) {
  try {
    const els = typeof elements === 'string' ? JSON.parse(elements) : elements
    if (!Array.isArray(els)) return ''
    return els.map((e) => [e.l, e.label, e.text, e.name].filter(Boolean).join(' ')).join(' ')
  } catch {
    return ''
  }
}

let cachedIndex = null
let cacheTime = 0
const CACHE_TTL = 8000

export function buildSearchIndex({ force = false } = {}) {
  if (!force && cachedIndex && Date.now() - cacheTime < CACHE_TTL) return cachedIndex

  const items = []

  // Carnets / notes
  for (const nb of loadLocalNotebooks()) {
    items.push({
      id: `nb:${nb.id}`,
      source: 'library',
      type: 'notebook',
      title: nb.title || 'Carnet',
      text: [nb.title, nb.subject, nb.description].filter(Boolean).join(' '),
      route: `/editor/${nb.id}`,
      updatedAt: nb.updated_at,
    })
    for (const pg of loadLocalPages(nb.id)) {
      items.push({
        id: `pg:${nb.id}:${pg.id}`,
        source: 'notebook',
        type: 'notebook',
        title: `${nb.title || 'Carnet'} — p.${pg.page_number || '?'}`,
        text: [
          extractPageElementsText(pg.elements),
          pg.canvas_data ? '(dessin)' : '',
        ].join(' '),
        route: `/editor/${nb.id}`,
        meta: { page: pg.page_number },
        updatedAt: pg.updated_at,
      })
    }
  }

  // FormaDoc
  for (const doc of listDocs()) {
    const pageText = (doc.pages || []).map((p) => stripHtml(p.html)).join(' ')
    items.push({
      id: `doc:${doc.id}`,
      source: 'doc',
      type: 'doc',
      title: doc.name || 'FormaDoc',
      text: pageText,
      route: '/formadoc',
      updatedAt: doc.updatedAt,
    })
  }

  // FormaTab
  for (const sheet of listSheets()) {
    items.push({
      id: `sheet:${sheet.id}`,
      source: 'sheet',
      type: 'sheet',
      title: sheet.name || 'FormaTab',
      text: extractSheetText(sheet),
      route: '/formatab',
      updatedAt: sheet.updatedAt,
    })
  }

  // Proforma
  for (const doc of listProformaDocs()) {
    items.push({
      id: `proforma:${doc.id}`,
      source: 'proforma',
      type: 'proforma',
      title: doc.name || 'Proforma',
      text: extractProformaText(doc),
      route: '/proforma',
      updatedAt: doc.updatedAt,
    })
  }

  // FormaCombine
  for (const proj of listCombine()) {
    const pageText = (proj.pages || []).map((p) => [p.name, p.text, p.sourceType].filter(Boolean).join(' ')).join(' ')
    items.push({
      id: `combine:${proj.id}`,
      source: 'combine',
      type: 'combine',
      title: proj.name || 'FormaCombine',
      text: pageText,
      route: '/formacombine',
      updatedAt: proj.updatedAt,
    })
  }

  // FormaPresent
  for (const deck of listDecks()) {
    items.push({
      id: `present:${deck.id}`,
      source: 'present',
      type: 'present',
      title: deck.title || 'FormaPresent',
      text: extractPresentText(deck),
      route: '/formapresent',
      updatedAt: deck.updatedAt,
    })
  }

  // FormaReview
  for (const sess of listReview()) {
    const commentText = (sess.comments || []).map((c) => c.content).join(' ')
    items.push({
      id: `review:${sess.id}`,
      source: 'notebook',
      type: 'review',
      title: sess.title || 'FormaReview',
      text: commentText,
      route: '/formareview',
      updatedAt: sess.updatedAt,
    })
  }

  // Dossiers
  for (const f of loadLocalFoldersForScope(null)) {
    items.push({
      id: `folder:${f.id}`,
      source: 'folder',
      type: 'folder',
      title: f.name || 'Dossier',
      text: [f.name, f.description, ...(f.tags || [])].join(' '),
      route: '/formafolder',
      updatedAt: f.updatedAt,
    })
  }

  // Assets FormaFolder
  for (const a of listAssets(null)) {
    items.push({
      id: `asset:${a.id}`,
      source: 'asset',
      type: 'asset',
      title: a.name || 'Fichier',
      text: [a.name, a.textContent, ...(a.tags || []), a.type].filter(Boolean).join(' '),
      route: '/formafolder',
      updatedAt: a.updatedAt,
    })
  }

  // Formules / normes
  for (const f of FORMULAS) {
    items.push({
      id: `formula:${f.id}`,
      source: 'formula',
      type: 'formula',
      title: f.title,
      text: [f.title, f.description, f.formulaText, ...(f.tags || [])].join(' '),
      route: '/formules',
      meta: { formulaId: f.id },
      updatedAt: 0,
    })
  }

  // Pages canvas cache (texte OCR / imports)
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i)
      if (!k?.startsWith('forma_page_')) continue
      const data = safeJsonParse(safeGetLocalStorage(k), null)
      if (data?.elements) {
        items.push({
          id: `cache:${k}`,
          source: 'notebook',
          type: 'notebook',
          title: `Page cache ${k.replace('forma_page_', '').slice(0, 8)}`,
          text: extractPageElementsText(data.elements),
          route: '/',
          updatedAt: data.savedAt,
        })
      }
    }
  } catch { /* ignore */ }

  cachedIndex = items
  cacheTime = Date.now()
  return items
}

export function invalidateSearchIndex() {
  cachedIndex = null
  cacheTime = 0
}
