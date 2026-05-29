import type { Page } from '@playwright/test'

/** Skip onboarding overlay so smoke tests can reach the library UI. */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const key = 'forma-settings'
    try {
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 }
      parsed.state = { ...parsed.state, onboardingDone: true }
      localStorage.setItem(key, JSON.stringify(parsed))
    } catch {
      localStorage.setItem(
        key,
        JSON.stringify({ state: { onboardingDone: true }, version: 0 }),
      )
    }
  })
}

/** Fallback if init script did not apply before first paint. */
export async function dismissOnboardingIfVisible(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: 'Passer' })
  if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skip.click()
  }
}
