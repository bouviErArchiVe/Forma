import { expect, test } from '@playwright/test'
import { createNotebook, dismissOnboardingIfVisible, prepareE2EPage, skipOnboarding } from './helpers'
import { documentLockStorageKey } from '../../src/lib/document-lock'

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
  await expect(pageB.getByRole('button', { name: /Lecture \(verrouillée\)/ })).toBeVisible()

  await context.close()
})

test('second tab resumes edit after stale lock', async ({ browser }) => {
  const context = await browser.newContext()
  const pageA = await context.newPage()
  const pageB = await context.newPage()

  await skipOnboarding(pageA)
  await pageA.goto('/')
  await skipOnboarding(pageB)

  await createNotebook(pageA, `Stale lock ${Date.now()}`)
  const url = pageA.url()
  const notebookId = url.split('/').filter(Boolean).pop()!

  await pageB.goto(url)
  await dismissOnboardingIfVisible(pageB)
  await expect(pageB.getByTestId('document-lock-banner')).toBeVisible({ timeout: 10_000 })

  await pageB.evaluate(
    ({ key }) => {
      const raw = localStorage.getItem(key)
      if (!raw) return
      const parsed = JSON.parse(raw) as { tabId: string; at: number }
      parsed.at = Date.now() - 60_000
      localStorage.setItem(key, JSON.stringify(parsed))
    },
    { key: documentLockStorageKey(notebookId) },
  )

  await pageB.getByTestId('document-lock-resume').click()
  await expect(pageB.getByTestId('document-lock-banner')).not.toBeVisible({ timeout: 5000 })
  await expect(pageB.getByRole('button', { name: 'Édition' })).toBeVisible()

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
