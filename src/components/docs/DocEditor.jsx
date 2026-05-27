import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  PAGE_W, PAGE_H, addPage, deletePage, duplicatePage, updatePageHtml,
  buildTocHtml, findInDoc, replaceInDoc,
} from '@/lib/docs/model'
import { listSheets, getSheet } from '@/lib/spreadsheet/persistence'
import { computeSheet } from '@/lib/spreadsheet/formulas'
import { cellKey } from '@/lib/spreadsheet/cells'
import DocPreview from '@/components/docs/DocPreview'

const FONTS = ['Inter', 'Georgia', 'Times New Roman', 'Arial', 'Courier New', 'Patrick Hand']
const SIZES = [10, 11, 12, 14, 16, 18, 24, 32]

function sheetToHtmlTable(sheet) {
  if (!sheet) return '<p>Tableau introuvable</p>'
  const computed = computeSheet(sheet)
  const rows = Math.min(sheet.rows, 12)
  const cols = Math.min(sheet.cols, 8)
  let html = `<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%;margin:12px 0"><caption><strong>📊 ${sheet.name}</strong></caption><tbody>`
  for (let r = 0; r < rows; r++) {
    html += '<tr>'
    for (let c = 0; c < cols; c++) {
      const v = computed[cellKey(r, c)]?.value ?? ''
      html += `<td>${String(v).replace(/</g, '&lt;')}</td>`
    }
    html += '</tr>'
  }
  html += '</tbody></table><p></p>'
  return html
}

function execCmd(cmd, val = null) {
  document.execCommand('styleWithCSS', false, true)
  document.execCommand(cmd, false, val)
}

export default function DocEditor({
  doc, onChange, T, readOnly = false, pageRefs, onFullscreenChange,
}) {
  const [activePage, setActivePage] = useState(0)
  const [sidebar, setSidebar] = useState('pages')
  const [readingMode, setReadingMode] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [findOpen, setFindOpen] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [copiedStyle, setCopiedStyle] = useState(null)
  const editorRefs = useRef([])
  const containerRef = useRef(null)

  const page = doc.pages[activePage]
  const tocHtml = useMemo(() => buildTocHtml(doc.pages), [doc.pages])
  const findHits = useMemo(() => findInDoc(doc.pages, findText), [doc.pages, findText])
  const sheets = useMemo(() => listSheets().slice(0, 30), [])

  useEffect(() => {
    onFullscreenChange?.(fullscreen)
  }, [fullscreen, onFullscreenChange])

  useEffect(() => {
    const el = editorRefs.current[activePage]
    if (!el || el.innerHTML === (page?.html || '')) return
    el.innerHTML = page?.html || '<p></p>'
  }, [activePage, page?.html])

  const syncPage = useCallback((index, html) => {
    onChange(updatePageHtml(doc, index, html))
  }, [doc, onChange])

  const handleInput = (index) => {
    const el = editorRefs.current[index]
    if (el) syncPage(index, el.innerHTML)
  }

  const focusEditor = () => editorRefs.current[activePage]?.focus()

  const run = (cmd, val) => { focusEditor(); execCmd(cmd, val); handleInput(activePage) }

  const insertHtml = (html) => {
    focusEditor()
    execCmd('insertHTML', html)
    handleInput(activePage)
  }

  const insertImage = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => insertHtml(`<img src="${reader.result}" style="max-width:100%;border-radius:6px;margin:8px 0" alt=""/>`)
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const insertLink = () => {
    const url = window.prompt('URL du lien :', 'https://')
    if (!url) return
    run('createLink', url)
  }

  const insertSheet = (sheetId) => {
    const sheet = getSheet(sheetId)
    if (!sheet) return
    insertHtml(sheetToHtmlTable(sheet))
  }

  const copyFormat = () => {
    const sel = window.getSelection()
    if (!sel?.rangeCount) return
    const node = sel.anchorNode?.parentElement
    if (node) {
      const cs = window.getComputedStyle(node)
      setCopiedStyle({ fontWeight: cs.fontWeight, fontStyle: cs.fontStyle, color: cs.color, fontSize: cs.fontSize, fontFamily: cs.fontFamily })
    }
  }

  const pasteFormat = () => {
    if (!copiedStyle) return
    if (copiedStyle.fontWeight) run('bold')
    if (copiedStyle.fontStyle === 'italic') run('italic')
    if (copiedStyle.fontSize) run('fontSize', '4')
  }

  const clearFormat = () => run('removeFormat')

  const doReplaceAll = () => {
    if (!findText) return
    const newPages = replaceInDoc(doc.pages, findText, replaceText)
    onChange({ ...doc, pages: newPages, updatedAt: Date.now() })
  }

  const btn = (label, onClick, active = false, title = '') => (
    <button type="button" title={title} onClick={onClick} disabled={readOnly || doc.locked} style={{
      padding: '5px 8px', fontSize: 11, borderRadius: 6, cursor: readOnly || doc.locked ? 'default' : 'pointer',
      border: `1px solid ${active ? T.accent : T.border}`, background: active ? `${T.accent}18` : T.bg,
      color: T.ink, fontWeight: active ? 700 : 500, opacity: doc.locked ? 0.5 : 1,
    }}>{label}</button>
  )

  const pageStyle = {
    width: PAGE_W,
    minHeight: PAGE_H,
    background: '#fff',
    boxShadow: '0 2px 12px rgba(0,0,0,.12)',
    padding: `${doc.settings?.marginMm || 20}px`,
    boxSizing: 'border-box',
    fontFamily: doc.fontFamily,
    fontSize: doc.fontSize,
    lineHeight: doc.lineHeight,
    color: '#1c1c24',
    outline: 'none',
    margin: doc.viewMode === 'continuous' ? '0 0 24px' : undefined,
  }

  const renderPage = (pg, index) => (
    <div key={pg.id} style={{ position: 'relative', marginBottom: doc.viewMode === 'pages' ? 32 : 0 }}>
      {doc.pageNumbers && (
        <div style={{ textAlign: 'center', fontSize: 11, color: T.muted, marginBottom: 6 }}>
          Page {index + 1} / {doc.pages.length}
        </div>
      )}
      <div
        ref={(el) => { if (pageRefs) pageRefs.current[index] = el }}
        style={{ ...pageStyle, transform: `scale(${doc.zoom || 1})`, transformOrigin: 'top center' }}
      >
        <div
          ref={(el) => {
            editorRefs.current[index] = el
            if (el && el.innerHTML !== (pg.html || '<p></p>') && document.activeElement !== el) {
              el.innerHTML = pg.html || '<p></p>'
            }
          }}
          contentEditable={!readOnly && !doc.locked && !readingMode}
          suppressContentEditableWarning
          spellCheck
          onInput={() => handleInput(index)}
          onFocus={() => setActivePage(index)}
          style={{ outline: 'none', minHeight: PAGE_H - (doc.settings?.marginMm || 20) * 2 }}
          className="forma-doc-page"
        />
      </div>
      {doc.viewMode === 'pages' && index < doc.pages.length - 1 && (
        <div style={{ textAlign: 'center', margin: '16px 0', color: T.muted, fontSize: 11 }}>— Séparateur de page —</div>
      )}
    </div>
  )

  const toolbar = !readingMode && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'center' }}>
      {btn('↶', () => run('undo'), false, 'Annuler')}
      {btn('↷', () => run('redo'), false, 'Rétablir')}
      <span style={{ width: 1, height: 20, background: T.border }} />
      {btn('H1', () => run('formatBlock', 'h1'))}
      {btn('H2', () => run('formatBlock', 'h2'))}
      {btn('H3', () => run('formatBlock', 'h3'))}
      {btn('P', () => run('formatBlock', 'p'))}
      {btn('B', () => run('bold'))}
      {btn('I', () => run('italic'))}
      {btn('U', () => run('underline'))}
      {btn('S', () => run('strikeThrough'))}
      <select value={doc.fontFamily} onChange={(e) => onChange({ ...doc, fontFamily: e.target.value })} disabled={readOnly || doc.locked} style={{ padding: '4px 6px', fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink }}>
        {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <select value={doc.fontSize} onChange={(e) => onChange({ ...doc, fontSize: parseInt(e.target.value, 10) })} disabled={readOnly || doc.locked} style={{ padding: '4px 6px', fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, width: 52 }}>
        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input type="color" title="Couleur texte" defaultValue="#1c1c24" onChange={(e) => run('foreColor', e.target.value)} disabled={readOnly || doc.locked} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer' }} />
      <input type="color" title="Surlignage" defaultValue="#ffff00" onChange={(e) => run('hiliteColor', e.target.value)} disabled={readOnly || doc.locked} style={{ width: 28, height: 28, border: 'none', cursor: 'pointer' }} />
      {btn('⬅', () => run('justifyLeft'))}
      {btn('⬌', () => run('justifyCenter'))}
      {btn('➡', () => run('justifyRight'))}
      {btn('≡', () => run('justifyFull'))}
      {btn('•', () => run('insertUnorderedList'))}
      {btn('1.', () => run('insertOrderedList'))}
      {btn('☑', () => insertHtml('<ul style="list-style:none;padding:0"><li>☐ Item</li></ul>'))}
      {btn('❝', () => run('formatBlock', 'blockquote'))}
      {btn('</>', () => insertHtml('<pre style="background:#f4f4f4;padding:12px;border-radius:6px;font-family:monospace"><code>code</code></pre><p></p>'))}
      {btn('—', () => run('insertHorizontalRule'))}
      {btn('🔗', insertLink)}
      {btn('🖼', insertImage)}
      {btn('⊞', () => insertHtml('<table border="1" cellpadding="6" style="border-collapse:collapse;width:100%"><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table><p></p>'))}
      {btn('📦', () => insertHtml('<div style="border:2px solid #ccd3dc;border-radius:8px;padding:16px;margin:12px 0;background:#fafbfc"><p>Encadré</p></div><p></p>'))}
      {btn('↦', () => run('indent'))}
      {btn('↤', () => run('outdent'))}
      {btn('⎘', copyFormat, false, 'Copier le style')}
      {btn('⌫', clearFormat, false, 'Effacer mise en forme')}
      <span style={{ width: 1, height: 20, background: T.border }} />
      {btn('+ page', () => { onChange(addPage(doc)); setActivePage(doc.pages.length) })}
      {btn('⎘ page', () => onChange(duplicatePage(doc, activePage)))}
      {btn('− page', () => { if (doc.pages.length > 1) { onChange(deletePage(doc, activePage)); setActivePage(Math.max(0, activePage - 1)) } })}
      {btn('🔍', () => setFindOpen((v) => !v))}
      {btn(doc.viewMode === 'pages' ? 'Continu' : 'Pages', () => onChange({ ...doc, viewMode: doc.viewMode === 'pages' ? 'continuous' : 'pages' }))}
      {btn('📖', () => setReadingMode(true), readingMode)}
      {btn('⛶', () => setFullscreen((v) => !v), fullscreen)}
      {btn(doc.locked ? '🔒' : '🔓', () => onChange({ ...doc, locked: !doc.locked }), doc.locked)}
      <select
        value=""
        onChange={(e) => { if (e.target.value) insertSheet(e.target.value); e.target.value = '' }}
        disabled={readOnly || doc.locked}
        style={{ padding: '4px 6px', fontSize: 11, borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, maxWidth: 140 }}
      >
        <option value="">📊 Tableur…</option>
        {sheets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <span style={{ fontSize: 11, color: T.muted, marginLeft: 'auto' }}>
        Zoom
        <input type="range" min={0.5} max={1.5} step={0.05} value={doc.zoom || 1} onChange={(e) => onChange({ ...doc, zoom: parseFloat(e.target.value) })} style={{ verticalAlign: 'middle', marginLeft: 6, width: 80 }} />
      </span>
    </div>
  )

  const shellStyle = fullscreen ? {
    position: 'fixed', inset: 0, zIndex: 9999, background: T.bg, display: 'flex', flexDirection: 'column', padding: 16,
  } : { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }

  return (
    <div ref={containerRef} style={shellStyle}>
      <style>{`
        .forma-doc-page h1{font-size:2em;font-weight:800;margin:0.5em 0 0.3em}
        .forma-doc-page h2{font-size:1.5em;font-weight:700;margin:0.5em 0 0.3em}
        .forma-doc-page h3{font-size:1.2em;font-weight:600;margin:0.4em 0 0.2em}
        .forma-doc-page p{margin:0 0 ${doc.paragraphSpacing || 12}px}
        .forma-doc-page blockquote{border-left:4px solid #ccc;margin:12px 0;padding:8px 16px;color:#555;background:#fafafa}
        .forma-doc-page table{border-collapse:collapse;width:100%;margin:12px 0}
        .forma-doc-page td,.forma-doc-page th{border:1px solid #ccc;padding:6px 8px}
      `}</style>

      {readingMode ? (
        <div style={{ padding: 20, maxWidth: 860, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <strong>{doc.name}</strong>
            <button type="button" onClick={() => setReadingMode(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', color: T.ink }}>Quitter lecture</button>
          </div>
          {doc.pages.map((pg, i) => (
            <div key={pg.id} style={{ ...pageStyle, boxShadow: 'none', marginBottom: 24 }} dangerouslySetInnerHTML={{ __html: pg.html }} />
          ))}
        </div>
      ) : (
        <>
          {toolbar}
          {findOpen && (
            <div style={{ display: 'flex', gap: 8, padding: '8px 0', alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={findText} onChange={(e) => setFindText(e.target.value)} placeholder="Rechercher…" style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }} />
              <input value={replaceText} onChange={(e) => setReplaceText(e.target.value)} placeholder="Remplacer par…" style={{ padding: '6px 10px', borderRadius: 6, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }} />
              {btn('Remplacer tout', doReplaceAll)}
              <span style={{ fontSize: 11, color: T.muted }}>{findHits.length} page(s) trouvée(s)</span>
            </div>
          )}
          <div style={{ display: 'flex', flex: 1, minHeight: 0, gap: 12, marginTop: 8 }}>
            <aside style={{ width: 160, flexShrink: 0, overflow: 'auto', borderRight: `1px solid ${T.border}`, paddingRight: 8 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {btn('Pages', () => setSidebar('pages'), sidebar === 'pages')}
                {btn('TDM', () => setSidebar('toc'), sidebar === 'toc')}
              </div>
              {sidebar === 'pages' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {doc.pages.map((pg, i) => (
                    <button key={pg.id} type="button" onClick={() => setActivePage(i)} style={{
                      border: activePage === i ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
                      borderRadius: 6, padding: 4, background: T.surface, cursor: 'pointer',
                    }}>
                      <DocPreview doc={doc} pageIndex={i} scale={0.14} />
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 4 }}>p.{i + 1}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12 }} dangerouslySetInnerHTML={{ __html: tocHtml }} onClick={(e) => {
                  const a = e.target.closest('a[data-page]')
                  if (a) { e.preventDefault(); setActivePage(parseInt(a.dataset.page, 10)) }
                }} />
              )}
            </aside>
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {doc.viewMode === 'continuous'
                ? doc.pages.map((pg, i) => renderPage(pg, i))
                : renderPage(page, activePage)}
            </div>
          </div>
        </>
      )}
      {fullscreen && (
        <button type="button" onClick={() => setFullscreen(false)} style={{ position: 'fixed', top: 12, right: 12, zIndex: 10000, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>✕ Fermer</button>
      )}
    </div>
  )
}
