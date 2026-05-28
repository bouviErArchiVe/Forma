/** Parse Wiktionary wikitext → sections structurées */

function cleanWikiLine(line) {
  return line
    .replace(/\[\[([^|\]]+)\|([^\]]+)]]/g, '$2')
    .replace(/\[\[([^\]]+)]]/g, '$1')
    .replace(/'''([^']+)'''/g, '$1')
    .replace(/''([^']+)''/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/^#+\s*/, '')
    .replace(/^[*#:;]+\s*/, '')
    .trim()
}

function extractSection(wikitext, titles) {
  if (!wikitext) return []
  const lines = wikitext.split('\n')
  const out = []
  let inSection = false
  let depth = 0
  for (const raw of lines) {
    const head = raw.match(/^(=+)\s*([^=]+)\s*\1\s*$/)
    if (head) {
      const title = cleanWikiLine(head[2]).toLowerCase()
      const d = head[1].length
      if (titles.some((t) => title.includes(t))) {
        inSection = true
        depth = d
        continue
      }
      if (inSection && d <= depth) break
      continue
    }
    if (!inSection) continue
    const line = cleanWikiLine(raw)
    if (line && line.length > 1 && !line.startsWith('{')) out.push(line)
  }
  return [...new Set(out)].slice(0, 40)
}

function extractDefinitionsAndExamples(wikitext, lang = 'fr') {
  if (!wikitext) return { definitions: [], inlineExamples: [] }
  const defs = []
  const examples = []
  const langMarker = lang === 'fr' ? '{{S|fr' : '{{S|en'
  const lines = wikitext.split('\n')
  let currentPos = ''
  for (const raw of lines) {
    if (raw.includes(langMarker)) {
      const pos = raw.match(/\|([^|}|]+)\}\}/)
      currentPos = pos ? cleanWikiLine(pos[1]) : 'mot'
    }
    if (/^#(?![:*#])/.test(raw) && !raw.startsWith('====')) {
      const t = cleanWikiLine(raw.replace(/^#+\s*/, ''))
      if (t.length > 2) defs.push({ pos: currentPos || '—', text: t })
    }
    if (/^#[:*]/.test(raw)) {
      const t = cleanWikiLine(raw)
      if (t.length > 2) examples.push(t)
    }
  }
  return {
    definitions: defs.slice(0, 24),
    inlineExamples: [...new Set(examples)].slice(0, 16),
  }
}

function extractGrammar(wikitext, lang = 'fr') {
  const grammar = { pos: null, gender: null, plural: null, feminine: null }
  const langBlock = lang === 'fr' ? '{{S|fr' : '{{S|en'
  const posMatch = wikitext.match(new RegExp(`${langBlock.replace(/[{}|]/g, '\\$&')}[^|]*\\|([^|}|]+)`))
  if (posMatch) grammar.pos = posMatch[1]
  const genderMatch = wikitext.match(/\|([mf]|mf|n|f-p|m-p)\}\}/i)
  if (genderMatch) {
    const g = genderMatch[1].toLowerCase()
    if (g === 'm') grammar.gender = 'masculin'
    else if (g === 'f') grammar.gender = 'féminin'
    else if (g === 'mf') grammar.gender = 'masculin / féminin'
  }
  const pluralLines = extractSection(wikitext, ['pluriel', 'plural'])
  if (pluralLines[0]) grammar.plural = pluralLines[0]
  const femLines = extractSection(wikitext, ['féminin', 'feminine'])
  if (femLines[0]) grammar.feminine = femLines[0]
  return grammar
}

export function parseWiktionaryEntry(wikitext, word, lang = 'fr') {
  const wikiHost = lang === 'en' ? 'en.wiktionary.org' : 'fr.wiktionary.org'
  const { definitions, inlineExamples } = extractDefinitionsAndExamples(wikitext, lang)
  const synonyms = extractSection(wikitext, ['synonyme', 'synonym'])
  const antonyms = extractSection(wikitext, ['antonyme', 'antonym'])
  const expressions = extractSection(wikitext, ['expression', 'locution', 'idiom'])
  const conjugation = extractSection(wikitext, ['conjugaison', 'conjugation'])
  const examples = [...inlineExamples, ...extractSection(wikitext, ['exemple', 'example'])].slice(0, 24)
  const technical = extractSection(wikitext, ['technique', 'architecture', 'métier', 'vocabulaire'])
  const grammar = extractGrammar(wikitext, lang)

  return {
    word,
    lang,
    found: definitions.length > 0 || synonyms.length > 0 || examples.length > 0,
    definitions,
    synonyms,
    antonyms,
    expressions: [...expressions, ...technical].slice(0, 24),
    conjugation: conjugation.length ? conjugation : null,
    examples,
    grammar,
    source: 'wiktionary',
    url: `https://${wikiHost}/wiki/${encodeURIComponent(word.replace(/ /g, '_'))}`,
  }
}
