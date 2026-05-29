import { expect, test } from '@playwright/test'
import { createNotebook, drawSimpleStroke, prepareE2EPage } from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('exports multi-page notebook PDF', async ({ page }) => {
  await createNotebook(page, `Multi PDF ${Date.now()}`)
  await drawSimpleStroke(page)

  await page.getByRole('button', { name: '+ Page ▾' }).click()
  await page.getByRole('button', { name: /Ligné \(défaut\)/ }).click()
  await page.getByTestId('page-draw-canvas').first().waitFor({ state: 'visible', timeout: 10_000 })

  const downloadPromise = page.waitForEvent('download', { timeout: 45_000 })
  await page.getByTestId('export-menu-trigger').click()
  await page.getByTestId('export-pdf-notebook').click()

  const download = await downloadPromise
  expect(download.suggestedFilename().toLowerCase()).toMatch(/\.pdf$/)
})
