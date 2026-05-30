import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { docToPlainText } from '../lib/docs/htmlUtils'
import {
  cloneDocument,
  createDocument as buildDocument,
  createPage,
  DOC_TEMPLATES,
} from '../lib/docs/model'
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  getDocument,
  listDocuments,
  saveDocument,
  searchDocuments,
} from './formadoc'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('formadoc service', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('creates document from template', async () => {
    const doc = await createDocument('Mon rapport', 'technical')
    expect(doc.name).toBe('Mon rapport')
    expect(doc.templateId).toBe('technical')
    expect(doc.pages.length).toBe(DOC_TEMPLATES.technical.pages.length)
    expect(await listDocuments()).toHaveLength(1)
  })

  it('saves and retrieves document', async () => {
    const doc = await createDocument('Test')
    const updated = await saveDocument({
      ...doc,
      pages: [{ ...doc.pages[0]!, html: '<h1>Hello</h1>' }],
    })
    const row = await getDocument(doc.id)
    expect(row?.pages[0]?.html).toContain('Hello')
    expect(updated.updatedAt).toBeGreaterThanOrEqual(doc.updatedAt)
  })

  it('duplicates and deletes document', async () => {
    const doc = await createDocument('Original')
    const copy = await duplicateDocument(doc.id)
    expect(copy?.name).toContain('copie')
    expect(await listDocuments()).toHaveLength(2)
    await deleteDocument(doc.id)
    expect(await listDocuments()).toHaveLength(1)
  })

  it('searches by name and content', async () => {
    await createDocument('Architecture')
    const other = await createDocument('Autre')
    await saveDocument({
      ...other,
      pages: [{ ...other.pages[0]!, html: '<p>structure béton</p>' }],
    })
    const byName = await searchDocuments('archi')
    expect(byName).toHaveLength(1)
    const byContent = await searchDocuments('béton')
    expect(byContent).toHaveLength(1)
  })
})

describe('docs model', () => {
  it('cloneDocument assigns new ids', () => {
    const doc = buildDocument('Src', 'notes')
    const copy = cloneDocument(doc)
    expect(copy.id).not.toBe(doc.id)
    expect(copy.pages[0]?.id).not.toBe(doc.pages[0]?.id)
  })

  it('docToPlainText strips html', () => {
    const doc = buildDocument('Plain', 'blank')
    doc.pages = [createPage('<h1>Titre</h1><p>Corps</p>')]
    const text = docToPlainText(doc)
    expect(text).toContain('Titre')
    expect(text).toContain('Corps')
    expect(text).not.toContain('<h1>')
  })
})
