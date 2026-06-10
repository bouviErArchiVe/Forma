import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { createNotebookFromMarkdown } from './markdown-import'
import { getPages } from '../services/pages'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

beforeEach(async () => {
  await resetDb()
})

function mdFile(content: string, name = 'notes.md'): File {
  return new File([content], name, { type: 'text/markdown' })
}

describe('createNotebookFromMarkdown', () => {
  it('throws for an empty markdown file', async () => {
    await expect(createNotebookFromMarkdown(mdFile('   '), null, 'blank')).rejects.toThrow(
      'Fichier Markdown vide',
    )
  })

  it('creates a single-page notebook for content without separators', async () => {
    const id = await createNotebookFromMarkdown(mdFile('# Hello\n\nWorld'), null, 'blank')
    const nb = await db.notebooks.get(id)
    expect(nb).toBeDefined()
    expect(nb?.name).toBe('notes')
    expect(nb?.paperTemplate).toBe('blank')

    const pages = await getPages(id)
    expect(pages).toHaveLength(1)
    expect(pages[0].texts[0]?.content).toContain('# Hello')
    expect(pages[0].texts[0]?.content).toContain('World')
  })

  it('splits into multiple pages on `---` horizontal rules', async () => {
    const content = 'Section one\n---\nSection two\n---\nSection three'
    const id = await createNotebookFromMarkdown(mdFile(content), null, 'lined')
    const pages = await getPages(id)
    expect(pages).toHaveLength(3)
    const sorted = [...pages].sort((a, b) => a.order - b.order)
    expect(sorted[0].texts[0]?.content).toContain('Section one')
    expect(sorted[1].texts[0]?.content).toContain('Section two')
    expect(sorted[2].texts[0]?.content).toContain('Section three')
  })

  it('splits on "## Page N" headings when no horizontal rules are present', async () => {
    const content = '## Page 1\nFirst page content\n## Page 2\nSecond page content'
    const id = await createNotebookFromMarkdown(mdFile(content), null, 'blank')
    const pages = await getPages(id)
    expect(pages).toHaveLength(2)
  })

  it('strips the .md extension and uses default name when blank', async () => {
    const id1 = await createNotebookFromMarkdown(mdFile('content', 'My Notes.md'), null, 'blank')
    expect((await db.notebooks.get(id1))?.name).toBe('My Notes')

    const id2 = await createNotebookFromMarkdown(mdFile('content', '.md'), null, 'blank')
    expect((await db.notebooks.get(id2))?.name).toBe('Import Markdown')
  })

  it('places the notebook in the given folder', async () => {
    const folder = await db.folders.add({ id: 'f1', parentId: null, name: 'Folder', createdAt: 0, updatedAt: 0 })
    const id = await createNotebookFromMarkdown(mdFile('content'), folder as unknown as string, 'blank')
    expect((await db.notebooks.get(id))?.folderId).toBe(folder)
  })
})
