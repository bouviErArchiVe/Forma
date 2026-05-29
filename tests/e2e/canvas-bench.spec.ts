import { expect, test } from '@playwright/test'
import { createNotebook, drawSimpleStroke, prepareE2EPage } from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('canvas bench advisory — draw and reload timing', async ({ page }) => {
  await createNotebook(page, `Bench ${Date.now()}`)
  const drawStart = Date.now()
  for (let i = 0; i < 8; i++) {
    await drawSimpleStroke(page)
  }
  const drawMs = Date.now() - drawStart

  const reloadStart = Date.now()
  await page.reload()
  await page.getByTestId('page-draw-canvas').first().waitFor({ state: 'visible', timeout: 15_000 })
  const reloadMs = Date.now() - reloadStart

  console.log(`canvas-bench draw8=${drawMs}ms reload=${reloadMs}ms`)
  expect(drawMs).toBeLessThan(60_000)
  expect(reloadMs).toBeLessThan(30_000)
})
