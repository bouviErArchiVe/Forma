/** FormaAI — provider IA (API optionnelle + fallbacks locaux) */

export function getAIProvider() {
  const forced = (import.meta.env.VITE_AI_PROVIDER || '').toLowerCase()
  if (forced === 'mock' || forced === 'api') return forced
  if (import.meta.env.VITE_AI_API_URL) return 'api'
  return 'mock'
}

async function callAIApi({ system, prompt, maxTokens = 800 }) {
  const apiUrl = import.meta.env.VITE_AI_API_URL
  if (!apiUrl) throw new Error('VITE_AI_API_URL non configurée')

  const headers = { 'Content-Type': 'application/json' }
  const apiKey = import.meta.env.VITE_AI_API_KEY
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      system,
      prompt,
      max_tokens: maxTokens,
      model: import.meta.env.VITE_AI_MODEL || 'default',
    }),
  })
  if (!res.ok) throw new Error(`IA API : ${res.status}`)
  const data = await res.json()
  return data.text || data.content || data.message || data.choices?.[0]?.message?.content || ''
}

function splitSentences(text) {
  return String(text || '').split(/(?<=[.!?])\s+/).filter(Boolean)
}

function localSummarize(text) {
  const sentences = splitSentences(text)
  const take = sentences.slice(0, Math.min(3, Math.ceil(sentences.length / 3)))
  const bullets = sentences.slice(0, 5).map((s) => `• ${s.trim()}`)
  return `**Résumé**\n\n${take.join(' ')}\n\n**Points clés**\n${bullets.join('\n')}`
}

function localSpellcheck(text) {
  const fixes = [
    [/\bapartement\b/gi, 'appartement'],
    [/bcp\b/gi, 'beaucoup'],
    [/tt\b/gi, 'tout'],
    [/developpement\b/gi, 'développement'],
    [/amenagement\b/gi, 'aménagement'],
    [/architecure\b/gi, 'architecture'],
    [/eclairage\b/gi, 'éclairage'],
    [/materiaux\b/gi, 'matériaux'],
  ]
  let out = text
  const changes = []
  for (const [re, rep] of fixes) {
    if (re.test(out)) {
      changes.push(`${re.source} → ${rep}`)
      out = out.replace(re, rep)
    }
  }
  if (!changes.length) return `${text}\n\n— Aucune correction évidente détectée (mode local).`
  return `${out}\n\n— Corrections : ${changes.join(', ')}`
}

function localReformulate(text) {
  const t = text.trim()
  return `${t.charAt(0).toUpperCase() + t.slice(1).replace(/\s+/g, ' ')}\n\n(Formulation clarifiée — mode local. Connectez une API IA pour une reformulation avancée.)`
}

function localTechnicalNotes(text) {
  return `## Notes techniques\n\n**Contexte**\n${text.slice(0, 300)}${text.length > 300 ? '…' : ''}\n\n**Points à vérifier**\n• Matériaux et performances\n• Conformité normative (CNB, NECB)\n• Détails constructifs\n• Cotes et tolérances\n\n**Actions**\n• Vérifier les plans de référence\n• Documenter les choix techniques`
}

function localTableHelp(text) {
  return `**Aide tableau FormaTab**\n\nDonnées reçues (${text.split('\n').length} lignes).\n\n• Vérifier l'alignement des colonnes\n• Utiliser des en-têtes clairs\n• Formater les unités (m, m², kN)\n• Ajouter une ligne de totaux si pertinent`
}

function localDocHelp(text) {
  return `**Aide document FormaDoc**\n\n• Structure : introduction → développement → conclusion\n• Ajouter des titres H2/H3\n• Insérer des visuels (plans, schémas)\n• Relire l'orthographe\n\nExtrait analysé : ${text.slice(0, 200)}…`
}

function localPresentHelp(text) {
  return `**Aide présentation FormaPresent**\n\n• Slide titre : projet + auteur\n• 1 idée par slide\n• Visuels > texte\n• Notes présentateur pour chaque slide\n• Conclure par les enjeux clés\n\nContenu : ${text.slice(0, 150)}…`
}

function localClassify(text) {
  const lower = text.toLowerCase()
  const tags = []
  if (/escalier|marche|giron|blondel/i.test(lower)) tags.push('escaliers', 'circulation')
  if (/mur|cloison|coupe.?feu|rf/i.test(lower)) tags.push('murs', 'feu', 'structure')
  if (/gypse|platre|plaque/i.test(lower)) tags.push('cloisons sèches', 'gypse')
  if (/cnb|norme|code/i.test(lower)) tags.push('normes', 'réglementation')
  if (/plan|coupe|facade|elevation/i.test(lower)) tags.push('plans', 'architecture')
  if (/beton|acier|bois|structure/i.test(lower)) tags.push('structure')
  if (!tags.length) tags.push('général', 'architecture')
  return `**Tags suggérés** : ${tags.map((t) => `#${t}`).join(' ')}\n\n**Dossier suggéré** : ${tags[0]}\n**Matière** : architecture`
}

const LOCAL_HANDLERS = {
  summarize: localSummarize,
  spellcheck: localSpellcheck,
  reformulate: localReformulate,
  technical: localTechnicalNotes,
  tableHelp: localTableHelp,
  docHelp: localDocHelp,
  presentHelp: localPresentHelp,
  classify: localClassify,
}

const SYSTEM_PROMPTS = {
  summarize: 'Tu es un assistant architecture. Résume le texte en français, concis, avec des puces.',
  spellcheck: 'Corrige l\'orthographe et la grammaire en français. Retourne le texte corrigé uniquement.',
  reformulate: 'Reformule le texte en français, style professionnel architecture, plus clair.',
  technical: 'Génère des notes techniques structurées en français pour un projet d\'architecture.',
  tableHelp: 'Analyse ce tableau et suggère améliorations (structure, unités, clarté).',
  docHelp: 'Améliore ce document : structure, clarté, suggestions concrètes.',
  presentHelp: 'Suggère une structure de présentation jury pour ce contenu.',
  classify: 'Propose des tags et un classement (dossier, matière) pour ce contenu architecture.',
}

export async function runAIAction(actionId, text) {
  const input = String(text || '').trim()
  if (!input) throw new Error('Texte requis')

  const provider = getAIProvider()
  if (provider === 'api') {
    try {
      const out = await callAIApi({
        system: SYSTEM_PROMPTS[actionId] || 'Assistant Forma architecture.',
        prompt: input,
      })
      if (out?.trim()) return out.trim()
    } catch (err) {
      console.warn('FormaAI API fallback:', err.message)
    }
  }

  const handler = LOCAL_HANDLERS[actionId]
  if (!handler) throw new Error('Action inconnue')
  return handler(input)
}
