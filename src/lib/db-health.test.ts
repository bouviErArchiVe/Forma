import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { putAsset } from './assets'
import { getDbHealthReport } from './db-health'
import { makeTestNotebook, makeTestPage } from './forma-test-fixtures'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('db-health', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('counts orphan assets without references', async () => {
    const nb = makeTestNotebook({ id: 'nb-health' })
    await db.notebooks.add(nb)
    await db.pages.add(makeTestPage(nb.id))
    await putAsset('orphan-asset-1', nb.id, new Blob([1]), 'image/png')
    await putAsset('orphan-asset-2', nb.id, new Blob([2]), 'image/png')

    const report = await getDbHealthReport()
    expect(report.orphanAssetCount).toBeGreaterThanOrEqual(2)
    expect(report.stats.pages).toBe(1)
  })
})
