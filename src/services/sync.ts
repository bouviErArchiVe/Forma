import { downloadBackup } from '../lib/backup'
import { saveCloudSnapshot } from '../lib/cloud-snapshots'

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
export async function runManualBackupDownload(options?: {
  includeThumbnails?: boolean
}): Promise<boolean> {
  try {
    await downloadBackup(options)
    markBackupDone()
    return true
  } catch {
    return false
  }
}

/**
 * Sauvegarde dans le slot cloud local. Désormais un instantané IndexedDB
 * (carnets + modules), sans le plafond 5 Mo de l'ancien slot localStorage.
 */
export async function saveBackupToCloudSlot(label?: string): Promise<void> {
  await saveCloudSnapshot(label)
  markBackupDone()
}
