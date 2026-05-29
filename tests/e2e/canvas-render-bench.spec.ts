import { expect, test } from '@playwright/test'
import { createNotebook, drawSimpleStroke, prepareE2EPage } from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
  await page.addInitScript(() => {
    const key = 'forma-settings'
    try {
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 }
      parsed.state = { ...parsed.state, showPerfHud: true, onboardingDone: true }
      localStorage.setItem(key, JSON.stringify(parsed))
    } catch {
      /* ignore */
    }
  })
})

test('canvas render bench advisory — pan zoom and stroke batch', async ({ page }) => {
  await createNotebook(page, `Render bench ${Date.now()}`)
  const canvas = page.getByTestId('page-draw-canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 10_000 })
  const box = await canvas.boundingBox()
  if (!box) throw new Error('no canvas box')

  const strokeStart = Date.now()
  for (let i = 0; i < 12; i++) {
    await drawSimpleStroke(page)
  }
  const strokeMs = Date.now() - strokeStart

  const panStart = Date.now()
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.5 + 80, box.y + box.height * 0.5 + 40, {
    steps: 16,
  })
  await page.mouse.up()
  const panMs = Date.now() - panStart

  const zoomStart = Date.now()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.wheel(0, -120)
  await page.mouse.wheel(0, -120)
  const zoomMs = Date.now() - zoomStart

  const reloadStart = Date.now()
  await page.reload()
  await canvas.waitFor({ state: 'visible', timeout: 15_000 })
  const reloadMs = Date.now() - reloadStart

  await page.locator('button[title="Lasso"]').click()
  const lassoStart = Date.now()
  const box2 = await canvas.boundingBox()
  if (box2) {
    await page.mouse.move(box2.x + box2.width * 0.2, box2.y + box2.height * 0.2)
    await page.mouse.down()
    await page.mouse.move(box2.x + box2.width * 0.7, box2.y + box2.height * 0.6, { steps: 12 })
    await page.mouse.up()
  }
  const lassoMs = Date.now() - lassoStart

  console.log(
    `render-bench strokes12=${strokeMs}ms pan=${panMs}ms zoom=${zoomMs}ms lasso=${lassoMs}ms reload=${reloadMs}ms`,
  )
  expect(strokeMs).toBeLessThan(120_000)
  expect(reloadMs).toBeLessThan(30_000)
})
