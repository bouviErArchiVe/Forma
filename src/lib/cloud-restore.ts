import { type ImportBackupMode, type ImportBackupResult } from './backup'
import { confirm } from '../stores/confirmStore'
import { latestCloudSnapshot, restoreCloudSnapshot } from './cloud-snapshots'

export interface RestoreCloudSlotOptions {
  mode?: ImportBackupMode
  /** true si la confirmation UI a déjà été faite (Paramètres). */
  confirmed?: boolean
}

export async function restoreFromCloudSlot(
  options?: RestoreCloudSlotOptions,
): Promise<ImportBackupResult> {
  const mode = options?.mode ?? 'replace'
  if (!options?.confirmed) {
    if (mode === 'merge') {
      const ok = await confirm(
        'Les carnets de la copie cloud seront ajoutés à votre bibliothèque. Conflits d’identifiant → nouveaux ids locaux.',
        {
          title: 'Fusionner depuis la copie cloud ?',
          confirmLabel: 'Fusionner',
        },
      )
      if (!ok) throw new Error('Restauration annulée')
    } else {
      const ok = await confirm(
        'Un fichier .forma de sauvegarde sera téléchargé automatiquement, puis vos données locales seront remplacées par la copie cloud.',
        {
          title: 'Remplacer par la copie cloud ?',
          confirmLabel: 'Restaurer et remplacer',
          danger: true,
        },
      )
      if (!ok) throw new Error('Restauration annulée')
    }
  }

  const latest = await latestCloudSnapshot()
  if (!latest) throw new Error('Aucune copie cloud locale enregistrée')
  const result = await restoreCloudSnapshot(latest.id, { mode, confirmed: true })
  return result.library
}
