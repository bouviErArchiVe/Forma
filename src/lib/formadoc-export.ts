/**
 * FormaDoc export utilities.
 * - htmlToMarkdown: convert contenteditable HTML → Markdown text
 * - printFormaDoc: open browser print dialog with styled content
 * - downloadFormaDocMarkdown: trigger a .md file download
 */

/** Convert simple rich-text HTML (from contenteditable) to Markdown. */
export function htmlToMarkdown(html: string): string {
  if (!html) return ''

  // Work on a temporary div to avoid mutating the page DOM
  const tmp = document.createElement('div')
  tmp.innerHTML = html

  return nodeToMarkdown(tmp).trim()
}

function nodeToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName.toLowerCase()
  const children = Array.from(el.childNodes).map(nodeToMarkdown).join('')

  switch (tag) {
    case 'h1':
      return `\n# ${children.trim()}\n`
    case 'h2':
      return `\n## ${children.trim()}\n`
    case 'h3':
      return `\n### ${children.trim()}\n`
    case 'h4':
      return `\n#### ${children.trim()}\n`
    case 'p':
      return children.trim() ? `\n${children.trim()}\n` : '\n'
    case 'div':
      // contenteditable often wraps lines in <div>
      return children.trim() ? `\n${children.trim()}\n` : '\n'
    case 'br':
      return '\n'
    case 'strong':
    case 'b':
      return `**${children}**`
    case 'em':
    case 'i':
      return `_${children}_`
    case 'u':
      return `<u>${children}</u>`
    case 's':
    case 'strike':
    case 'del':
      return `~~${children}~~`
    case 'ul': {
      const items = Array.from(el.querySelectorAll(':scope > li'))
        .map((li) => `- ${li.textContent?.trim() ?? ''}`)
        .join('\n')
      return `\n${items}\n`
    }
    case 'ol': {
      const items = Array.from(el.querySelectorAll(':scope > li'))
        .map((li, i) => `${i + 1}. ${li.textContent?.trim() ?? ''}`)
        .join('\n')
      return `\n${items}\n`
    }
    case 'li':
      // li content handled by ul/ol above; fallback if standalone
      return `- ${children.trim()}\n`
    case 'a': {
      const href = el.getAttribute('href') ?? ''
      return href ? `[${children}](${href})` : children
    }
    case 'img': {
      const alt = el.getAttribute('alt') ?? ''
      const src = el.getAttribute('src') ?? ''
      // Skip embedded data URLs in markdown (too large)
      if (src.startsWith('data:')) return alt ? `*[image: ${alt}]*` : '*[image]*'
      return `![${alt}](${src})`
    }
    case 'blockquote':
      return `\n> ${children.trim()}\n`
    case 'code':
      return `\`${children}\``
    case 'pre':
      return `\n\`\`\`\n${children.trim()}\n\`\`\`\n`
    case 'hr':
      return '\n---\n'
    case 'span':
    case 'font':
      return children
    default:
      // Unknown block elements — output their text content as paragraph
      if (isBlockTag(tag)) return `\n${children.trim()}\n`
      return children
  }
}

const BLOCK_TAGS = new Set([
  'address', 'article', 'aside', 'details', 'dialog', 'dd', 'dt',
  'fieldset', 'figcaption', 'figure', 'footer', 'form', 'header',
  'hgroup', 'main', 'nav', 'section', 'summary', 'table', 'caption',
  'tbody', 'thead', 'tfoot', 'tr', 'td', 'th',
])

function isBlockTag(tag: string): boolean {
  return BLOCK_TAGS.has(tag)
}

/** Collapse multiple blank lines to max 2. */
function normalizeMarkdown(md: string): string {
  return md.replace(/\n{3,}/g, '\n\n').trim()
}

/** Trigger browser download of a .md file. */
export function downloadFormaDocMarkdown(html: string, title: string): void {
  const md = normalizeMarkdown(htmlToMarkdown(html))
  const blob = new Blob([md], { type: 'text/markdown; charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${sanitizeFilename(title)}.md`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Open print dialog with styled FormaDoc content (PDF via browser print). */
export function printFormaDoc(html: string, title: string): void {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return

  win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 20mm 20mm 20mm 20mm; }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      color: #1a1a1a;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    h1 { font-size: 22pt; margin: 0 0 12px; font-weight: 700; line-height: 1.2; }
    h2 { font-size: 16pt; margin: 24px 0 8px; font-weight: 600; }
    h3 { font-size: 13pt; margin: 20px 0 6px; font-weight: 600; }
    p  { margin: 0 0 10px; }
    ul, ol { margin: 0 0 10px 1.5em; padding: 0; }
    li { margin-bottom: 3px; }
    blockquote { border-left: 3px solid #d1d5db; margin: 12px 0; padding: 8px 16px; color: #6b7280; font-style: italic; }
    img { max-width: 100%; height: auto; display: block; margin: 12px 0; border-radius: 4px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    td, th { border: 1px solid #e5e7eb; padding: 6px 10px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    a { color: #4f46e5; text-decoration: underline; }
    code { background: #f3f4f6; padding: 1px 4px; border-radius: 3px; font-size: 9pt; font-family: 'Cascadia Code', 'Fira Code', monospace; }
    pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow: auto; font-size: 9pt; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      a { color: #1a1a1a; }
    }
  </style>
</head>
<body>${html}</body>
</html>`)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
    win.close()
  }, 250)
}

/** Count words in HTML content (strip tags first). */
export function countWordsInHtml(html: string): number {
  if (!html) return 0
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  const text = (tmp.textContent ?? '').trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'document'
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
