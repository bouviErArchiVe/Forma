import { expect, test } from '@playwright/test'
import {
  createFolder,
  getIndexedDbFolderCount,
  prepareE2EPage,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

test('creates a folder from the library', async ({ page }) => {
  const name = `Dossier E2E ${Date.now()}`
  await createFolder(page, name)
  await expect.poll(async () => getIndexedDbFolderCount(page), { timeout: 5000 }).toBe(1)
  await expect(page.getByText(name)).toBeVisible()
})
