import { expect, test } from '@playwright/test'
import { prepareE2EPage } from './helpers'

test.beforeEach(async ({ page }) => {
  await prepareE2EPage(page)
})

/**
 * Sprint #20 — e2e ciblé : citations/chips FormAI + onglets /dictionary + Search.
 * Aucune charge des 64 MB du pack : on AMORCE Dexie via les modules de l'app
 * (conversation sourcée + quelques fiches pack + batch déjà « completed » à la
 * bonne version → l'import paresseux est court-circuité).
 */
async function seedDexie(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/formai')
  return page.evaluate(async () => {
    const conv = await import('/src/services/ai/conversations.ts')
    const { db } = await import('/src/db/index.ts')
    // Batch « completed » à la version réelle du manifeste → import court-circuité.
    const manifest = await fetch('/knowledge-pack/part10/data/app/offline_manifest.json').then((r) => r.json())
    await db.formaImportBatches.put({ packName: manifest.pack, version: manifest.createdAt, status: 'completed', createdAt: 'seed' })
    await db.formaKnowledgeEntries.bulkPut([
      { id: 'fx-e2e-1', title: 'Fondation profonde', kind: 'source_chunk', summary: 'Pieux et puits.', content: 'La fondation profonde reporte les charges en profondeur.', sourceDocument: 'ching 3e.pdf', sourcePage: 53, tags: ['fondation'], confidence: 0.88, qualityStatus: 'ok', importGate: 'clean', formaUsefulnessScore: 60 },
      { id: 'fx-e2e-2', title: 'Exigence accessibilité', kind: 'source_chunk', summary: 'Dégagements.', content: 'Largeurs minimales selon le code.', sourceDocument: 'CCQ.pdf', sourcePage: 120, tags: ['accessibilite'], confidence: 0.7, qualityStatus: 'review', importGate: 'review', formaUsefulnessScore: 40 },
    ])
    const c = await conv.createConversation()
    await conv.appendMessage(c.id, { role: 'user', content: 'questions', ts: Date.now() })
    await conv.appendMessage(c.id, { role: 'assistant', content: 'Réponse seed.', ts: Date.now(), providerId: 'local', sources: [{ kind: 'seed', label: 'poutre', slug: 'poutre', toVerify: false }] })
    await conv.appendMessage(c.id, { role: 'assistant', content: 'Réponse pack review.', ts: Date.now(), providerId: 'local', sources: [{ kind: 'pack', label: 'CCQ.pdf', document: 'CCQ.pdf', page: 120, gate: 'review', toVerify: true }] })
    return c.id
  })
}

test('FormAI affiche les chips sources et le lien seed résout vers /dictionary', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  const convId = await seedDexie(page)
  await page.goto(`/formai/${convId}`)

  // Chips : badge clean « Sourcé », badge review « À vérifier », document·page, avertissement officiel.
  await expect(page.getByText('Sourcé').first()).toBeVisible()
  await expect(page.getByText('À vérifier').first()).toBeVisible()
  await expect(page.getByText(/CCQ\.pdf · p\.\s*120/)).toBeVisible()
  await expect(page.getByText(/à vérifier dans la version officielle\/applicable/i)).toBeVisible()

  // Lien seed → /dictionary?slug=poutre qui résout (pas de dead link).
  const seedLink = page.locator('a[href*="/dictionary?slug=poutre"]').first()
  await expect(seedLink).toBeVisible()
  await seedLink.click()
  await expect(page).toHaveURL(/\/dictionary\?slug=poutre/)
  await expect(page.getByText(/source/i).first()).toBeVisible()

  expect(errors, errors.join('\n')).toHaveLength(0)
})

test('clic chip pack → /dictionary Documents pré-filtré sur le document (#21)', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  const convId = await seedDexie(page)
  await page.goto(`/formai/${convId}`)

  // Le chip pack (document connu) est désormais un lien vers l'onglet Documents pré-filtré.
  const packLink = page.locator('a[href*="source=pack"][href*="document=CCQ.pdf"]').first()
  await expect(packLink).toBeVisible()
  await packLink.click()

  await expect(page).toHaveURL(/source=pack/)
  await expect(page).toHaveURL(/document=CCQ\.pdf/)
  await expect(page).toHaveURL(/page=120/)

  // Onglet Documents pré-filtré : la fiche CCQ amorcée (review) est visible avec
  // son avertissement officiel, et AUCUNE mention quarantine.
  await expect(page.getByText('Exigence accessibilité')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/à vérifier dans la source officielle\/applicable/i).first()).toBeVisible()
  await expect(page.getByText(/quarantine/i)).toHaveCount(0)

  expect(errors, errors.join('\n')).toHaveLength(0)
})

test('/dictionary onglets Base Forma + Documents et Search retournent des résultats', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await seedDexie(page)
  await page.goto('/dictionary')

  await expect(page.getByText('Base Forma', { exact: true })).toBeVisible()
  const docTab = page.getByText('Documents', { exact: true })
  await expect(docTab).toBeVisible()
  await docTab.click()
  // Fiche pack amorcée visible (titre = carte, pas une option de filtre), et AUCUNE mention quarantine.
  await expect(page.getByText('Fondation profonde')).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/quarantine/i)).toHaveCount(0)

  // Search : au moins un résultat knowledge sur un terme courant.
  await page.goto('/search?q=fondation')
  await expect(page.locator('body')).toContainText(/fondation/i)

  expect(errors, errors.join('\n')).toHaveLength(0)
})
