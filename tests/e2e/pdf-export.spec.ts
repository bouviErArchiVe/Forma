import { expect, test } from '@playwright/test'
import { createNotebook, drawSimpleStroke, prepareE2EPage } from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('exports notebook PDF from editor menu', async ({ page }) => {
  await createNotebook(page, `PDF export ${Date.now()}`)
  await drawSimpleStroke(page)

  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 })
  await page.getByTestId('export-menu-trigger').click()
  await page.getByTestId('export-pdf-notebook').click()

  const download = await downloadPromise
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.pdf$/)
  const size = await download.createReadStream()
  expect(size).toBeTruthy()
})
