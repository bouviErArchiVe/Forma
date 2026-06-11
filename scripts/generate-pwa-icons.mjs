/**
 * Génère icon-192.png et icon-512.png pour la PWA (fond bleu Forma).
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { createCanvas } from '@napi-rs/canvas'
import { writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

async function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#2563eb'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(size * 0.42)}px Segoe UI, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('F', size / 2, size / 2 + size * 0.02)
  return canvas.encode('png')
}

for (const size of [192, 512]) {
  const buf = await drawIcon(size)
  writeFileSync(join(root, `icon-${size}.png`), buf)
  console.log(`Wrote public/icon-${size}.png`)
}
