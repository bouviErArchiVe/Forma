/**
 * Résolution de la SOURCE du pack documentaire (Sprint #26).
 *
 * Abstraction NON DESTRUCTIVE entre le pack servi en same-origin (défaut actuel,
 * `public/knowledge-pack/part10/`) et une source DISTANTE optionnelle (CDN /
 * release asset / Supabase…). Aucun changement de comportement par défaut :
 * sans configuration ni variable d'env, on résout vers le same-origin existant.
 *
 * Garanties :
 *  - défaut = same-origin (offline-first préservé) ;
 *  - source distante = OPT-IN (config explicite ou `VITE_FORMA_PACK_BASE_URL`) ;
 *  - repli same-origin si la source distante échoue (si autorisé) ;
 *  - vérification de checksum SHA-256 quand le manifeste la fournit (fail-safe :
 *    un mismatch lève `PackChecksumError` AVANT toute écriture Dexie).
 *
 * Fetch natif uniquement, aucune dépendance.
 */

/** Base same-origin historique (défaut, jamais supprimée ce sprint). */
export const SAME_ORIGIN_PACK_BASE = '/knowledge-pack/part10/data/app'

interface PackSourceConfig {
  /** Base distante optionnelle (null = same-origin). */
  remoteBaseUrl: string | null
  /** Repli same-origin si la base distante échoue. */
  allowSameOriginFallback: boolean
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

function envRemoteBase(): string | null {
  const env = import.meta.env as Record<string, string | undefined>
  const v = env.VITE_FORMA_PACK_BASE_URL
  return v && v.trim() !== '' ? stripTrailingSlash(v.trim()) : null
}

let config: PackSourceConfig = { remoteBaseUrl: envRemoteBase(), allowSameOriginFallback: true }

/** Configure la source du pack (opt-in). Ne change rien si non appelé. */
export function configurePackSource(opts: Partial<PackSourceConfig>): void {
  config = {
    ...config,
    ...(opts.allowSameOriginFallback !== undefined ? { allowSameOriginFallback: opts.allowSameOriginFallback } : {}),
    ...(opts.remoteBaseUrl !== undefined
      ? { remoteBaseUrl: opts.remoteBaseUrl ? stripTrailingSlash(opts.remoteBaseUrl) : null }
      : {}),
  }
}

/** Réinitialise la config (tests). */
export function __resetPackSource(): void {
  config = { remoteBaseUrl: envRemoteBase(), allowSameOriginFallback: true }
}

/** Base effective : `explicit` > distante configurée > same-origin. */
export function resolvePackBaseUrl(explicit?: string): string {
  if (explicit) return stripTrailingSlash(explicit)
  return config.remoteBaseUrl ?? SAME_ORIGIN_PACK_BASE
}

/** Erreur d'intégrité (checksum) — déclenche le fail-safe (pas d'écriture Dexie). */
export class PackChecksumError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PackChecksumError'
  }
}

/** SHA-256 hexadécimal d'un texte (Web Crypto, dispo navigateur + Node 20+). */
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function assertChecksum(text: string, expected: string, file: string): Promise<void> {
  const actual = await sha256Hex(text)
  if (actual.toLowerCase() !== expected.toLowerCase()) {
    throw new PackChecksumError(`Checksum invalide pour ${file} (attendu ${expected.slice(0, 12)}…, obtenu ${actual.slice(0, 12)}…)`)
  }
}

export interface FetchPackResult<T> {
  data: T
  /** true si la source distante a échoué et qu'on a basculé en same-origin. */
  usedFallback: boolean
  baseUrl: string
}

async function fetchTextJson<T>(url: string): Promise<{ data: T; text: string }> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`)
  // Réponse réelle : lire le texte (octets) pour un checksum fidèle. Mocks de
  // test sans `.text()` : repli sur `.json()` puis sérialisation.
  if (typeof (res as Response).text === 'function') {
    const text = await res.text()
    return { data: JSON.parse(text) as T, text }
  }
  const data = (await res.json()) as T
  return { data, text: JSON.stringify(data) }
}

/**
 * Récupère un fichier JSON du pack via la base résolue, avec repli same-origin
 * si la base distante échoue (et si autorisé), et vérification de checksum
 * optionnelle (mismatch ⇒ `PackChecksumError`). Un mismatch de checksum n'est
 * PAS rattrapé par le repli : c'est une erreur d'intégrité, pas de transport.
 */
export async function fetchPackJson<T>(
  file: string,
  opts: { baseUrl?: string; expectedChecksum?: string } = {},
): Promise<FetchPackResult<T>> {
  const primary = resolvePackBaseUrl(opts.baseUrl)

  const load = async (base: string, usedFallback: boolean): Promise<FetchPackResult<T>> => {
    const { data, text } = await fetchTextJson<T>(`${base}/${file}`)
    if (opts.expectedChecksum) await assertChecksum(text, opts.expectedChecksum, file)
    return { data, usedFallback, baseUrl: base }
  }

  try {
    return await load(primary, false)
  } catch (err) {
    // Intégrité (checksum) : ne JAMAIS replier — on ne masque pas une corruption.
    if (err instanceof PackChecksumError) throw err
    // Transport : repli same-origin si autorisé et si on n'y était pas déjà.
    if (config.allowSameOriginFallback && primary !== SAME_ORIGIN_PACK_BASE) {
      return load(SAME_ORIGIN_PACK_BASE, true)
    }
    throw err
  }
}
