/** FormaSync — constantes du système de sauvegarde */

export const SYNC_KEYS = {
  settings: 'forma-sync-settings',
  journal: 'forma-sync-journal',
  versions: 'forma-sync-versions-index',
  versionPrefix: 'forma-sync-vdata_',
  cloudQueue: 'forma-sync-cloud-queue',
}

export const SYNC_STATUS = {
  idle: 'idle',
  dirty: 'dirty',
  saving: 'saving',
  saved_local: 'saved_local',
  syncing_cloud: 'syncing_cloud',
  synced: 'synced',
  offline: 'offline',
  error: 'error',
}

export const RESOURCE_TYPES = {
  notebook_page: 'notebook_page',
  notebook: 'notebook',
  proforma: 'proforma',
  doc: 'doc',
  sheet: 'sheet',
  combine: 'combine',
  review: 'review',
  present: 'present',
  formatcal: 'formatcal',
  folder: 'folder',
  moodboard: 'moodboard',
}

export const MAX_LOCAL_VERSIONS = 15
export const VERSION_MIN_INTERVAL_MS = 5 * 60 * 1000
export const AUTOSAVE_DEBOUNCE_MS = 1200
export const CLOUD_RETRY_MS = 30_000

export const PERMISSION_LABELS = {
  read: 'Lecture seule',
  comment: 'Commentaire',
  edit: 'Modification',
  owner: 'Propriétaire',
}

export const DEFAULT_SYNC_SETTINGS = {
  cloudEnabled: false,
  autoCloudSync: true,
  versionSnapshots: true,
  saveIndicator: true,
}
