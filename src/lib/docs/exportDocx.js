import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, ImageRun, WidthType, PageBreak,
  Header, Footer, PageNumber, AlignmentType, BorderStyle,
} from 'docx'

function mmToTwip(mm) {
  return Math.round(Number(mm || 20) * 56.7)
}

function primaryFont(doc) {
  const raw = doc?.fontFamily || 'Inter, system-ui, sans-serif'
  return String(raw).split(',')[0].replace(/['"]/g, '').trim() || 'Inter'
}

function baseFontSize(doc) {
  return Math.max(8, Math.min(72, doc?.fontSize || 14))
}

function toDocxColor(value) {
  if (!value) return undefined
  const v = String(value).trim()
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.replace('#', '')
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    const h = v.slice(1)
    return `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
  }
  const named = { black: '000000', white: 'ffffff', red: 'ff0000', blue: '0000ff', gray: '808080', grey: '808080' }
  return named[v.toLowerCase()] || undefined
}

function parseStyleAttr(el) {
  const style = el?.getAttribute?.('style') || ''
  const out = {}
  const align = /text-align\s*:\s*(left|center|right|justify)/i.exec(style)
  if (align) out.align = align[1].toLowerCase()
  const color = /color\s*:\s*([^;]+)/i.exec(style)
  if (color) out.color = toDocxColor(color[1].trim())
  const size = /font-size\s*:\s*(\d+(?:\.\d+)?)\s*px/i.exec(style)
  if (size) out.fontSize = Math.round(parseFloat(size[1]) * 2)
  return out
}

const ALIGN = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
}

function textRunsFromNode(node, inherited = {}) {
  if (!node) return [new TextRun('')]
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent || ''
    if (!t) return []
    const run = { text: t }
    if (inherited.bold) run.bold = true
    if (inherited.italics) run.italics = true
    if (inherited.underline) run.underline = {}
    if (inherited.strike) run.strike = true
    if (inherited.color) run.color = inherited.color
    if (inherited.size) run.size = inherited.size
    return [new TextRun(run)]
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []

  const tag = node.tagName?.toLowerCase()
  const style = parseStyleAttr(node)
  const next = { ...inherited }
  if (style.color) next.color = style.color
  if (style.fontSize) next.size = style.fontSize
  if (tag === 'strong' || tag === 'b') next.bold = true
  if (tag === 'em' || tag === 'i') next.italics = true
  if (tag === 'u') next.underline = true
  if (tag === 's' || tag === 'strike') next.strike = true

  if (tag === 'br') return [new TextRun({ break: 1 })]

  const children = [...node.childNodes].flatMap((n) => textRunsFromNode(n, next))
  if (!children.length) children.push(new TextRun(''))
  return children
}

function paragraphFromEl(el, doc) {
  const tag = el.tagName?.toLowerCase()
  const style = parseStyleAttr(el)
  const runs = textRunsFromNode(el, { size: baseFontSize(doc) * 2 })
  const base = {
    children: runs.length ? runs : [new TextRun({ text: '', size: baseFontSize(doc) * 2 })],
    alignment: ALIGN[style.align] || undefined,
    spacing: { after: Math.round((doc?.paragraphSpacing || 12) * 15) },
  }
  if (tag === 'h1') return new Paragraph({ ...base, heading: HeadingLevel.HEADING_1 })
  if (tag === 'h2') return new Paragraph({ ...base, heading: HeadingLevel.HEADING_2 })
  if (tag === 'h3') return new Paragraph({ ...base, heading: HeadingLevel.HEADING_3 })
  if (tag === 'blockquote') return new Paragraph({ ...base, indent: { left: 720 } })
  if (tag === 'li') return new Paragraph({ ...base, bullet: { level: 0 } })
  return new Paragraph(base)
}

function tableFromEl(tableEl, doc) {
  const rows = [...tableEl.querySelectorAll('tr')].map((tr) => {
    const cells = [...tr.querySelectorAll('th,td')].map((td) => {
      const isHeader = td.tagName?.toLowerCase() === 'th'
      const runs = textRunsFromNode(td, { bold: isHeader, size: (baseFontSize(doc) - 1) * 2 })
      return new TableCell({
        children: [new Paragraph({ children: runs.length ? runs : [new TextRun('')] })],
        shading: isHeader ? { fill: 'E8EEF4' } : undefined,
      })
    })
    return new TableRow({ children: cells.length ? cells : [new TableCell({ children: [new Paragraph('')] })] })
  })
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCD3DC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCD3DC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCD3DC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCD3DC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCD3DC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCD3DC' },
    },
    rows,
  })
}

async function imageParagraph(imgEl) {
  const src = imgEl.getAttribute('src') || ''
  const m = /^data:image\/(\w+);base64,(.+)$/.exec(src)
  if (!m) return new Paragraph({ children: [new TextRun('[Image]')] })
  try {
    const data = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0))
    return new Paragraph({
      children: [new ImageRun({ data, transformation: { width: 400, height: 225 } })],
    })
  } catch {
    return new Paragraph({ children: [new TextRun('[Image]')] })
  }
}

async function htmlToDocxBlocks(html, doc) {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  const blocks = []

  for (const node of [...div.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || '').trim()
      if (t) blocks.push(new Paragraph({ children: [new TextRun({ text: t, size: baseFontSize(doc) * 2 })] }))
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const tag = node.tagName.toLowerCase()
    if (tag === 'table') {
      blocks.push(tableFromEl(node, doc))
    } else if (tag === 'img') {
      blocks.push(await imageParagraph(node))
    } else if (tag === 'hr') {
      blocks.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 1 } },
        children: [new TextRun('')],
      }))
    } else if (tag === 'ul' || tag === 'ol') {
      node.querySelectorAll('li').forEach((li) => blocks.push(paragraphFromEl(li, doc)))
    } else if (['div', 'blockquote', 'pre'].includes(tag) && node.querySelector('table')) {
      const table = node.querySelector('table')
      if (table) blocks.push(tableFromEl(table, doc))
    } else if (tag === 'div' && node.querySelector('img')) {
      const img = node.querySelector('img')
      if (img) blocks.push(await imageParagraph(img))
    } else {
      blocks.push(paragraphFromEl(node, doc))
    }
  }
  return blocks.length ? blocks : [new Paragraph({ children: [new TextRun('')] })]
}

function buildHeader(doc) {
  const title = doc?.name || 'Document'
  const headerText = doc?.settings?.headerText?.trim()
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCD3DC', space: 4 } },
        children: [
          new TextRun({
            text: headerText || title,
            bold: true,
            size: 20,
            color: '333333',
            font: primaryFont(doc),
          }),
        ],
      }),
    ],
  })
}

function buildFooter(doc) {
  const footerText = doc?.settings?.footerText?.trim()
  const showPages = doc?.pageNumbers !== false
  const children = []

  if (footerText) {
    children.push(new TextRun({ text: footerText, size: 18, color: '666666', font: primaryFont(doc) }))
    if (showPages) children.push(new TextRun({ text: '   ·   ', size: 18, color: '666666' }))
  }

  if (showPages) {
    children.push(
      new TextRun({ text: 'Page ', size: 18, color: '666666', font: primaryFont(doc) }),
      new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '666666', font: primaryFont(doc) }),
      new TextRun({ text: ' / ', size: 18, color: '666666', font: primaryFont(doc) }),
      new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: '666666', font: primaryFont(doc) }),
    )
  }

  if (!children.length) {
    children.push(new TextRun({ text: ' ', size: 18 }))
  }

  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CCD3DC', space: 4 } },
        children,
      }),
    ],
  })
}

export async function exportDocDocx(doc) {
  const blocks = []
  for (let i = 0; i < (doc.pages || []).length; i++) {
    const pageBlocks = await htmlToDocxBlocks(doc.pages[i].html, doc)
    if (i > 0) pageBlocks.unshift(new Paragraph({ children: [new PageBreak()] }))
    blocks.push(...pageBlocks)
  }

  const margin = mmToTwip(doc?.settings?.marginMm ?? 20)
  const font = primaryFont(doc)
  const size = baseFontSize(doc) * 2

  const file = new Document({
    title: doc.name,
    creator: 'Forma par ArchNote',
    styles: {
      default: {
        document: {
          run: { font, size, color: '000000' },
          paragraph: { spacing: { line: Math.round((doc?.lineHeight || 1.6) * 240) } },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: { top: margin, right: margin, bottom: margin, left: margin },
        },
      },
      headers: { default: buildHeader(doc) },
      footers: { default: buildFooter(doc) },
      children: blocks.length ? blocks : [new Paragraph({ children: [new TextRun('')] })],
    }],
  })

  const blob = await Packer.toBlob(file)
  const safe = (doc.name || 'document').replace(/[^\w\- ]+/g, '_')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safe}.docx`
  a.click()
  URL.revokeObjectURL(url)
  return true
}
