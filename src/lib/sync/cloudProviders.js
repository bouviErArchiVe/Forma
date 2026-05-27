/** Fournisseurs cloud — Supabase actif, iCloud préparé */

import { isSupabaseConfigured } from '@/lib/supabase'
import { SYNC_STATUS } from './constants'

export const CLOUD_PROVIDERS = {
  local: {
    id: 'local',
    label: 'Local seulement',
    description: 'Sauvegarde sur cet appareil uniquement.',
    available: true,
  },
  supabase: {
    id: 'supabase',
    label: 'Supabase Cloud',
    description: 'Sync multi-appareils via Supabase (si configuré).',
    available: isSupabaseConfigured,
  },
  icloud: {
    id: 'icloud',
    label: 'iCloud',
    description: 'Synchronisation iCloud / CloudKit (bientôt disponible).',
    available: false,
    comingSoon: true,
  },
}

export function getAvailableCloudProviders() {
  return Object.values(CLOUD_PROVIDERS).filter((p) => p.available || p.comingSoon)
}

export function resolveSyncModeLabel({ cloudProvider, cloudEnabled, online, globalStatus, syncError }) {
  if (syncError) return { status: SYNC_STATUS.error, label: 'Erreur sync', detail: syncError }
  if (!cloudEnabled || cloudProvider === 'local') {
    return { status: SYNC_STATUS.saved_local, label: 'Local seulement', detail: 'Travail sauvegardé sur cet appareil.' }
  }
  if (cloudProvider === 'icloud') {
    return { status: SYNC_STATUS.offline, label: 'iCloud (bientôt)', detail: 'CloudKit en préparation — mode local actif.' }
  }
  if (!online) {
    return { status: SYNC_STATUS.offline, label: 'Hors ligne', detail: 'Sync cloud en pause — sauvegarde locale active.' }
  }
  if (globalStatus === SYNC_STATUS.syncing_cloud) {
    return { status: SYNC_STATUS.syncing_cloud, label: 'Synchronisation active', detail: 'Envoi vers le cloud…' }
  }
  if (globalStatus === SYNC_STATUS.synced) {
    return { status: SYNC_STATUS.synced, label: 'Cloud connecté', detail: 'Dernière sync réussie.' }
  }
  return { status: SYNC_STATUS.saved_local, label: 'Cloud activé', detail: 'Sauvegarde locale prioritaire.' }
}

export async function connectCloudProvider(providerId) {
  if (providerId === 'local') return { ok: true, provider: 'local' }
  if (providerId === 'icloud') {
    return {
      ok: false,
      provider: 'icloud',
      message: 'iCloud / CloudKit sera disponible dans une prochaine version. Votre travail reste sauvegardé localement.',
    }
  }
  if (providerId === 'supabase') {
    if (!isSupabaseConfigured) {
      return {
        ok: false,
        provider: 'supabase',
        message: 'Supabase non configuré. Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local.',
      }
    }
    return { ok: true, provider: 'supabase', message: 'Connectez-vous avec votre compte pour activer la sync cloud.' }
  }
  return { ok: false, message: 'Fournisseur inconnu.' }
}

export function detectSyncConflict({ localUpdatedAt, remoteUpdatedAt, localHash, remoteHash }) {
  if (!localUpdatedAt || !remoteUpdatedAt) return null
  if (localHash && remoteHash && localHash === remoteHash) return null
  if (localUpdatedAt === remoteUpdatedAt) return null
  return {
    localUpdatedAt,
    remoteUpdatedAt,
    message: localUpdatedAt > remoteUpdatedAt
      ? 'Version locale plus récente que le cloud. La sauvegarde locale est conservée.'
      : 'Version cloud plus récente détectée. Vous pouvez restaurer depuis l\'historique.',
  }
}
