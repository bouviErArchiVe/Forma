/** Profilés structurels EU — catalogue + conversion vers entrées bibliothèque. */

export const PROFILE_TYPES = [
  { id: 'HEA', label: 'HEA (égal)' },
  { id: 'HEB', label: 'HEB (large)' },
  { id: 'IPE', label: 'IPE' },
  { id: 'WLS', label: 'WLS (soudé)' },
  { id: 'HSS', label: 'HSS (tube)' },
]

/** Profilés standards EU (dimensions mm). */
export const EU_STEEL_PROFILES = [
  { id: 'hea100', l: 'HEA 100', profileType: 'HEA', w: 96, h: 100, ft: 8, wt: 5 },
  { id: 'hea120', l: 'HEA 120', profileType: 'HEA', w: 110, h: 120, ft: 8, wt: 5 },
  { id: 'hea140', l: 'HEA 140', profileType: 'HEA', w: 120, h: 140, ft: 8.5, wt: 5.5 },
  { id: 'hea160', l: 'HEA 160', profileType: 'HEA', w: 130, h: 160, ft: 9, wt: 6 },
  { id: 'hea180', l: 'HEA 180', profileType: 'HEA', w: 140, h: 180, ft: 9.5, wt: 6 },
  { id: 'hea200', l: 'HEA 200', profileType: 'HEA', w: 150, h: 200, ft: 10, wt: 6.5 },
  { id: 'heb100', l: 'HEB 100', profileType: 'HEB', w: 100, h: 100, ft: 10, wt: 6 },
  { id: 'heb120', l: 'HEB 120', profileType: 'HEB', w: 120, h: 120, ft: 11, wt: 6.5 },
  { id: 'heb140', l: 'HEB 140', profileType: 'HEB', w: 140, h: 140, ft: 12, wt: 7 },
  { id: 'heb160', l: 'HEB 160', profileType: 'HEB', w: 160, h: 160, ft: 13, wt: 8 },
  { id: 'heb180', l: 'HEB 180', profileType: 'HEB', w: 180, h: 180, ft: 14, wt: 8.5 },
  { id: 'heb200', l: 'HEB 200', profileType: 'HEB', w: 200, h: 200, ft: 15, wt: 9 },
  { id: 'ipe80', l: 'IPE 80', profileType: 'IPE', w: 46, h: 80, ft: 5.2, wt: 3.8 },
  { id: 'ipe100', l: 'IPE 100', profileType: 'IPE', w: 55, h: 100, ft: 5.7, wt: 4.1 },
  { id: 'ipe120', l: 'IPE 120', profileType: 'IPE', w: 64, h: 120, ft: 6.3, wt: 4.4 },
  { id: 'ipe140', l: 'IPE 140', profileType: 'IPE', w: 73, h: 140, ft: 6.9, wt: 4.7 },
  { id: 'ipe160', l: 'IPE 160', profileType: 'IPE', w: 82, h: 160, ft: 7.4, wt: 5 },
  { id: 'ipe180', l: 'IPE 180', profileType: 'IPE', w: 91, h: 180, ft: 8, wt: 5.3 },
  { id: 'ipe200', l: 'IPE 200', profileType: 'IPE', w: 100, h: 200, ft: 8.5, wt: 5.6 },
]

export function profileToLibEntry(p) {
  if (p.sketchUrl || p.mode === 'draw') {
    return {
      id: p.id,
      l: p.l || p.name || 'Profil dessiné',
      w: p.w || 100,
      h: p.h || 100,
      fw: p.w || 100,
      type: 'drawn',
      sketchUrl: p.sketchUrl,
      custom: true,
    }
  }
  const type = p.profileType === 'HSS' ? 'hss' : p.profileType === 'WLS' ? 'wls' : 'Ibeam'
  return {
    id: p.id,
    l: p.l || p.name || 'Profil',
    w: p.w,
    h: p.h,
    fw: p.w,
    ft: p.ft ?? p.tf ?? 8,
    wt: p.wt ?? p.tw ?? 5,
    t: p.t ?? 6,
    type,
    profileType: p.profileType,
    custom: !!p.custom,
  }
}

export function customProfileToLibEntry(profile) {
  if (profile.sketchUrl || profile.mode === 'draw') {
    return profileToLibEntry({
      id: profile.id,
      name: profile.name,
      l: profile.name,
      w: profile.w || 100,
      h: profile.h || 100,
      sketchUrl: profile.sketchUrl,
      mode: 'draw',
      custom: true,
    })
  }
  return profileToLibEntry({
    id: profile.id,
    l: profile.name,
    profileType: profile.profileType,
    w: profile.w,
    h: profile.h,
    ft: profile.tf,
    wt: profile.tw,
    t: profile.t,
    custom: true,
  })
}

export function buildCustomProfile({ name, profileType, w, h, tf, tw, t, sketchUrl, mode }) {
  return {
    id: `custom-${Date.now()}`,
    name: (name || 'Profil perso').trim(),
    profileType: profileType || 'HEA',
    w: Math.max(20, Number(w) || 100),
    h: Math.max(20, Number(h) || 100),
    tf: Math.max(2, Number(tf) || 8),
    tw: Math.max(2, Number(tw) || 5),
    t: Math.max(2, Number(t) || 6),
    sketchUrl: sketchUrl || null,
    mode: mode || (sketchUrl ? 'draw' : 'dims'),
    createdAt: new Date().toISOString(),
  }
}

/** Rendu SVG WLS (profilé soudé en I). */
export function renderWlsSvg(el, px, sx, sy) {
  const fw = (el.fw || el.w) * px * sx
  const H = Math.max(el.h * px * sy, 4)
  const ft2 = (el.ft || 8) * px * sy
  const wt2 = (el.wt || 5) * px * Math.min(sx, sy)
  const fill = '#546e7a'
  const stroke = '#37474f'
  return (
    <svg width={fw} height={H} style={{ display: 'block' }}>
      <rect x={0} y={0} width={fw} height={ft2} fill={fill} stroke={stroke} strokeWidth={0.8} />
      <rect x={(fw - wt2) / 2} y={ft2} width={wt2} height={Math.max(H - 2 * ft2, 1)} fill="#607d8b" stroke={stroke} strokeWidth={0.8} />
      <rect x={0} y={H - ft2} width={fw} height={ft2} fill={fill} stroke={stroke} strokeWidth={0.8} />
      <line x1={0} y1={ft2 * 0.5} x2={fw} y2={ft2 * 0.5} stroke="#78909c" strokeWidth={0.4} strokeDasharray="2,2" />
    </svg>
  )
}

export function euProfilesAsLibItems() {
  return EU_STEEL_PROFILES.map((p) => profileToLibEntry(p))
}
