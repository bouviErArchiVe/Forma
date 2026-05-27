import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, ImageRun, BorderStyle, WidthType, PageBreak,
} from 'docx'
import { downloadText } from './htmlUtils'

function textRunsFromNode(node) {
  if (!node) return [new TextRun('')]
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent || ''
    return t ? [new TextRun(t)] : []
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return []

  const tag = node.tagName?.toLowerCase()
  const children = [...node.childNodes].flatMap(textRunsFromNode)
  if (!children.length) children.push(new TextRun(''))

  if (tag === 'strong' || tag === 'b') return children.map((r) => new TextRun({ text: r.text || '', bold: true }))
  if (tag === 'em' || tag === 'i') return children.map((r) => new TextRun({ text: r.text || '', italics: true }))
  if (tag === 'u') return children.map((r) => new TextRun({ text: r.text || '', underline: {} }))
  if (tag === 's' || tag === 'strike') return children.map((r) => new TextRun({ text: r.text || '', strike: true }))
  if (tag === 'br') return [new TextRun({ break: 1 })]
  return children
}

function paragraphFromEl(el) {
  const tag = el.tagName?.toLowerCase()
  const runs = textRunsFromNode(el)
  if (tag === 'h1') return new Paragraph({ heading: HeadingLevel.HEADING_1, children: runs })
  if (tag === 'h2') return new Paragraph({ heading: HeadingLevel.HEADING_2, children: runs })
  if (tag === 'h3') return new Paragraph({ heading: HeadingLevel.HEADING_3, children: runs })
  if (tag === 'blockquote') return new Paragraph({ indent: { left: 720 }, children: runs })
  if (tag === 'li') return new Paragraph({ bullet: { level: 0 }, children: runs })
  return new Paragraph({ children: runs.length ? runs : [new TextRun('')] })
}

function tableFromEl(tableEl) {
  const rows = [...tableEl.querySelectorAll('tr')].map((tr) => {
    const cells = [...tr.querySelectorAll('th,td')].map((td) =>
      new TableCell({
        children: [new Paragraph({ children: textRunsFromNode(td).length ? textRunsFromNode(td) : [new TextRun('')] })],
      })
    )
    return new TableRow({ children: cells.length ? cells : [new TableCell({ children: [new Paragraph('')] })] })
  })
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
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

async function htmlToDocxBlocks(html) {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  const blocks = []

  for (const node of [...div.childNodes]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || '').trim()
      if (t) blocks.push(new Paragraph({ children: [new TextRun(t)] }))
      continue
    }
    if (node.nodeType !== Node.ELEMENT_NODE) continue
    const tag = node.tagName.toLowerCase()
    if (tag === 'table') {
      blocks.push(tableFromEl(node))
    } else if (tag === 'img') {
      blocks.push(await imageParagraph(node))
    } else if (tag === 'hr') {
      blocks.push(new Paragraph({ children: [new TextRun('───────────────')] }))
    } else if (tag === 'ul' || tag === 'ol') {
      node.querySelectorAll('li').forEach((li) => blocks.push(paragraphFromEl(li)))
    } else if (['div', 'blockquote', 'pre'].includes(tag) && node.querySelector('table')) {
      const table = node.querySelector('table')
      if (table) blocks.push(tableFromEl(table))
    } else if (tag === 'div' && node.querySelector('img')) {
      const img = node.querySelector('img')
      if (img) blocks.push(await imageParagraph(img))
    } else {
      blocks.push(paragraphFromEl(node))
    }
  }
  return blocks.length ? blocks : [new Paragraph({ children: [new TextRun('')] })]
}

export async function exportDocDocx(doc) {
  const sections = []
  for (let i = 0; i < (doc.pages || []).length; i++) {
    const blocks = await htmlToDocxBlocks(doc.pages[i].html)
    if (i > 0) blocks.unshift(new Paragraph({ children: [new PageBreak()] }))
    sections.push(...blocks)
  }

  const file = new Document({
    title: doc.name,
    sections: [{ properties: {}, children: sections }],
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
