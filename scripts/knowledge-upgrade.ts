/**
 * CLI dev : applique une résolution de doublons + un upgrade pack aux seeds,
 * en RÉÉCRIVANT les fichiers JSON, et imprime la qualité avant/après (Sprint #10).
 *
 * Usage :
 *   npm run knowledge:upgrade          (applique et écrit les seeds)
 *   npm run knowledge:upgrade -- --dry (rapport seulement, n'écrit rien)
 *
 * Entrées (traçables, versionnées) :
 *   src/data/knowledge/upgrades/dedup-plan.json     (résolutions explicites)
 *   src/data/knowledge/upgrades/upgrade-pack-01.json (patchs d'enrichissement)
 *
 * Tout passe par le pipeline Sprint #9/#10 : validation stricte, pas de
 * suppression auto (les `merge` sont des décisions explicites du plan), qualité
 * mesurée avant/après. Outil DEV — hors bundle application.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { KnowledgeEntry } from '../src/lib/knowledge/model'
import { buildQualityReport } from '../src/lib/knowledge/quality-report'
import { findDuplicates } from '../src/lib/knowledge/dedup'
import { applyDedupPlan, type DedupResolution } from '../src/lib/knowledge/dedup-resolve'
import { applyUpgradePack, type UpgradePatch } from '../src/lib/knowledge/upgrade'

const SEEDS_DIR = 'src/data/knowledge/seeds'
const UP_DIR = 'src/data/knowledge/upgrades'
const PLAN_PATH = `${UP_DIR}/dedup-plan.json`
const PACK_PATH = `${UP_DIR}/upgrade-pack-01.json`

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(resolve(path))) return fallback
  return JSON.parse(readFileSync(resolve(path), 'utf8')) as T
}

function statusLine(label: string, r: { ok: number; weak: number; review: number }) {
  console.log(`  ${label.padEnd(7)} ok=${r.ok}  weak=${r.weak}  review=${r.review}`)
}

function main() {
  const dry = process.argv.includes('--dry')

  // 1) Lecture des seeds (par fichier, ordre préservé) + map id → fichier.
  const files = readdirSync(resolve(SEEDS_DIR)).filter((f) => f.endsWith('.json') && f !== 'manifest.json')
  const fileOf = new Map<string, string>()
  const flat: KnowledgeEntry[] = []
  for (const f of files) {
    const arr = JSON.parse(readFileSync(resolve(SEEDS_DIR, f), 'utf8')) as KnowledgeEntry[]
    for (const e of arr) { fileOf.set(e.id, f); flat.push(e) }
  }

  const plan = readJson<DedupResolution[]>(PLAN_PATH, [])
  const pack = readJson<UpgradePatch[]>(PACK_PATH, [])

  // 2) Rapport AVANT.
  const before = buildQualityReport(flat)
  const dupBefore = findDuplicates(flat)

  // 3) Résolution doublons → upgrade pack.
  const dd = applyDedupPlan(flat, plan)
  const up = applyUpgradePack(dd.base, pack)
  const finalBase = up.base

  // 4) Rapport APRÈS.
  const after = buildQualityReport(finalBase)
  const dupAfter = findDuplicates(finalBase)

  console.log(`\n=== knowledge:upgrade ${dry ? '(DRY)' : ''} ===`)
  console.log(`Seeds : ${flat.length} entrées · plan : ${plan.length} résolutions · upgrade : ${pack.length} patchs`)

  console.log('\n— Doublons —')
  console.log(`  avant : exacts=${dupBefore.exact.length} quasi=${dupBefore.near.length} impliquées=${dupBefore.involved}`)
  console.log(`  après : exacts=${dupAfter.exact.length} quasi=${dupAfter.near.length} impliquées=${dupAfter.involved}`)
  console.log(`  merges=${dd.merged.length} distinguish=${dd.distinguished.length} manquants=${dd.missing.length}`)
  if (dd.missing.length) console.log('  ⚠ ids manquants :', dd.missing.join(', '))

  console.log('\n— Upgrade pack —')
  console.log(`  appliqués=${up.applied.length} inconnus=${up.unknownIds.length} invalides=${up.invalid.length} → ok gagnés=${up.improvedToOk}`)
  if (up.unknownIds.length) console.log('  ⚠ ids inconnus :', up.unknownIds.join(', '))
  for (const inv of up.invalid) console.log(`  ✗ ${inv.id} : ${inv.errors.map((e) => e.field).join(', ')}`)

  console.log('\n— Qualité (statuts) —')
  statusLine('avant', before.byStatus)
  statusLine('après', after.byStatus)
  console.log(`  score moyen : ${before.averageScore} → ${after.averageScore}`)

  // 5) Écriture des seeds (sauf --dry).
  if (dry) {
    console.log('\n(DRY) aucun fichier écrit.\n')
    return
  }
  const byId = new Map(finalBase.map((e) => [e.id, e]))
  let written = 0
  for (const f of files) {
    const original = JSON.parse(readFileSync(resolve(SEEDS_DIR, f), 'utf8')) as KnowledgeEntry[]
    const next = original.filter((e) => byId.has(e.id)).map((e) => byId.get(e.id) as KnowledgeEntry)
    writeFileSync(resolve(SEEDS_DIR, f), JSON.stringify(next, null, 2) + '\n', 'utf8')
    written += next.length
  }
  console.log(`\nSeeds réécrits : ${written} entrées dans ${files.length} fichiers.\n`)
}

main()
