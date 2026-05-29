import { expect, test } from '@playwright/test'
import path from 'node:path'
import {
  FIXTURES_DIR,
  getIndexedDbNotebookCount,
  getIndexedDbPageCount,
  prepareE2EPage,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('imports a minimal PDF from the library', async ({ page }) => {
  await page.goto('/')
  const pdfPath = path.join(FIXTURES_DIR, 'minimal.pdf')

  await page.getByRole('button', { name: 'PDF', exact: true }).click()
  await page.locator('input[accept="application/pdf"]').setInputFiles(pdfPath)

  await expect(page).toHaveURL(/\/document\/[0-9a-f-]+/, { timeout: 60_000 })
  await expect
    .poll(async () => getIndexedDbPageCount(page), { timeout: 30_000 })
    .toBeGreaterThanOrEqual(1)
  await expect.poll(async () => getIndexedDbNotebookCount(page), { timeout: 5000 }).toBe(1)
})
