/**
 * Aperçu de structure d'un template architecture.
 *
 * Dérive du `contentHtml` un sommaire exploitable AVANT « Créer depuis ce
 * template » : titre, sections (h2) avec ce qu'elles contiennent (listes,
 * tableaux, paragraphes) et présence de l'avertissement officiel. Purement
 * dérivé du HTML (regex légères, pas de DOM) pour rester testable côté Node et
 * indépendant du rendu.
 */
import type { ArchitectureTemplate } from './templates'

/** Nature du contenu principal d'une section. */
export type TemplateSectionContent = 'list' | 'table' | 'text' | 'empty'

export interface TemplateSection {
  /** Intitulé de la section (texte du <h2>). */
  title: string
  /** Type de contenu dominant sous le titre. */
  content: TemplateSectionContent
  /** Nb d'items de liste (<li>) directement sous la section, si liste. */
  itemCount: number
  /** La section contient un tableau. */
  hasTable: boolean
}

export interface TemplatePreview {
  /** Titre principal (texte du <h1>), ou le nom du template à défaut. */
  title: string
  sections: TemplateSection[]
  /** Nb total de sections (h2). */
  sectionCount: number
  /** Nb total d'items de liste dans tout le template. */
  totalItems: number
  /** Le template comporte au moins un tableau. */
  hasTable: boolean
  /** L'avertissement officiel (blockquote) est présent. */
  hasDisclaimer: boolean
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

function countMatches(html: string, re: RegExp): number {
  return (html.match(re) ?? []).length
}

/**
 * Découpe le HTML d'un template en sections (segment qui suit chaque <h2>) et
 * en déduit un sommaire structuré. Pur et déterministe.
 */
export function buildTemplatePreview(template: ArchitectureTemplate): TemplatePreview {
  const html = template.contentHtml

  const h1Match = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)
  const title = h1Match ? stripTags(h1Match[1]) || template.name : template.name

  // Segments : chaque <h2>…</h2> jusqu'au prochain <h2> (ou la fin).
  const sections: TemplateSection[] = []
  const h2Re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
  const matches: { title: string; index: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = h2Re.exec(html)) !== null) {
    matches.push({ title: stripTags(m[1]), index: m.index, end: m.index + m[0].length })
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].end
    const stop = i + 1 < matches.length ? matches[i + 1].index : html.length
    const body = html.slice(start, stop)
    const itemCount = countMatches(body, /<li\b/gi)
    const hasTable = /<table\b/i.test(body)
    const hasList = /<(ul|ol)\b/i.test(body)
    const text = stripTags(body)
    const content: TemplateSectionContent = hasList
      ? 'list'
      : hasTable
        ? 'table'
        : text !== ''
          ? 'text'
          : 'empty'
    sections.push({ title: matches[i].title, content, itemCount, hasTable })
  }

  return {
    title,
    sections,
    sectionCount: sections.length,
    totalItems: countMatches(html, /<li\b/gi),
    hasTable: /<table\b/i.test(html),
    hasDisclaimer: /<blockquote\b/i.test(html),
  }
}
