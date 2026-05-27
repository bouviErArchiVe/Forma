/** Traduction — providers: api | browser (en ligne) | mock (démo). */

export const TRANSLATION_LANGUAGES = [
  { id: 'fr', label: 'Français' },
  { id: 'en', label: 'Anglais' },
]

export const TRANSLATION_PROVIDERS = {
  api: 'API configurée',
  browser: 'Traduction en ligne',
  mock: 'Mode démo (limité)',
}

const CHUNK_SIZE = 450

export function getTranslationProvider() {
  const forced = (import.meta.env.VITE_TRANSLATE_PROVIDER || '').toLowerCase()
  if (forced === 'mock' || forced === 'browser' || forced === 'api') return forced
  if (import.meta.env.VITE_TRANSLATE_API_URL) return 'api'
  return 'browser'
}

export function getTranslationText(result) {
  if (!result) return ''
  if (typeof result === 'string') return result.replace(/\n\n—[\s\S]*$/, '').trim()
  return String(result.text || '').trim()
}

function splitText(text, maxLen = CHUNK_SIZE) {
  if (text.length <= maxLen) return [text]
  const parts = []
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

async function translateApi(text, from, to, mode) {
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

  const data = await res.json()
  const out = data.translatedText || data.translation || data.text
  if (!out?.trim()) throw new Error('Réponse API vide')
  return out.trim()
}

async function translateMyMemory(text, from, to) {
  const chunks = splitText(text)
  const out = []

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i]
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`MyMemory HTTP ${res.status}`)

    const data = await res.json()
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

async function translateLibreTranslate(text, from, to) {
  const endpoints = [
    import.meta.env.VITE_LIBRETRANSLATE_URL,
    'https://libretranslate.com/translate',
  ].filter(Boolean)

  let lastErr = null
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
      })
      if (!res.ok) throw new Error(`LibreTranslate HTTP ${res.status}`)
      const data = await res.json()
      if (!data?.translatedText?.trim()) throw new Error('LibreTranslate : réponse vide')
      return data.translatedText.trim()
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr || new Error('LibreTranslate indisponible')
}

async function translateBrowser(text, from, to) {
  try {
    return await translateMyMemory(text, from, to)
  } catch (errMy) {
    try {
      return await translateLibreTranslate(text, from, to)
    } catch (errLib) {
      throw new Error(`${errMy.message} · ${errLib.message}`)
    }
  }
}

const WORDS_EN_FR = {
  hello: 'bonjour', world: 'monde', school: 'école', building: 'bâtiment',
  architecture: 'architecture', project: 'projet', wall: 'mur', fire: 'feu',
  resistant: 'résistant', help: 'aide', need: 'besoin', with: 'avec', my: 'mon',
  the: 'le', a: 'un', and: 'et', must: 'doit', be: 'être',
}

function mockTranslate(text, from, to) {
  if (from === to) return text
  const dict = WORDS_EN_FR
  if (from === 'en' && to === 'fr') {
    return text.replace(/\b[\w'-]+\b/gi, (word) => dict[word.toLowerCase()] || word)
  }
  if (from === 'fr' && to === 'en') {
    const reverse = Object.fromEntries(Object.entries(dict).map(([k, v]) => [v, k]))
    return text.replace(/\b[\w'-àâäéèêëïîôùûüç]+/gi, (word) => reverse[word.toLowerCase()] || word)
  }
  return text
}

/**
 * @returns {{ text: string, provider: string, isDemo: boolean, error?: string, warning?: string }}
 */
export async function translateText(text, { from = 'en', to = 'fr', mode = 'standard' } = {}) {
  const trimmed = String(text || '').trim()
  if (!trimmed) {
    return { text: '', provider: getTranslationProvider(), isDemo: false, error: 'Texte source vide' }
  }
  if (from === to) {
    return { text: trimmed, provider: getTranslationProvider(), isDemo: false }
  }

  const provider = getTranslationProvider()

  if (provider === 'mock') {
    const out = mockTranslate(trimmed, from, to)
    return {
      text: out,
      provider: 'mock',
      isDemo: true,
      warning: 'Mode démo : traduction mot à mot uniquement. Configurez VITE_TRANSLATE_PROVIDER=browser ou une API pour une vraie traduction.',
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
        error: err?.message || 'Erreur API de traduction',
      }
    }
  }

  // browser = traduction en ligne gratuite
  try {
    const out = await translateBrowser(trimmed, from, to)
    return { text: out, provider: 'browser', isDemo: false }
  } catch (err) {
    return {
      text: '',
      provider: 'browser',
      isDemo: false,
      error: err?.message || 'Traduction en ligne indisponible. Vérifiez votre connexion.',
    }
  }
}
