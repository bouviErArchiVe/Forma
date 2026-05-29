import { db } from '../db'

function hashPin(pin: string): string {
  let h = 0
  for (let i = 0; i < pin.length; i++) h = (h << 5) - h + pin.charCodeAt(i)
  return `fp${Math.abs(h)}`
}

export async function setNotebookPin(notebookId: string, pin: string): Promise<void> {
  await db.settings.put({ key: `pin-${notebookId}`, value: hashPin(pin) })
}

export async function clearNotebookPin(notebookId: string): Promise<void> {
  await db.settings.delete(`pin-${notebookId}`)
}

export async function hasNotebookPin(notebookId: string): Promise<boolean> {
  return !!(await db.settings.get(`pin-${notebookId}`))
}

export async function verifyNotebookPin(notebookId: string, pin: string): Promise<boolean> {
  const row = await db.settings.get(`pin-${notebookId}`)
  if (!row) return true
  return row.value === hashPin(pin)
}
