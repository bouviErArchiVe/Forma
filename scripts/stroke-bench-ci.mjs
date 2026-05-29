#!/usr/bin/env node
/**
 * Benchmark non bloquant pour CI — warning si seuil dépassé.
 * Exit 0 toujours (ne bloque pas les merges).
 */
import { appendFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'

const LEVELS = [1000, 5000, 10_000]
const WARN_MS = { 1000: 80, 5000: 200, 10_000: 500 }
const WARN_SEGMENTS = 12_000

function estimateSegments(strokeCount) {
  let cost = 0
  for (let i = 0; i < strokeCount; i++) {
    cost += 11
  }
  return cost
}

const warnings = []
const results = []

for (const n of LEVELS) {
  const t0 = performance.now()
  const segments = estimateSegments(n)
  const elapsedMs = Math.round(performance.now() - t0)
  results.push({ strokeCount: n, segments, elapsedMs })
  if (elapsedMs > WARN_MS[n]) {
    warnings.push(`stroke-bench: ${n} strokes took ${elapsedMs}ms (warn > ${WARN_MS[n]}ms)`)
  }
}

const maxSeg = results[results.length - 1]?.segments ?? 0
if (maxSeg > WARN_SEGMENTS) {
  warnings.push(`stroke-bench: segment estimate ${maxSeg} > ${WARN_SEGMENTS}`)
}

console.log('Stroke bench (CI advisory):')
for (const r of results) {
  console.log(`  ${r.strokeCount} strokes → ${r.segments} segments, ${r.elapsedMs}ms`)
}

if (warnings.length) {
  console.log('\n::warning::' + warnings.join('\n::warning::'))
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `### Stroke bench warnings\n${warnings.map((w) => `- ${w}`).join('\n')}\n`,
    )
  }
} else {
  console.log('All stroke bench levels within advisory thresholds.')
}

process.exit(0)
