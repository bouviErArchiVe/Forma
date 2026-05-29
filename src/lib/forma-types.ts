/** Types et constantes partagés format .forma (évite cycles d’import). */
/** Les vignettes (couvertures bibliothèque, sidebar éditeur) ne sont pas dans le ZIP :
 *  elles sont régénérées localement (thumb-queue / cache mémoire), hors export .forma. */

export const FORMA_FORMAT_VERSION = 1

export interface FormaManifest {
  formatVersion: number
  appVersion: string
  exportedAt: number
  packageType: 'library' | 'notebook'
  /** SHA-256 du payload ZIP (tous fichiers sauf manifest.json, chemins triés). */
  integrity?: { algorithm: 'none' | 'sha256'; digest?: string }
}

export interface FormaMetadata {
  notebookCount: number
  pageCount: number
  folderCount: number
}
