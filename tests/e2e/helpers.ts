import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')

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

/** Wipe IndexedDB + session locks for isolated E2E runs. */
export async function resetIndexedDb(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('forma')
      req.onsuccess = () => resolve()
      req.onerror = () => resolve()
      req.onblocked = () => resolve()
    })
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key?.startsWith('forma-doc-lock-')) sessionStorage.removeItem(key)
    }
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key?.startsWith('forma-doc-lock-')) localStorage.removeItem(key)
    }
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.goto('/')
}

/** Standard E2E prep: onboarding skip + clean DB. */
export async function prepareE2EPage(page: Page): Promise<void> {
  await skipOnboarding(page)
  await page.goto('/')
  await resetIndexedDb(page)
  await page.reload()
}

/** Fallback if init script did not apply before first paint. */
export async function dismissOnboardingIfVisible(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: 'Passer' })
  if (await skip.isVisible({ timeout: 1500 }).catch(() => false)) {
    await skip.click()
  }
}

/** Accept the modal confirm dialog (ConfirmDialog). */
export async function acceptConfirm(page: Page, label = 'OK'): Promise<void> {
  const btn = page.locator('.fixed.inset-0').getByRole('button', { name: label, exact: true })
  await btn.waitFor({ state: 'visible', timeout: 5000 })
  await btn.click()
}

/** Create a notebook from the library and return the editor URL. */
export async function createNotebook(page: Page, name?: string): Promise<string> {
  const notebookName = name ?? `E2E ${Date.now()}`
  await page.goto('/')
  await dismissOnboardingIfVisible(page)
  await page.getByRole('button', { name: '+ Carnet' }).click()
  await page.getByRole('textbox').fill(notebookName)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  await page.waitForURL(/\/document\/[0-9a-f-]+/)
  return page.url()
}

/** Draw a simple diagonal stroke on the active page canvas. */
export async function drawSimpleStroke(page: Page): Promise<void> {
  const canvas = page.getByTestId('page-draw-canvas').first()
  await canvas.waitFor({ state: 'visible', timeout: 10_000 })
  const box = await canvas.boundingBox()
  if (!box) throw new Error('Canvas bounding box unavailable')
  const x0 = box.x + box.width * 0.3
  const y0 = box.y + box.height * 0.3
  const x1 = box.x + box.width * 0.7
  const y1 = box.y + box.height * 0.7
  await page.mouse.move(x0, y0)
  await page.mouse.down()
  await page.mouse.move(x1, y1, { steps: 12 })
  await page.mouse.up()
}

/** Page count in IndexedDB for a notebook (by URL id). */
export async function getIndexedDbPageCount(page: Page, notebookId?: string): Promise<number> {
  const nbId =
    notebookId ??
    (await page.evaluate(() => {
      const m = window.location.pathname.match(/\/document\/([0-9a-f-]+)/i)
      return m?.[1] ?? ''
    }))
  return page.evaluate(async (id) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('forma')
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
    })
    try {
      const tx = db.transaction('pages', 'readonly')
      const store = tx.objectStore('pages')
      const pages = await new Promise<{ notebookId?: string }[]>((resolve, reject) => {
        const req = store.getAll()
        req.onerror = () => reject(req.error)
        req.onsuccess = () => resolve(req.result as { notebookId?: string }[])
      })
      return pages.filter((p) => p.notebookId === id).length
    } finally {
      db.close()
    }
  }, nbId)
}

/** Total stroke count across all pages in IndexedDB. */
export async function getIndexedDbStrokeCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('forma')
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
    })
    try {
      const tx = db.transaction('pages', 'readonly')
      const store = tx.objectStore('pages')
      const pages = await new Promise<unknown[]>((resolve, reject) => {
        const req = store.getAll()
        req.onerror = () => reject(req.error)
        req.onsuccess = () => resolve(req.result as unknown[])
      })
      let total = 0
      for (const raw of pages) {
        const p = raw as { strokes?: unknown[] }
        total += p.strokes?.length ?? 0
      }
      return total
    } finally {
      db.close()
    }
  })
}

/** Notebook count in IndexedDB. */
export async function getIndexedDbNotebookCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('forma')
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
    })
    try {
      const tx = db.transaction('notebooks', 'readonly')
      const store = tx.objectStore('notebooks')
      return new Promise<number>((resolve, reject) => {
        const req = store.count()
        req.onerror = () => reject(req.error)
        req.onsuccess = () => resolve(req.result)
      })
    } finally {
      db.close()
    }
  })
}

/** Folder count in IndexedDB. */
export async function getIndexedDbFolderCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('forma')
      req.onerror = () => reject(req.error)
      req.onsuccess = () => resolve(req.result)
    })
    try {
      const tx = db.transaction('folders', 'readonly')
      const store = tx.objectStore('folders')
      return new Promise<number>((resolve, reject) => {
        const req = store.count()
        req.onerror = () => reject(req.error)
        req.onsuccess = () => resolve(req.result)
      })
    } finally {
      db.close()
    }
  })
}

/** Export library backup via Paramètres ; returns saved download path. */
export async function exportLibraryBackup(page: Page): Promise<string> {
  await page.goto('/settings')
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    page.getByRole('button', { name: 'Exporter la bibliothèque (fichier)' }).click(),
  ])
  const savePath = path.join(FIXTURES_DIR, `.e2e-export-${Date.now()}.forma.zip`)
  await download.saveAs(savePath)
  return savePath
}

/** Merge-import a `.forma` backup from Paramètres. */
export async function mergeImportBackup(page: Page, filePath: string): Promise<void> {
  await page.goto('/settings')
  await page.getByTestId('import-merge-input').setInputFiles(filePath)
  await acceptConfirm(page, 'Importer et fusionner')
  await page.getByText(/Fusionné\s*:/).waitFor({ timeout: 20_000 })
}

/** Replace-import a `.forma` backup (with confirm + pre-replace backup download). */
export async function replaceImportBackup(page: Page, filePath: string): Promise<void> {
  await page.goto('/settings')
  const downloads: string[] = []
  page.on('download', async (d) => {
    const p = path.join(FIXTURES_DIR, `.e2e-pre-replace-${Date.now()}.forma.zip`)
    await d.saveAs(p)
    downloads.push(p)
  })
  await page.getByTestId('import-replace-input').setInputFiles(filePath)
  await acceptConfirm(page, 'Sauvegarder et remplacer')
  await page.getByText(/Remplacé\s*:/).waitFor({ timeout: 30_000 })
}

/** Create a folder from the library UI. */
export async function createFolder(page: Page, name: string): Promise<void> {
  await page.goto('/')
  await dismissOnboardingIfVisible(page)
  await page.getByRole('button', { name: '+ Dossier' }).click()
  await page.getByPlaceholder('Nom du dossier').fill(name)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  await page.getByText(name).waitFor({ state: 'visible', timeout: 5000 })
}
