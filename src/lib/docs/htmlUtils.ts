import type { FormaDocument } from '../../types'

export function htmlToPlain(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]+>/g, ' ')
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return div.textContent || ''
}

export function docToPlainText(doc: FormaDocument): string {
  return doc.pages
    .map((p, i) => {
      const text = htmlToPlain(p.html)
      return doc.pages.length > 1 ? `--- Page ${i + 1} ---\n${text}` : text
    })
    .join('\n\n')
}

export function htmlToMarkdown(html: string): string {
  let s = html || ''
  s = s.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
  s = s.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
  s = s.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
  s = s.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
  s = s.replace(/<b>(.*?)<\/b>/gi, '**$1**')
  s = s.replace(/<em>(.*?)<\/em>/gi, '*$1*')
  s = s.replace(/<i>(.*?)<\/i>/gi, '*$1*')
  s = s.replace(/<u>(.*?)<\/u>/gi, '_$1_')
  s = s.replace(/<li>(.*?)<\/li>/gi, '- $1\n')
  s = s.replace(/<\/?ul[^>]*>/gi, '\n')
  s = s.replace(/<\/?ol[^>]*>/gi, '\n')
  s = s.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
  s = s.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n')
  s = s.replace(/<code>(.*?)<\/code>/gi, '`$1`')
  s = s.replace(/<hr\s*\/?>/gi, '\n---\n\n')
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
  s = s.replace(/<[^>]+>/g, '')
  s = s.replace(/&nbsp;/g, ' ')
  s = s.replace(/&amp;/g, '&')
  s = s.replace(/&lt;/g, '<')
  s = s.replace(/&gt;/g, '>')
  return s.replace(/\n{3,}/g, '\n\n').trim()
}

export function docToMarkdown(doc: FormaDocument): string {
  return doc.pages
    .map((p, i) => {
      const md = htmlToMarkdown(p.html)
      return doc.pages.length > 1 ? `<!-- Page ${i + 1} -->\n\n${md}` : md
    })
    .join('\n\n---\n\n')
}

export function docPlainSnippet(doc: FormaDocument, maxLen = 120): string {
  const text = doc.pages.map((p) => htmlToPlain(p.html)).join(' ')
  return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '')
}

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
