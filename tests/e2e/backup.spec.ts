import { expect, test } from '@playwright/test'
import path from 'node:path'
import {
  acceptConfirm,
  createNotebook,
  drawSimpleStroke,
  exportLibraryBackup,
  FIXTURES_DIR,
  getIndexedDbNotebookCount,
  getIndexedDbStrokeCount,
  mergeImportBackup,
  prepareE2EPage,
  replaceImportBackup,
  resetIndexedDb,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('exports and merge-imports a .forma backup with strokes preserved', async ({ page }) => {
  await createNotebook(page, `Roundtrip ${Date.now()}`)
  await drawSimpleStroke(page)
  await expect
    .poll(async () => getIndexedDbStrokeCount(page), { timeout: 8000 })
    .toBeGreaterThan(0)

  const strokesBeforeExport = await getIndexedDbStrokeCount(page)
  const exportPath = await exportLibraryBackup(page)

  await resetIndexedDb(page)
  await expect.poll(async () => getIndexedDbNotebookCount(page), { timeout: 15_000 }).toBe(0)

  await mergeImportBackup(page, exportPath)
  await expect
    .poll(async () => getIndexedDbStrokeCount(page), { timeout: 10_000 })
    .toBe(strokesBeforeExport)
})

test('merge import adds notebooks without clearing existing data', async ({ page }) => {
  await createNotebook(page, 'Local A')
  await drawSimpleStroke(page)
  await expect.poll(async () => getIndexedDbStrokeCount(page), { timeout: 8000 }).toBeGreaterThan(0)

  const exportPath = await exportLibraryBackup(page)
  await createNotebook(page, 'Local B')

  const nbBefore = await getIndexedDbNotebookCount(page)
  expect(nbBefore).toBeGreaterThanOrEqual(2)

  await mergeImportBackup(page, exportPath)
  await expect
    .poll(async () => getIndexedDbNotebookCount(page), { timeout: 10_000 })
    .toBeGreaterThan(nbBefore)
})

test('replace import requires confirm and restores exported library', async ({ page }) => {
  await createNotebook(page, 'Source notebook')
  await drawSimpleStroke(page)
  await expect.poll(async () => getIndexedDbStrokeCount(page), { timeout: 8000 }).toBeGreaterThan(0)

  const strokesBefore = await getIndexedDbStrokeCount(page)
  const exportPath = await exportLibraryBackup(page)

  await createNotebook(page, 'Temporary extra')
  await expect.poll(async () => getIndexedDbNotebookCount(page), { timeout: 8000 }).toBeGreaterThan(1)

  await replaceImportBackup(page, exportPath)

  await expect.poll(async () => getIndexedDbNotebookCount(page), { timeout: 10_000 }).toBe(1)
  await expect
    .poll(async () => getIndexedDbStrokeCount(page), { timeout: 10_000 })
    .toBe(strokesBefore)
})
