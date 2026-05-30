/** Traduction — providers : api | browser (en ligne) | mock (démo hors-ligne). */

type Env = Record<string, string | undefined>
const env = (import.meta.env ?? {}) as Env

export interface TranslationLanguage {
  id: string
  label: string
}

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'Anglais' },
]

export type TranslationProvider = 'api' | 'browser' | 'mock'

export const TRANSLATION_PROVIDERS: Record<TranslationProvider, string> = {
  api: 'API configurée',
  browser: 'Traduction en ligne (MyMemory / LibreTranslate)',
  mock: 'Mode démo hors-ligne (mot à mot)',
}

const CHUNK_SIZE = 450

export function getTranslationProvider(): TranslationProvider {
  const forced = (env.VITE_TRANSLATE_PROVIDER || '').toLowerCase()
  if (forced === 'mock' || forced === 'browser' || forced === 'api') return forced
  if (env.VITE_TRANSLATE_API_URL) return 'api'
  return 'browser'
}

export function getTranslationText(result: string | { text?: string } | null | undefined): string {
  if (!result) return ''
  if (typeof result === 'string') return result.replace(/\n\n—[\s\S]*$/, '').trim()
  return String(result.text || '').trim()
}

export function splitText(text: string, maxLen = CHUNK_SIZE): string[] {
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
  const apiUrl = env.VITE_TRANSLATE_API_URL
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
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunks[i])}&langpair=${from}|${to}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)
    const data = (await res.json()) as { responseData?: { translatedText?: string }; responseDetails?: string }
    const translated = data?.responseData?.translatedText
    if (!translated?.trim()) throw new Error(data?.responseDetails || 'MyMemory : réponse vide')
    if (/MYMEMORY WARNING|QUOTA|LIMIT/i.test(translated)) {
      throw new Error('Quota traduction en ligne dépassé — réessayez plus tard')
    }
    out.push(translated.trim())
    if (chunks.length > 1 && i < chunks.length - 1) await new Promise((r) => setTimeout(r, 350))
  }
  return out.join('\n')
}

async function translateLibreTranslate(text: string, from: string, to: string): Promise<string> {
  const endpoints = [env.VITE_LIBRETRANSLATE_URL, 'https://libretranslate.com/translate'].filter(
    Boolean,
  ) as string[]
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
  hello: 'bonjour', world: 'monde', school: 'école', building: 'bâtiment',
  architecture: 'architecture', architect: 'architecte', project: 'projet',
  wall: 'mur', floor: 'étage', roof: 'toiture', facade: 'façade', beam: 'poutre',
  column: 'colonne', foundation: 'fondation', structure: 'structure', slab: 'dalle',
  concrete: 'béton', steel: 'acier', glass: 'verre', wood: 'bois', brick: 'brique',
  insulation: 'isolation', ventilation: 'ventilation', thermal: 'thermique',
  acoustic: 'acoustique', energy: 'énergie', sustainable: 'durable', renovation: 'rénovation',
  blueprint: 'plan', elevation: 'élévation', section: 'coupe', scale: 'échelle',
  dimension: 'dimension', material: 'matériau', load: 'charge', bearing: 'porteur',
  window: 'fenêtre', door: 'porte', staircase: 'escalier', corridor: 'couloir',
  room: 'pièce', space: 'espace', urban: 'urbain', landscape: 'paysage',
  site: 'site', permit: 'permis', regulation: 'réglementation', detail: 'détail',
  sketch: 'esquisse', drawing: 'dessin', model: 'maquette',
  fire: 'feu', resistant: 'résistant', help: 'aide', need: 'besoin', with: 'avec',
  my: 'mon', the: 'le', a: 'un', and: 'et', must: 'doit', be: 'être', design: 'conception',
  construction: 'construction', framework: 'ossature', cladding: 'bardage',
  waterproofing: 'étanchéité', humidity: 'humidité', lighting: 'éclairage',
  circulation: 'circulation', accessibility: 'accessibilité', parking: 'stationnement',
  basement: 'sous-sol', attic: 'combles', balcony: 'balcon', terrace: 'terrasse',
  courtyard: 'cour', garden: 'jardin', height: 'hauteur', width: 'largeur', depth: 'profondeur',
}

export function mockTranslate(text: string, from: string, to: string): string {
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

export interface TranslateOptions {
  from?: string
  to?: string
  mode?: string
}

export interface TranslateResult {
  text: string
  provider: TranslationProvider
  isDemo: boolean
  error?: string
  warning?: string
}

export async function translateText(
  text: string,
  { from = 'en', to = 'fr', mode = 'standard' }: TranslateOptions = {},
): Promise<TranslateResult> {
  const trimmed = String(text || '').trim()
  const provider = getTranslationProvider()
  if (!trimmed) return { text: '', provider, isDemo: false, error: 'Texte source vide' }
  if (from === to) return { text: trimmed, provider, isDemo: false }

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
      return { text: await translateApi(trimmed, from, to, mode), provider: 'api', isDemo: false }
    } catch (err) {
      return { text: '', provider: 'api', isDemo: false, error: err instanceof Error ? err.message : 'Erreur API de traduction' }
    }
  }

  try {
    return { text: await translateBrowser(trimmed, from, to), provider: 'browser', isDemo: false }
  } catch (err) {
    return {
      text: '',
      provider: 'browser',
      isDemo: false,
      error: err instanceof Error ? err.message : 'Traduction en ligne indisponible. Vérifiez votre connexion.',
    }
  }
}
