/**
 * CLI dev : simulation d'import d'un pack Knowledge (Sprint #9).
 *
 * Usage : npm run knowledge:import [chemin/vers/pack.json]
 * Défaut : src/data/knowledge/test-packs/sprint9-smoke.json
 *
 * Valide le pack, le confronte à la base existante (doublons), classe la
 * provenance et mesure la qualité, puis imprime un rapport. NE MODIFIE RIEN :
 * les entrées acceptées sont des CANDIDATS à promouvoir manuellement. Outil
 * DEV uniquement — hors bundle application.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadKnowledgeBase } from '../src/lib/knowledge/load'
import { importPack } from '../src/lib/knowledge/import-pack'

const DEFAULT_PACK = 'src/data/knowledge/test-packs/sprint9-smoke.json'

async function main() {
  const packPath = process.argv[2] ?? DEFAULT_PACK
  const raw = JSON.parse(readFileSync(resolve(packPath), 'utf8'))
  if (!Array.isArray(raw)) {
    throw new Error('Le pack doit être un tableau JSON d’entrées.')
  }

  const existing = await loadKnowledgeBase()
  const report = importPack(raw, existing)

  console.log(`\n=== Import pack : ${packPath} ===`)
  console.log(`Base existante : ${existing.length} entrées · pack : ${report.packTotal} entrées`)
  console.log(`\nAcceptés (candidats) : ${report.summary.accepted}`)
  console.log(`Rejetés              : ${report.summary.rejected}`)
  console.log(`Doublons (vs base)   : ${report.summary.duplicates}`)
  console.log(`Faibles parmi acceptés : ${report.summary.weak}`)

  console.log('\n— Provenance des acceptés —')
  for (const [p, n] of Object.entries(report.summary.byProvenance)) console.log(`  ${p.padEnd(11)} ${n}`)
  console.log('— Statut qualité des acceptés —')
  for (const [s, n] of Object.entries(report.summary.byStatus)) console.log(`  ${s.padEnd(7)} ${n}`)

  if (report.rejected.length) {
    console.log('\n— Rejetés —')
    for (const r of report.rejected) {
      console.log(`  ✗ ${r.id || '(sans id)'} : ${r.errors.map((e) => `${e.field}: ${e.message}`).join(' | ')}`)
    }
  }

  if (report.duplicatesAgainstBase.length) {
    console.log('\n— Doublons contre la base —')
    for (const d of report.duplicatesAgainstBase) {
      console.log(`  ≈ ${d.id} (${d.term}) → ${d.reason} vs ${d.against} [${d.detail}]`)
    }
  }

  if (report.accepted.length) {
    console.log('\n— Candidats acceptés —')
    for (const a of report.accepted) {
      console.log(`  + ${a.entry.term} [${a.provenance} · ${a.quality.status} ${a.quality.score}] ${a.quality.flags.join(', ')}`)
    }
  }

  console.log('\nAucune entrée n’a été ajoutée à la base (promotion manuelle requise).\n')
}

main().catch((err) => {
  console.error('knowledge:import a échoué :', err)
  process.exitCode = 1
})
