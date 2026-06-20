/**
 * Knowledge Core — loader paresseux des seeds.
 *
 * Les ~920 entrées de la base vivent dans des fichiers JSON sous
 * `src/data/knowledge/seeds/*.json`. Pour qu'elles NE soient PAS embarquées
 * dans le bundle principal, on utilise `import.meta.glob` en mode paresseux
 * (lazy) : chaque fichier devient un import dynamique, chargé à la demande.
 *
 * `loadKnowledgeBase()` importe dynamiquement chaque seed, valide chaque entrée
 * (les invalides sont écartées avec un avertissement — on ne fait JAMAIS échouer
 * tout le chargement), normalise, dédoublonne par `id`, puis trie par
 * `order`/`term`. Le résultat est mémoïsé (un seul chargement réseau/disque).
 *
 * `manifest.json` est explicitement exclu : ce n'est pas une liste d'entrées.
 */
import {
  normalizeKnowledgeEntry,
  validateKnowledgeEntry,
  type KnowledgeEntry,
} from './model'

/**
 * Glob paresseux des seeds JSON. Le motif inclut tous les `.json` du dossier ;
 * `manifest.json` est filtré ci-dessous (un glob négatif n'est pas garanti
 * stable selon les versions de Vite, on filtre donc par chemin).
 */
const SEED_MODULES = import.meta.glob<{ default: unknown }>(
  '../../data/knowledge/seeds/*.json',
)

/** Vrai si le chemin du module correspond au manifest (à exclure). */
function isManifest(path: string): boolean {
  return /\/manifest\.json$/.test(path)
}

let cached: KnowledgeEntry[] | null = null
let loading: Promise<KnowledgeEntry[]> | null = null

/** Comparateur de tri : `order` croissant (absent en dernier), puis `term`. */
function compareEntries(a: KnowledgeEntry, b: KnowledgeEntry): number {
  const ao = a.order ?? Number.POSITIVE_INFINITY
  const bo = b.order ?? Number.POSITIVE_INFINITY
  if (ao !== bo) return ao - bo
  return a.term.localeCompare(b.term, 'fr')
}

/** Extrait le tableau d'entrées brutes d'un module JSON importé. */
function extractRawEntries(mod: { default: unknown }): unknown[] {
  const data = mod?.default
  return Array.isArray(data) ? data : []
}

async function doLoad(): Promise<KnowledgeEntry[]> {
  const byId = new Map<string, KnowledgeEntry>()

  const paths = Object.keys(SEED_MODULES).filter((p) => !isManifest(p))
  const modules = await Promise.all(
    paths.map(async (path) => {
      try {
        const mod = await SEED_MODULES[path]()
        return { path, mod }
      } catch (err) {
        console.warn(`[knowledge] échec de chargement du seed « ${path} » :`, err)
        return { path, mod: { default: [] } as { default: unknown } }
      }
    }),
  )

  for (const { path, mod } of modules) {
    for (const raw of extractRawEntries(mod)) {
      const entry = normalizeKnowledgeEntry(raw as Partial<KnowledgeEntry>)
      const errors = validateKnowledgeEntry(entry)
      if (errors.length > 0) {
        console.warn(
          `[knowledge] entrée invalide ignorée dans « ${path} » (${entry.id || 'sans id'}) : ${errors.join(', ')}`,
        )
        continue
      }
      // Dédoublonnage par id : première occurrence gagnante.
      if (!byId.has(entry.id)) byId.set(entry.id, entry)
    }
  }

  return [...byId.values()].sort(compareEntries)
}

/**
 * Charge (paresseusement) toute la base de connaissance, validée et triée.
 * Mémoïsé : les appels suivants renvoient le tableau déjà calculé. Ne lève
 * jamais sur une entrée ou un fichier invalide (drop + warn).
 */
export async function loadKnowledgeBase(): Promise<KnowledgeEntry[]> {
  if (cached !== null) return cached
  if (loading === null) {
    loading = doLoad().then((entries) => {
      cached = entries
      loading = null
      return entries
    })
  }
  return loading
}

/**
 * Réinitialise le cache du loader (tests uniquement). Permet de re-mesurer le
 * chargement sans pollution entre cas de test.
 */
export function __resetKnowledgeCache(): void {
  cached = null
  loading = null
}
