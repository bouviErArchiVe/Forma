import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db'
import { cellKey } from '../lib/spreadsheet/cells'
import { createSheet } from '../lib/spreadsheet/model'
import {
  createSheetRecord,
  deleteSheet,
  duplicateSheet,
  getSheet,
  listSheets,
  saveSheet,
  searchSheets,
} from './formatab'

async function resetDb(): Promise<void> {
  db.close()
  await db.delete()
  await db.open()
}

describe('formatab service', () => {
  beforeEach(async () => {
    await resetDb()
  })

  it('creates and lists sheets', async () => {
    const sheet = await createSheetRecord('Budget')
    expect(sheet.name).toBe('Budget')
    expect(await listSheets()).toHaveLength(1)
  })

  it('saves cell data', async () => {
    const sheet = await createSheetRecord('Calc')
    const updated = await saveSheet({
      ...sheet,
      cells: { [cellKey(0, 0)]: { raw: '42' } },
    })
    const row = await getSheet(sheet.id)
    expect(row?.cells[cellKey(0, 0)]?.raw).toBe('42')
    expect(updated.updatedAt).toBeGreaterThanOrEqual(sheet.updatedAt)
  })

  it('duplicates and deletes sheet', async () => {
    const sheet = await createSheetRecord('Original')
    const copy = await duplicateSheet(sheet.id)
    expect(copy?.name).toContain('copie')
    expect(await listSheets()).toHaveLength(2)
    await deleteSheet(sheet.id)
    expect(await listSheets()).toHaveLength(1)
  })

  it('searches by name and cell content', async () => {
    await createSheetRecord('Architecture')
    const other = await createSheetRecord('Autre')
    await saveSheet({
      ...other,
      cells: { [cellKey(1, 1)]: { raw: 'béton armé' } },
    })
    expect(await searchSheets('archi')).toHaveLength(1)
    expect(await searchSheets('béton')).toHaveLength(1)
  })
})

describe('sheet model', () => {
  it('createSheet has default grid size', () => {
    const sheet = createSheet()
    expect(sheet.rows).toBeGreaterThan(0)
    expect(sheet.cols).toBeGreaterThan(0)
    expect(sheet.rowHeights.length).toBe(sheet.rows)
    expect(sheet.colWidths.length).toBe(sheet.cols)
  })
})
