import fs from 'node:fs'
import JSZip from 'jszip'
import { expect, test } from '@playwright/test'
import {
  createNotebook,
  drawSimpleStroke,
  exportLibraryBackup,
  FIXTURES_DIR,
  prepareE2EPage,
  replaceImportBackup,
  getIndexedDbNotebookCount,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('export v2 with thumbnails and replace import', async ({ page }) => {
  await createNotebook(page, `V2 ${Date.now()}`)
  await drawSimpleStroke(page)

  const exportPath = await exportLibraryBackup(page, { includeThumbnails: true })
  const zip = await JSZip.loadAsync(fs.readFileSync(exportPath))
  const manifest = JSON.parse((await zip.file('manifest.json')!.async('string')) as string)
  expect(manifest.formatVersion).toBe(2)
  const thumbs = Object.keys(zip.files).filter((k) => k.startsWith('thumbnails/') && k.endsWith('.png'))
  expect(thumbs.length).toBeGreaterThan(0)

  await createNotebook(page, 'Temporary')
  await replaceImportBackup(page, exportPath)
  await expect.poll(async () => getIndexedDbNotebookCount(page), { timeout: 15_000 }).toBe(1)

  try {
    fs.unlinkSync(exportPath)
  } catch {
    /* ignore */
  }
})
