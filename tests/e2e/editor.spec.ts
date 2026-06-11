import { expect, test } from '@playwright/test'
import {
  createNotebook,
  drawSimpleStroke,
  getIndexedDbPageCount,
  getIndexedDbStrokeCount,
  prepareE2EPage,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('draws a stroke and persists after refresh', async ({ page }) => {
  await createNotebook(page)

  const before = await getIndexedDbStrokeCount(page)
  await drawSimpleStroke(page)

  // Autosave debounce is 2s — wait for flush + margin
  await expect
    .poll(async () => getIndexedDbStrokeCount(page), { timeout: 8000 })
    .toBeGreaterThan(before)

  const afterDraw = await getIndexedDbStrokeCount(page)
  await page.reload()
  await page.getByTestId('page-draw-canvas').first().waitFor({ state: 'visible', timeout: 10_000 })

  await expect
    .poll(async () => getIndexedDbStrokeCount(page), { timeout: 5000 })
    .toBe(afterDraw)
})

test('adds a page in the editor', async ({ page }) => {
  await createNotebook(page)

  await page.getByRole('button', { name: '+ Page ▾' }).click()
  await page.getByRole('button', { name: /Ligné \(défaut\)/ }).click()

  await expect.poll(async () => getIndexedDbPageCount(page), { timeout: 8000 }).toBe(2)
})
