/** Traduction — mock local + API optionnelle (VITE_TRANSLATE_API_URL). */

export const TRANSLATION_LANGUAGES = [
  { id: 'en', label: 'Anglais' },
  { id: 'fr', label: 'Français' },
]

const WORDS_EN_FR = {
  hello: 'bonjour',
  world: 'monde',
  school: 'école',
  building: 'bâtiment',
  architecture: 'architecture',
  design: 'design',
  floor: 'étage',
  plan: 'plan',
  section: 'coupe',
  elevation: 'élévation',
  wall: 'mur',
  window: 'fenêtre',
  door: 'porte',
  roof: 'toiture',
  beam: 'poutre',
  column: 'colonne',
  concrete: 'béton',
  steel: 'acier',
  wood: 'bois',
  drawing: 'dessin',
  sketch: 'esquisse',
  project: 'projet',
  homework: 'devoir',
  assignment: 'consigne',
  document: 'document',
  please: 'veuillez',
  read: 'lire',
  write: 'écrire',
  submit: 'rendre',
  due: 'échéance',
  week: 'semaine',
  scale: 'échelle',
  dimension: 'dimension',
  height: 'hauteur',
  width: 'largeur',
  length: 'longueur',
  the: 'le',
  a: 'un',
  an: 'un',
  and: 'et',
  or: 'ou',
  of: 'de',
  to: 'à',
  in: 'dans',
  on: 'sur',
  for: 'pour',
  with: 'avec',
  this: 'ce',
  that: 'cette',
  is: 'est',
  are: 'sont',
  was: 'était',
  will: 'sera',
  must: 'doit',
  should: 'devrait',
  can: 'peut',
}

const ADVANCED_EN_FR = {
  ...WORDS_EN_FR,
  fenestration: 'fenêtrage',
  cantilever: 'console',
  cladding: 'bardage',
  egress: 'issue de secours',
  occupancy: 'occupation',
  load: 'charge',
  bearing: 'porteur',
  foundation: 'fondation',
  insulation: 'isolation',
  sustainability: 'durabilité',
  envelope: 'enveloppe',
  circulation: 'circulation',
  program: 'programme',
  brief: 'cahier des charges',
  precedent: 'précédent',
  iteration: 'itération',
  threshold: 'seuil',
  datum: 'référence',
  axis: 'axe',
  grid: 'trame',
  module: 'module',
  typology: 'typologie',
}

function mockTranslate(text, from, to, mode) {
  if (!text?.trim()) return ''
  if (from === to) return text

  const dict = mode === 'advanced' && from === 'en' && to === 'fr' ? ADVANCED_EN_FR : WORDS_EN_FR

  if (from === 'en' && to === 'fr') {
    const out = text.replace(/\b[\w'-]+\b/gi, (word) => {
      const key = word.toLowerCase()
      return dict[key] || word
    })
    return `${out}\n\n— Traduction locale (mode ${mode === 'advanced' ? 'avancé' : 'base'}). Branchez VITE_TRANSLATE_API_URL pour une API.`
  }

  if (from === 'fr' && to === 'en') {
    const reverse = Object.fromEntries(Object.entries(dict).map(([k, v]) => [v, k]))
    const out = text.replace(/\b[\w'-àâäéèêëïîôùûüç]+/gi, (word) => {
      const key = word.toLowerCase()
      return reverse[key] || word
    })
    return `${out}\n\n— Local reverse dictionary (basic).`
  }

  return `[${from} → ${to}] ${text}`
}

export async function translateText(text, { from = 'en', to = 'fr', mode = 'standard' } = {}) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return ''

  const apiUrl = import.meta.env.VITE_TRANSLATE_API_URL
  if (apiUrl) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: trimmed, source: from, target: to, format: 'text', mode }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.translatedText) return data.translatedText
        if (data.translation) return data.translation
      }
    } catch (err) {
      console.warn('[translation] API fallback to mock', err)
    }
  }

  await new Promise((r) => setTimeout(r, 120))
  return mockTranslate(trimmed, from, to, mode)
}
