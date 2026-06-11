import { expect, test } from '@playwright/test'
import { createNotebook, dismissOnboardingIfVisible, prepareE2EPage, skipOnboarding } from './helpers'

test('second tab opens same document in read-only lock', async ({ browser }) => {
  const context = await browser.newContext()
  const pageA = await context.newPage()
  const pageB = await context.newPage()

  await skipOnboarding(pageA)
  await pageA.goto('/')
  await skipOnboarding(pageB)

  await createNotebook(pageA, `Lock test ${Date.now()}`)
  const url = pageA.url()

  await pageB.goto(url)
  await dismissOnboardingIfVisible(pageB)
  await expect(pageB.getByTestId('document-lock-banner')).toBeVisible({ timeout: 10_000 })
  await expect(pageB.getByRole('button', { name: /Lecture/ })).toBeVisible()

  await context.close()
})

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('primary tab keeps edit mode when alone', async ({ page }) => {
  await createNotebook(page)
  await expect(page.getByRole('button', { name: 'Édition' })).toBeVisible()
  await expect(page.getByTestId('document-lock-banner')).not.toBeVisible()
})
