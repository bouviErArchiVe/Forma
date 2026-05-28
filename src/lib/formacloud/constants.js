/** FormaCloud — stockage utilisateur connecté (dossier /Forma) */

export const FORMA_ROOT = 'Forma'

export const FORMA_FOLDERS = {
  projects: 'projects',
  notebooks: 'notebooks',
  documents: 'documents',
  tables: 'tables',
  library: 'library',
  exports: 'exports',
  settings: 'settings',
}

export const FORMA_INDEX_FILE = 'forma-index.json'

export const FORMA_CLOUD_STATUS = {
  idle: 'idle',
  saved_local: 'saved_local',
  syncing: 'syncing',
  synced: 'synced',
  offline: 'offline',
  error: 'error',
  conflict: 'conflict',
}

export const FORMA_CLOUD_PROVIDERS = {
  google_drive: {
    id: 'google_drive',
    label: 'Google Drive',
    icon: '📁',
    description: 'Crée un dossier Forma dans votre Google Drive.',
    available: () => Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID),
    webReady: true,
  },
  icloud: {
    id: 'icloud',
    label: 'iCloud',
    icon: '☁',
    description: 'Nécessite une app native (CloudKit). Export/import manuel disponible.',
    available: () => false,
    webReady: false,
    comingSoon: true,
  },
  onedrive: {
    id: 'onedrive',
    label: 'OneDrive',
    icon: '📂',
    description: 'Bientôt disponible.',
    available: () => false,
    comingSoon: true,
  },
  dropbox: {
    id: 'dropbox',
    label: 'Dropbox',
    icon: '📦',
    description: 'Bientôt disponible.',
    available: () => false,
    comingSoon: true,
  },
}

/** Clés localStorage synchronisées vers le cloud */
export const SYNC_LS_KEYS = [
  'forma-store',
  'forma-moodboard',
  'forma-sync-store',
  'forma_local_notebooks_v1',
  'forma-documents',
  'forma-spreadsheets',
  'forma-combine',
  'forma-combine-exports',
  'forma-review',
  'forma-present',
  'forma-formatcal',
  'forma-library',
  'forma-visual-profiles',
  'forma-folders-local',
]

export const FORMA_CLOUD_QUEUE_KEY = 'forma-cloud-sync-queue'
