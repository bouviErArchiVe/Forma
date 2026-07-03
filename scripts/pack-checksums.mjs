/**
 * CLI dev : génère les checksums SHA-256 RÉELS du Resource Pack (Sprint #28)
 * et les inscrit dans `offline_manifest.json` (section `checksums`).
 *
 * Usage : npm run knowledge:pack-checksums
 *
 * Règles :
 *  - hash calculé sur les OCTETS EXACTS du fichier sur disque (Buffer) — c'est
 *    ce que sert le serveur (les fichiers sont `-text` dans .gitattributes :
 *    aucune conversion EOL possible, LF garanti sur tout clone) ;
 *  - `createdAt` du manifeste N'EST PAS modifié (clé d'idempotence des imports :
 *    la changer forcerait un réimport global chez les utilisateurs existants) ;
 *  - clés de `checksums` = noms de fichiers nus, exactement ceux utilisés par
 *    l'import (`forma_dictionary_core.json`, …) ;
 *  - le manifeste lui-même n'est jamais hashé (il se contiendrait).
 *
 * À RELANCER après toute modification d'un fichier du pack (sinon l'import
 * échouera fail-safe sur PackChecksumError, sans rien écrire dans Dexie).
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const APP_DIR = 'public/knowledge-pack/part10/data/app'
const MANIFEST = 'offline_manifest.json'

const files = readdirSync(APP_DIR)
  .filter((f) => f.endsWith('.json') && f !== MANIFEST)
  .sort()

const manifestPath = join(APP_DIR, MANIFEST)
// Octets exacts du manifeste pour préserver sa mise en forme hors `checksums`.
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const previous = manifest.checksums ?? {}

const checksums = {}
console.log('\n=== knowledge:pack-checksums ===')
console.log(`Dossier : ${APP_DIR}\n`)
for (const f of files) {
  const bytes = readFileSync(join(APP_DIR, f)) // Buffer : octets exacts, aucune conversion texte
  const sha = createHash('sha256').update(bytes).digest('hex')
  checksums[f] = sha
  const size = statSync(join(APP_DIR, f)).size
  const status = previous[f] === undefined ? 'nouveau' : previous[f] === sha ? 'inchangé' : 'MODIFIÉ'
  console.log(`  ${f.padEnd(46)} ${String(size).padStart(9)} o  sha256=${sha.slice(0, 16)}…  ${status}`)
}

manifest.checksums = checksums
// createdAt volontairement intact (idempotence des imports existants).
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8')
console.log(`\n${files.length} checksums écrits dans ${manifestPath} (createdAt inchangé : ${manifest.createdAt})\n`)
