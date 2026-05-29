import { expect, test } from '@playwright/test'
import { createNotebook, prepareE2EPage, seedIndexedDbStrokes } from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('stroke seed bench advisory — 500 strokes reload', async ({ page }) => {
  await createNotebook(page, `Stroke seed ${Date.now()}`)
  const seedStart = Date.now()
  const count = await seedIndexedDbStrokes(page, 500)
  const seedMs = Date.now() - seedStart
  expect(count).toBeGreaterThanOrEqual(500)

  const reloadStart = Date.now()
  await page.reload()
  await page.getByTestId('page-draw-canvas').first().waitFor({ state: 'visible', timeout: 20_000 })
  const reloadMs = Date.now() - reloadStart

  console.log(`stroke-seed-bench count=${count} seed=${seedMs}ms reload=${reloadMs}ms`)
  expect(reloadMs).toBeLessThan(45_000)
})

test('stroke seed bench advisory — 1000 strokes reload', async ({ page }) => {
  await createNotebook(page, `Stroke 1k ${Date.now()}`)
  const count = await seedIndexedDbStrokes(page, 1000)
  expect(count).toBeGreaterThanOrEqual(1000)

  const reloadStart = Date.now()
  await page.reload()
  await page.getByTestId('page-draw-canvas').first().waitFor({ state: 'visible', timeout: 30_000 })
  const reloadMs = Date.now() - reloadStart

  console.log(`stroke-seed-bench count=1000 reload=${reloadMs}ms`)
  expect(reloadMs).toBeLessThan(60_000)
})
