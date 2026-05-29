import { expect, test } from '@playwright/test'
import { dismissOnboardingIfVisible, prepareE2EPage } from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('opens library home page', async ({ page }) => {
  await page.goto('/')
  await dismissOnboardingIfVisible(page)

  await expect(page).toHaveTitle(/Forma/)
  await expect(page.getByRole('heading', { name: 'Forma', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Bibliothèque', level: 2 })).toBeVisible()
  await expect(page.getByRole('button', { name: '+ Carnet' })).toBeVisible()
})

test('creates a notebook and opens the editor', async ({ page }) => {
  const notebookName = `E2E carnet ${Date.now()}`

  await page.goto('/')
  await dismissOnboardingIfVisible(page)

  await page.getByRole('button', { name: '+ Carnet' }).click()
  await expect(page.getByRole('heading', { name: 'Nouveau document' })).toBeVisible()

  await page.getByRole('textbox').fill(notebookName)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()

  await expect(page).toHaveURL(/\/document\/[0-9a-f-]+/)
  await expect(page.getByRole('link', { name: '← Bibliothèque' })).toBeVisible()
})

test('navigates library → settings → templates → library', async ({ page }) => {
  await page.goto('/')
  await dismissOnboardingIfVisible(page)

  await page.getByRole('button', { name: 'Paramètres' }).click()
  await expect(page).toHaveURL('/settings')
  await expect(page.getByRole('heading', { name: 'Paramètres', level: 1 })).toBeVisible()

  await page.getByRole('link', { name: /Bibliothèque/ }).click()
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'Forma', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: 'Modèles' }).click()
  await expect(page).toHaveURL('/templates')
  await expect(page.getByRole('heading', { name: 'Galerie de modèles', level: 1 })).toBeVisible()

  await page.getByRole('button', { name: '← Bibliothèque' }).click()
  await expect(page).toHaveURL('/')
})
