import { fmt, parseNum } from '@/lib/formulas/units'

function ok(rows, summary) {
  return { rows, summary, verdict: { id: 'ok', label: 'Calculé', color: '#2d6a4f' } }
}

export function loadTotal(v) {
  const g = parseNum(v.permanent)
  const q = parseNum(v.exploitation)
  if (g == null || q == null) return { error: 'Charges permanentes et d\'exploitation requises.' }
  const total = g + q
  return ok([{ label: 'Charge totale', value: `${fmt(total)} kN/m²` }], `G + Q = ${fmt(total)} kN/m²`)
}

export function loadCombination(v) {
  const g = parseNum(v.permanent)
  const q = parseNum(v.exploitation)
  const psi = parseNum(v.psi) ?? 1
  if (g == null || q == null) return { error: 'G et Q requis.' }
  const u = g + psi * q
  return ok([
    { label: 'Combinaison ULS simple', value: `${fmt(u)} kN/m²` },
    { label: 'Facteur ψ', value: fmt(psi) },
  ], `U = G + ψQ = ${fmt(u)} kN/m²`)
}

export function linearLoad(v) {
  const q = parseNum(v.surfaceLoad)
  const w = parseNum(v.tributaryWidth)
  if (q == null || w == null) return { error: 'Charge surfacique et largeur tributaire requises.' }
  const ql = q * w
  return ok([{ label: 'Charge linéaire', value: `${fmt(ql)} kN/m` }], `q × l = ${fmt(ql)} kN/m`)
}

export function kpaToLinear(v) {
  const kpa = parseNum(v.kpa)
  const w = parseNum(v.tributaryWidth)
  if (kpa == null || w == null) return { error: 'kPa et largeur tributaire requis.' }
  const ql = kpa * w
  return ok([
    { label: 'Charge linéaire', value: `${fmt(ql)} kN/m` },
    { label: 'Équivalent', value: `${fmt(kpa)} kN/m²` },
  ], `${fmt(kpa)} kPa × ${fmt(w)} m = ${fmt(ql)} kN/m`)
}

export function convertForce(v) {
  const val = parseNum(v.value)
  if (val == null) return { error: 'Valeur requise.' }
  const from = v.from || 'kN'
  const n = from === 'N' ? val : val * 1000
  const kn = n / 1000
  return ok([
    { label: 'Newtons', value: `${fmt(n)} N` },
    { label: 'Kilonewtons', value: `${fmt(kn)} kN` },
  ], `${fmt(val)} ${from}`)
}

export function convertPressure(v) {
  const val = parseNum(v.value)
  if (val == null) return { error: 'Valeur requise.' }
  const from = v.from || 'kPa'
  let pa = val
  if (from === 'kPa') pa = val * 1000
  if (from === 'MPa') pa = val * 1e6
  return ok([
    { label: 'Pa', value: `${fmt(pa)} Pa` },
    { label: 'kPa', value: `${fmt(pa / 1000)} kPa` },
    { label: 'MPa', value: `${fmt(pa / 1e6)} MPa` },
  ], `Conversion depuis ${fmt(val)} ${from}`)
}

export function beamMoment(v) {
  const q = parseNum(v.load)
  const L = parseNum(v.span)
  if (q == null || L == null) return { error: 'Charge et portée requises.' }
  const M = (q * L * L) / 8
  return ok([{ label: 'Moment max.', value: `${fmt(M)} kN·m` }], `M = qL²/8 = ${fmt(M)} kN·m`)
}

export function beamShear(v) {
  const q = parseNum(v.load)
  const L = parseNum(v.span)
  if (q == null || L == null) return { error: 'Charge et portée requises.' }
  const V = (q * L) / 2
  return ok([{ label: 'Effort tranchant max.', value: `${fmt(V)} kN` }], `V = qL/2 = ${fmt(V)} kN`)
}

export function beamReaction(v) {
  const q = parseNum(v.load)
  const L = parseNum(v.span)
  if (q == null || L == null) return { error: 'Charge et portée requises.' }
  const R = (q * L) / 2
  return ok([{ label: 'Réaction appui', value: `${fmt(R)} kN` }], `R = qL/2 = ${fmt(R)} kN`)
}

export function normalStress(v) {
  const n = parseNum(v.force)
  const a = parseNum(v.area)
  if (n == null || a == null || a === 0) return { error: 'Effort N et section A requis (A ≠ 0).' }
  const sigma = (n * 1000) / (a * 1e-6) / 1e6
  return ok([{ label: 'Contrainte σ', value: `${fmt(sigma)} MPa` }], `σ = N/A = ${fmt(sigma)} MPa (N en kN, A en mm²)`)
}

export function shearStress(v) {
  const vForce = parseNum(v.shear)
  const a = parseNum(v.area)
  if (vForce == null || a == null || a === 0) return { error: 'Effort V et section A requis.' }
  const tau = (vForce * 1000) / (a * 1e-6) / 1e6
  return ok([{ label: 'Cisaillement τ', value: `${fmt(tau)} MPa` }], `τ = V/A = ${fmt(tau)} MPa`)
}

export function simpleDeflection(v) {
  const q = parseNum(v.load)
  const L = parseNum(v.span)
  const E = parseNum(v.modulus) ?? 210000
  const I = parseNum(v.inertia)
  if (q == null || L == null || I == null) return { error: 'q, L et I requis.' }
  const w = q
  const delta = (w * Math.pow(L, 4)) / (384 * E * I)
  const deltaMm = delta * 1000
  return ok([{ label: 'Flèche max.', value: `${fmt(deltaMm)} mm` }], `δ = qL⁴/(384EI) ≈ ${fmt(deltaMm)} mm`)
}

export function rectArea(v) {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  if (l == null || w == null) return { error: 'Longueur et largeur requises.' }
  const s = l * w
  return ok([{ label: 'Surface', value: `${fmt(s)} m²` }], `S = L × l = ${fmt(s)} m²`)
}

export function tributaryArea(v) {
  return rectArea(v)
}

export function volumeRect(v) {
  const l = parseNum(v.length)
  const w = parseNum(v.width)
  const h = parseNum(v.height)
  if (l == null || w == null || h == null) return { error: 'Dimensions L, l, h requises.' }
  const vol = l * w * h
  return ok([{ label: 'Volume', value: `${fmt(vol)} m³` }], `V = L × l × h = ${fmt(vol)} m³`)
}

export function weightVolume(v) {
  const vol = parseNum(v.volume)
  const rho = parseNum(v.density)
  if (vol == null || rho == null) return { error: 'Volume et masse volumique requis.' }
  const p = vol * rho
  return ok([{ label: 'Poids', value: `${fmt(p)} kg` }], `P = V × ρ = ${fmt(p)} kg`)
}

export function pointLoadMoment(v) {
  const P = parseNum(v.load)
  const L = parseNum(v.span)
  const a = parseNum(v.distance)
  if (P == null || L == null || a == null) return { error: 'P, L et distance a requis.' }
  const b = L - a
  const R1 = (P * b) / L
  const Mmax = R1 * a
  return ok([
    { label: 'Réaction R1', value: `${fmt(R1)} kN` },
    { label: 'Moment max. (approx.)', value: `${fmt(Mmax)} kN·m` },
  ], `Charge ponctuelle P=${fmt(P)} kN sur portée ${fmt(L)} m`)
}

export function distributedLoad(v) {
  const q = parseNum(v.load)
  const L = parseNum(v.span)
  if (q == null || L == null) return { error: 'Charge q et portée L requises.' }
  const total = q * L
  return ok([
    { label: 'Charge totale', value: `${fmt(total)} kN` },
    { label: 'Moment max.', value: `${fmt((q * L * L) / 8)} kN·m` },
    { label: 'Effort tranchant max.', value: `${fmt((q * L) / 2)} kN` },
  ], `Charge répartie q=${fmt(q)} kN/m sur ${fmt(L)} m`)
}
