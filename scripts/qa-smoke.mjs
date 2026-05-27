import puppeteer from 'puppeteer'

const base = process.argv[2] || 'http://127.0.0.1:5173'
const executablePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

const results = []

async function snap(page, label) {
  await new Promise((r) => setTimeout(r, 1200))
  const rootLen = await page.$eval('#root', (el) => el.innerHTML.length).catch(() => 0)
  const text = await page.evaluate(() => document.body.innerText.slice(0, 500))
  const url = page.url()
  return { label, url, rootLen, ok: rootLen > 100, textPreview: text.replace(/\s+/g, ' ').slice(0, 180) }
}

const browser = await puppeteer.launch({ headless: true, executablePath })
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

try {
  // 1. Accueil — localStorage vide (1er lancement simulé)
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(() => localStorage.clear())
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
  results.push(await snap(page, '1-accueil-vierge'))

  // 2. Vérifier defaults visuels (store bootstrap)
  const defaults = await page.evaluate(() => {
    const raw = localStorage.getItem('forma-store')
    if (!raw) return { hasStore: false }
    const s = JSON.parse(raw).state || JSON.parse(raw)
    return {
      hasStore: true,
      themeId: s.themeId,
      appearanceMode: s.appearanceMode,
      animType: s.animType,
      bgId: s.bgId,
    }
  })
  results.push({ label: '2-defaults-store', ok: true, defaults })

  // 3. Créer carnet local
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Nouveau'))
    btn?.click()
  })
  await new Promise((r) => setTimeout(r, 600))
  const titleInput = await page.$('input[placeholder*="Projet"], input[placeholder*="École"]')
  if (titleInput) {
    await titleInput.click({ clickCount: 3 })
    await titleInput.type('QA Test')
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Créer le carnet'))
      btn?.click()
    })
  }
  results.push(await snap(page, '3-apres-creation-carnet'))

  // 4. Moodboard
  await page.goto(`${base}/moodboard`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  results.push(await snap(page, '4-moodboard'))

  // 5. Auth
  await page.goto(`${base}/auth`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  results.push(await snap(page, '5-auth'))

  // 6. Éditeur avec carnet local seedé
  await page.evaluate(() => {
    const nb = {
      id: 'local-qa-test',
      title: 'QA Editor',
      subject: 'arch',
      template: 'plan',
      pages_count: 1,
      starred: false,
      color: '#c8622a',
      folder_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const page1 = {
      id: 'local-qa-test-p1',
      page_number: 1,
      notebook_id: 'local-qa-test',
      elements: JSON.stringify({ format: 'a4', rotation: 0, customMm: { w: 210, h: 297 }, items: [], images: [], pageColor: null, gridColor: null, gridStyle: 'grid10', infinite: false, name: '', bgImage: null, bgImageOpacity: 1 }),
      canvas_data: JSON.stringify({ strokes: [], layers: [{ id: 'sketch', name: 'Esquisse', visible: true, locked: false, opacity: 1 }], activeLayerId: 'sketch' }),
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem('forma_local_notebooks_v1', JSON.stringify([nb]))
    localStorage.setItem('forma_pages_local-qa-test', JSON.stringify([page1]))
  })
  await page.goto(`${base}/editor/local-qa-test`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 3000))
  results.push(await snap(page, '6-editeur'))

  const failed = results.filter((r) => r.ok === false)
  console.log(JSON.stringify({ base, errors, failed: failed.length, results }, null, 2))
  process.exitCode = failed.length || errors.length ? 1 : 0
} catch (e) {
  console.log(JSON.stringify({ base, fatal: e.message, errors, results }, null, 2))
  process.exitCode = 1
} finally {
  await browser.close()
}
