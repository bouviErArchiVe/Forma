import { downloadBackup, exportFullBackup } from '../lib/backup'

const AUTO_KEY = 'forma-auto-backup'
import type { SyncInterval } from '../types'
import { useSettingsStore } from '../stores/settingsStore'

export type { SyncInterval }

export function getSyncInterval(): SyncInterval {
  return useSettingsStore.getState().syncInterval
}

export function setSyncInterval(v: SyncInterval): void {
  useSettingsStore.getState().setSyncInterval(v)
}

export function getLastBackupTime(): number | null {
  const t = localStorage.getItem(AUTO_KEY)
  return t ? Number(t) : null
}

function markBackupDone(): void {
  localStorage.setItem(AUTO_KEY, String(Date.now()))
}

export async function runAutoBackupIfDue(): Promise<boolean> {
  const interval = getSyncInterval()
  if (interval === 'off') return false
  const last = getLastBackupTime() ?? 0
  const ms = interval === 'daily' ? 86400000 : 604800000
  if (Date.now() - last < ms) return false

  try {
    await saveBackupToCloudSlot()
    return true
  } catch {
    return false
  }
}

/** Sauvegarde manuelle avec choix de fichier (paramètres). */
export async function runManualBackupDownload(): Promise<boolean> {
  try {
    await downloadBackup()
    markBackupDone()
    return true
  } catch {
    return false
  }
}

export async function saveBackupToCloudSlot(): Promise<void> {
  const blob = await exportFullBackup()
  const reader = new FileReader()
  const dataUrl = await new Promise<string>((res, rej) => {
    reader.onload = () => res(reader.result as string)
    reader.onerror = rej
    reader.readAsDataURL(blob)
  })
  try {
    localStorage.setItem('forma-cloud-slot', dataUrl.slice(0, 5000000))
    markBackupDone()
  } catch {
    throw new Error('Sauvegarde cloud locale trop volumineuse (>5 Mo slot)')
  }
}

export function loadCloudSlot(): string | null {
  return localStorage.getItem('forma-cloud-slot')
}
