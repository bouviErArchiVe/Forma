/**
 * Tests bibliothèque de templates architecture (A8 V1) : catalogue, recherche,
 * et création de document via le pipeline FormaDoc existant.
 */
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../db'
import {
  TEMPLATES,
  TEMPLATE_CATEGORY_LABELS,
  createDocumentFromTemplate,
  getTemplate,
  searchTemplates,
  templateCategories,
} from './templates'

beforeEach(async () => {
  await db.open()
  await db.notebooks.clear()
  await db.pages.clear()
})

describe('catalogue de templates', () => {
  it('contient au moins 15 templates V1', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(15)
  })

  it('ids uniques et champs complets', () => {
    const ids = TEMPLATES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const t of TEMPLATES) {
      expect(t.name).toBeTruthy()
      expect(t.description.length).toBeGreaterThan(5)
      expect(TEMPLATE_CATEGORY_LABELS[t.category]).toBeTruthy()
      expect(t.tags.length).toBeGreaterThan(0)
      expect(t.contentHtml).toContain('<h1>')
    }
  })

  it('couvre plusieurs catégories', () => {
    expect(templateCategories().length).toBeGreaterThanOrEqual(4)
  })

  it('les fiches « code » affichent l’avertissement officiel', () => {
    for (const id of ['t-fiche-conformite', 't-fiche-escalier', 't-fiche-garde-corps']) {
      expect(getTemplate(id)?.contentHtml).toContain('À vérifier dans le texte officiel')
    }
  })
})

describe('searchTemplates', () => {
  it('trouve par nom/tag (accents-insensible)', () => {
    expect(searchTemplates('chantier').some((t) => t.category === 'chantier')).toBe(true)
    expect(searchTemplates('ESCALIER').some((t) => t.id === 't-fiche-escalier')).toBe(true)
    expect(searchTemplates('').length).toBe(TEMPLATES.length)
    expect(searchTemplates('zzzqqq')).toEqual([])
  })
})

describe('createDocumentFromTemplate', () => {
  it('crée un FormaDoc avec le contenu du template', async () => {
    const tpl = getTemplate('t-carnet-chantier')!
    const id = await createDocumentFromTemplate(tpl)
    const nb = await db.notebooks.get(id)
    expect(nb?.type).toBe('formadoc')
    const page = await db.pages.where('notebookId').equals(id).first()
    expect(page?.content).toBe(tpl.contentHtml)
  })
})
