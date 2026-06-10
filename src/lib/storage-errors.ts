/** Classification des erreurs IndexedDB / localStorage (quota, indisponibilité, etc.). */

export type StorageErrorKind = 'quota' | 'unavailable' | 'unknown'

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false
  if (typeof err === 'object' && err !== null) {
    const e = err as { name?: string; message?: string; inner?: unknown; code?: number }
    if (e.name === 'QuotaExceededError') return true
    if (e.code === 22) return true
    if (e.message && /quota|quotaexceeded|storage full/i.test(e.message)) return true
    if (e.inner && isQuotaExceededError(e.inner)) return true
  }
  if (err instanceof DOMException && err.name === 'QuotaExceededError') return true
  return false
}

function errorName(err: unknown): string | undefined {
  if (err instanceof DOMException) return err.name
  if (typeof err === 'object' && err !== null && 'name' in err) {
    return String((err as { name: unknown }).name)
  }
  return undefined
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: unknown }).message)
  }
  return ''
}

export function isIndexedDbUnavailableError(err: unknown): boolean {
  if (!err) return false

  const names = new Set<string>()
  const messages: string[] = []

  const collect = (e: unknown, depth = 0): void => {
    if (!e || depth > 3) return
    const name = errorName(e)
    if (name) names.add(name)
    const msg = errorMessage(e)
    if (msg) messages.push(msg)
    if (typeof e === 'object' && e !== null && 'inner' in e) {
      collect((e as { inner: unknown }).inner, depth + 1)
    }
  }

  collect(err)

  const unavailableNames = new Set([
    'SecurityError',
    'InvalidStateError',
    'UnknownError',
    'AbortError',
    'NotFoundError',
    'DatabaseClosedError',
  ])
  if ([...names].some((n) => unavailableNames.has(n))) return true

  const blob = messages.join(' ')
  if (
    /indexeddb|idbdatabase|backing store|operation is insecure|storage is disabled|private browsing|incognito|blocked|denied|unavailable|failed to open/i.test(
      blob,
    )
  ) {
    return true
  }

  return false
}

export function classifyStorageError(err: unknown): StorageErrorKind {
  if (isQuotaExceededError(err)) return 'quota'
  if (isIndexedDbUnavailableError(err)) return 'unavailable'
  return 'unknown'
}

export function storageErrorMessage(kind: StorageErrorKind): string {
  switch (kind) {
    case 'quota':
      return 'Espace de stockage saturé. Allez dans Paramètres > Stockage pour lancer un nettoyage automatique, exportez une sauvegarde ou videz la corbeille, puis réessayez.'
    case 'unavailable':
      return 'Stockage local indisponible (navigation privée, accès bloqué ou navigateur incompatible). Utilisez une fenêtre normale et un seul onglet Forma.'
    default:
      return 'Enregistrement impossible. Réessayez dans un instant.'
  }
}
