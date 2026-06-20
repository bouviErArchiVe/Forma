/**
 * CLI dev : rapport de qualité de la base Knowledge (Sprint #9).
 *
 * Usage : npm run knowledge:quality
 * Lit la base réelle (loader paresseux) et imprime un rapport agrégé
 * (statuts, domaines, types, confidence, provenance, doublons, entrées faibles).
 * Outil DEV uniquement — n'est PAS inclus dans le bundle de l'application.
 */
import { loadKnowledgeBase } from '../src/lib/knowledge/load'
import { buildQualityReport } from '../src/lib/knowledge/quality-report'

function bar(n: number, total: number, width = 24): string {
  const filled = total > 0 ? Math.round((n / total) * width) : 0
  return '█'.repeat(filled) + '·'.repeat(width - filled)
}

async function main() {
  const entries = await loadKnowledgeBase()
  const r = buildQualityReport(entries, { weakSampleSize: 15 })

  console.log('\n=== Forma Knowledge — Rapport qualité ===')
  console.log(`Total entrées : ${r.total}   Score moyen : ${r.averageScore}`)

  console.log('\n— Statut qualité —')
  for (const s of ['ok', 'weak', 'review'] as const) {
    console.log(`  ${s.padEnd(7)} ${String(r.byStatus[s]).padStart(4)}  ${bar(r.byStatus[s], r.total)}`)
  }

  console.log('\n— Provenance —')
  for (const [p, n] of Object.entries(r.byProvenance)) {
    console.log(`  ${p.padEnd(11)} ${String(n).padStart(4)}`)
  }

  console.log('\n— Confidence —')
  for (const [c, n] of Object.entries(r.byConfidence)) {
    console.log(`  ${c.padEnd(11)} ${String(n).padStart(4)}`)
  }

  console.log('\n— Flags qualité —')
  for (const [f, n] of Object.entries(r.byFlag).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${f.padEnd(18)} ${String(n).padStart(4)}`)
  }

  console.log('\n— Par domaine (total / weak / review) —')
  for (const [d, v] of Object.entries(r.byDomain).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${d.padEnd(24)} ${String(v.total).padStart(4)} / ${String(v.weak).padStart(4)} / ${String(v.review).padStart(4)}`)
  }

  console.log('\n— Par type —')
  for (const [t, n] of Object.entries(r.byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${t.padEnd(20)} ${String(n).padStart(4)}`)
  }

  console.log('\n— Doublons —')
  console.log(`  exacts : ${r.duplicates.exact}   quasi : ${r.duplicates.near}   entrées impliquées : ${r.duplicates.involved}`)

  console.log('\n— Échantillon d’entrées faibles (score croissant) —')
  for (const w of r.weakSamples) {
    console.log(`  [${w.score.toFixed(2)} ${w.status}] ${w.term} (${w.domain}/${w.type})  ${w.flags.join(', ')}`)
  }
  console.log('')
}

main().catch((err) => {
  console.error('knowledge:quality a échoué :', err)
  process.exitCode = 1
})
