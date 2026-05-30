/** Traduction — providers: api | browser (en ligne) | mock (démo). */

export const TRANSLATION_LANGUAGES = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'Anglais' },
] as const

export const TRANSLATION_PROVIDERS = {
  api: 'API configurée',
  browser: 'Traduction en ligne',
  mock: 'Mode démo (limité)',
} as const

const CHUNK_SIZE = 450

export type TranslationProvider = 'api' | 'browser' | 'mock'

export function getTranslationProvider(): TranslationProvider {
  const forced = (import.meta.env.VITE_TRANSLATE_PROVIDER || '').toLowerCase()
  if (forced === 'mock' || forced === 'browser' || forced === 'api') return forced
  if (import.meta.env.VITE_TRANSLATE_API_URL) return 'api'
  return 'browser'
}

export function getTranslationText(result: string | { text?: string } | null | undefined): string {
  if (!result) return ''
  if (typeof result === 'string') return result.replace(/\n\n—[\s\S]*$/, '').trim()
  return String(result.text || '').trim()
}

function splitText(text: string, maxLen = CHUNK_SIZE): string[] {
  if (text.length <= maxLen) return [text]
  const parts: string[] = []
  let rest = text
  while (rest.length > maxLen) {
    let cut = rest.lastIndexOf('\n', maxLen)
    if (cut < maxLen * 0.4) cut = rest.lastIndexOf('. ', maxLen)
    if (cut < maxLen * 0.4) cut = rest.lastIndexOf(' ', maxLen)
    if (cut < 1) cut = maxLen
    parts.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) parts.push(rest)
  return parts.filter(Boolean)
}

async function translateApi(text: string, from: string, to: string, mode: string): Promise<string> {
  const apiUrl = import.meta.env.VITE_TRANSLATE_API_URL
  if (!apiUrl) throw new Error('VITE_TRANSLATE_API_URL non configurée')

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source: from, target: to, format: 'text', mode }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(body || `API HTTP ${res.status}`)
  }

  const data = (await res.json()) as { translatedText?: string; translation?: string; text?: string }
  const out = data.translatedText || data.translation || data.text
  if (!out?.trim()) throw new Error('Réponse API vide')
  return out.trim()
}

async function translateMyMemory(text: string, from: string, to: string): Promise<string> {
  const chunks = splitText(text)
  const out: string[] = []

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i]
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)

    const data = (await res.json()) as { responseData?: { translatedText?: string }; responseDetails?: string }
    const translated = data?.responseData?.translatedText
    if (!translated?.trim()) {
      throw new Error(data?.responseDetails || 'MyMemory : réponse vide')
    }
    if (/MYMEMORY WARNING|QUOTA|LIMIT/i.test(translated)) {
      throw new Error('Quota traduction en ligne dépassé — réessayez plus tard')
    }
    out.push(translated.trim())
    if (chunks.length > 1 && i < chunks.length - 1) {
      await new Promise((r) => setTimeout(r, 350))
    }
  }

  return out.join('\n')
}

async function translateLibreTranslate(text: string, from: string, to: string): Promise<string> {
  const endpoints = [
    import.meta.env.VITE_LIBRETRANSLATE_URL,
    'https://libretranslate.com/translate',
  ].filter(Boolean) as string[]

  let lastErr: Error | null = null
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
      })
      if (!res.ok) throw new Error(`LibreTranslate HTTP ${res.status}`)
      const data = (await res.json()) as { translatedText?: string }
      if (!data?.translatedText?.trim()) throw new Error('LibreTranslate : réponse vide')
      return data.translatedText.trim()
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err))
    }
  }
  throw lastErr || new Error('LibreTranslate indisponible')
}

async function translateBrowser(text: string, from: string, to: string): Promise<string> {
  try {
    return await translateMyMemory(text, from, to)
  } catch (errMy) {
    try {
      return await translateLibreTranslate(text, from, to)
    } catch (errLib) {
      const a = errMy instanceof Error ? errMy.message : String(errMy)
      const b = errLib instanceof Error ? errLib.message : String(errLib)
      throw new Error(`${a} · ${b}`)
    }
  }
}

const WORDS_EN_FR: Record<string, string> = {
  hello: 'bonjour',
  world: 'monde',
  school: 'école',
  building: 'bâtiment',
  architecture: 'architecture',
  architect: 'architecte',
  project: 'projet',
  wall: 'mur',
  floor: 'étage',
  roof: 'toiture',
  facade: 'façade',
  beam: 'poutre',
  column: 'colonne',
  foundation: 'fondation',
  structure: 'structure',
  slab: 'dalle',
  concrete: 'béton',
  steel: 'acier',
  glass: 'verre',
  wood: 'bois',
  brick: 'brique',
  insulation: 'isolation',
  ventilation: 'ventilation',
  thermal: 'thermique',
  acoustic: 'acoustique',
  energy: 'énergie',
  sustainable: 'durable',
  renovation: 'rénovation',
  blueprint: 'plan',
  elevation: 'élévation',
  section: 'coupe',
  scale: 'échelle',
  dimension: 'dimension',
  material: 'matériau',
  load: 'charge',
  bearing: 'porteur',
  window: 'fenêtre',
  door: 'porte',
  staircase: 'escalier',
  corridor: 'couloir',
  room: 'pièce',
  space: 'espace',
  urban: 'urbain',
  landscape: 'paysage',
  site: 'site',
  permit: 'permis',
  regulation: 'réglementation',
  detail: 'détail',
  sketch: 'esquisse',
  drawing: 'dessin',
  model: 'maquette',
}

function mockTranslate(text: string, from: string, to: string): string {
  if (from === to) return text
  if (from === 'en' && to === 'fr') {
    return text.replace(/\b[\w'-]+\b/gi, (word) => WORDS_EN_FR[word.toLowerCase()] || word)
  }
  if (from === 'fr' && to === 'en') {
    const reverse = Object.fromEntries(Object.entries(WORDS_EN_FR).map(([k, v]) => [v, k]))
    return text.replace(/\b[\w'-àâäéèêëïîôùûüç]+/gi, (word) => reverse[word.toLowerCase()] || word)
  }
  return text
}

export interface TranslationResult {
  text: string
  provider: TranslationProvider | string
  isDemo: boolean
  error?: string
  warning?: string
}

export async function translateText(
  text: string,
  { from = 'en', to = 'fr', mode = 'standard' }: { from?: string; to?: string; mode?: string } = {},
): Promise<TranslationResult> {
  const trimmed = String(text || '').trim()
  if (!trimmed) {
    return { text: '', provider: getTranslationProvider(), isDemo: false, error: 'Texte source vide' }
  }
  if (from === to) {
    return { text: trimmed, provider: getTranslationProvider(), isDemo: false }
  }

  const provider = getTranslationProvider()

  if (provider === 'mock') {
    return {
      text: mockTranslate(trimmed, from, to),
      provider: 'mock',
      isDemo: true,
      warning:
        'Mode démo : traduction mot à mot uniquement. Configurez VITE_TRANSLATE_PROVIDER=browser ou une API pour une vraie traduction.',
    }
  }

  if (provider === 'api') {
    try {
      const out = await translateApi(trimmed, from, to, mode)
      return { text: out, provider: 'api', isDemo: false }
    } catch (err) {
      return {
        text: '',
        provider: 'api',
        isDemo: false,
        error: err instanceof Error ? err.message : 'Erreur API de traduction',
      }
    }
  }

  try {
    const out = await translateBrowser(trimmed, from, to)
    return { text: out, provider: 'browser', isDemo: false }
  } catch (err) {
    return {
      text: '',
      provider: 'browser',
      isDemo: false,
      error: err instanceof Error ? err.message : 'Traduction en ligne indisponible. Vérifiez votre connexion.',
    }
  }
}
