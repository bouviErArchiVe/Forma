import { createId } from '../id'
import type { FormaDocTemplateId, FormaDocument, FormaDocumentPage } from '../../types'

export const PAGE_W = 794
export const PAGE_H = 1123

export const DOC_TEMPLATES: Record<
  FormaDocTemplateId,
  { label: string; pages: { html: string }[] }
> = {
  blank: {
    label: 'Document vierge',
    pages: [{ html: '<h1>Nouveau document</h1><p>Commencez à écrire…</p>' }],
  },
  notes: {
    label: 'Prise de notes',
    pages: [
      {
        html:
          '<h1>Titre du cours</h1><p><strong>Date :</strong> </p><h2>Points clés</h2><ul><li>Point 1</li><li>Point 2</li></ul><h2>Notes</h2><p></p>',
      },
    ],
  },
  course: {
    label: 'Cours',
    pages: [
      {
        html:
          '<h1>Matière — Cours n°</h1><h2>Introduction</h2><p></p><h2>Développement</h2><p></p><h2>Conclusion</h2><p></p>',
      },
    ],
  },
  technical: {
    label: 'Fiche technique',
    pages: [
      {
        html:
          '<h1>Fiche technique</h1><h2>Projet</h2><p></p><h2>Matériaux</h2><table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><th>Élément</th><th>Spécification</th><th>Quantité</th></tr><tr><td></td><td></td><td></td></tr></table><h2>Observations</h2><p></p>',
      },
    ],
  },
}

export const DOC_TEMPLATE_IDS = Object.keys(DOC_TEMPLATES) as FormaDocTemplateId[]

export function createPage(html = '<p></p>'): FormaDocumentPage {
  return { id: createId(), html }
}

export function createDocument(
  name = 'Nouveau document',
  templateId: FormaDocTemplateId = 'blank',
): FormaDocument {
  const tpl = DOC_TEMPLATES[templateId] ?? DOC_TEMPLATES.blank
  const now = Date.now()
  return {
    id: createId(),
    name,
    templateId,
    createdAt: now,
    updatedAt: now,
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 14,
    lineHeight: 1.6,
    pages: tpl.pages.map((p) => createPage(p.html)),
  }
}

export function cloneDocument(doc: FormaDocument, name?: string): FormaDocument {
  const now = Date.now()
  return {
    ...structuredClone(doc),
    id: createId(),
    name: name ?? `${doc.name} (copie)`,
    createdAt: now,
    updatedAt: now,
    pages: doc.pages.map((p) => ({ ...p, id: createId() })),
  }
}

export function addDocumentPage(
  doc: FormaDocument,
  at = doc.pages.length,
  html = '<p></p>',
): FormaDocument {
  const pages = [...doc.pages]
  pages.splice(at, 0, createPage(html))
  return { ...doc, pages, updatedAt: Date.now() }
}

export function deleteDocumentPage(doc: FormaDocument, index: number): FormaDocument {
  if (doc.pages.length <= 1) return doc
  return { ...doc, pages: doc.pages.filter((_, i) => i !== index), updatedAt: Date.now() }
}

export function duplicateDocumentPage(doc: FormaDocument, index: number): FormaDocument {
  const src = doc.pages[index]
  if (!src) return doc
  const pages = [...doc.pages]
  pages.splice(index + 1, 0, createPage(src.html))
  return { ...doc, pages, updatedAt: Date.now() }
}

export function updateDocumentPageHtml(
  doc: FormaDocument,
  pageIndex: number,
  html: string,
): FormaDocument {
  const pages = doc.pages.map((p, i) => (i === pageIndex ? { ...p, html } : p))
  return { ...doc, pages, updatedAt: Date.now() }
}

export function findInDocument(doc: FormaDocument, query: string): number[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return doc.pages
    .map((p, i) => {
      const plain = (p.html || '').replace(/<[^>]+>/g, ' ').toLowerCase()
      return plain.includes(q) ? i : -1
    })
    .filter((i) => i >= 0)
}
