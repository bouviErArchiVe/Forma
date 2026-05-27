import { useCallback, useEffect, useRef, useState } from 'react'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import { PF_DARK } from '@/lib/proforma/constants'
import { useProformaEditor } from '@/hooks/useProformaEditor'
import ProformaCanvas from './ProformaCanvas'
import ProformaToolbar from './ProformaToolbar'
import { exportProformaPng, exportProformaPdf, downloadBlob, downloadDataUrl } from '@/lib/proforma/export'
import { formatLabel } from '@/lib/pageFormats'
import { PF_PALETTE } from '@/lib/proforma/tools'

/** Proforma V1 — éditeur minimal stable */
export default function ProformaEditor({ doc, setDoc, onBack, onInsertNotebook, addNotification }) {
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 })
  const [vp, setVp] = useState({ zoom: 1 })
  const viewportRef = useRef({ zoom: 1, panX: 0, panY: 0 })

  const editor = useProformaEditor(doc, setDoc, { viewportRef, viewSize })

  const handleExportPng = useCallback(async () => {
    if (!doc) return
    const url = await exportProformaPng(doc, { transparent: doc.transparent })
    downloadDataUrl(url, `${doc.name}.png`)
    addNotification?.('PNG exporté', 'success')
  }, [doc, addNotification])

  const handleExportPdf = useCallback(async () => {
    if (!doc) return
    const blob = await exportProformaPdf(doc, { title: doc.name })
    downloadBlob(blob, `${doc.name}.pdf`)
    addNotification?.('PDF exporté', 'success')
  }, [doc, addNotification])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        editor.undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        editor.redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editor])

  if (!doc) return null

  return (
    <div className="proforma-editor" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: PF_DARK.bg, color: PF_DARK.ink }}>
      <FormaModuleHeader
        title="Proforma"
        dark={PF_DARK}
        style={{ height: 48, padding: '0 14px', background: PF_DARK.panel, borderBottom: `1px solid ${PF_DARK.border}` }}
      >
        <button type="button" onClick={onBack} style={headerBtn}>← Projets</button>
        <input
          value={doc.name}
          onChange={(e) => setDoc((d) => ({ ...d, name: e.target.value }))}
          style={{
            flex: 1, maxWidth: 220, background: PF_DARK.surface,
            border: `1px solid ${PF_DARK.border}`, borderRadius: 8,
            padding: '6px 10px', color: PF_DARK.ink, fontSize: 12, fontWeight: 600,
          }}
        />
        <span style={{ fontSize: 10, color: PF_DARK.muted }}>
          {formatLabel(doc.formatId)} · {Math.round((vp.zoom || 1) * 100)}%
        </span>
        <button type="button" style={headerBtn} onClick={() => vp.zoomBy?.(0.8)}>−</button>
        <button type="button" style={headerBtn} onClick={() => vp.zoomBy?.(1.25)}>+</button>
        <button type="button" style={headerBtn} onClick={() => vp.resetViewport?.()}>100%</button>
        <button type="button" onClick={handleExportPng} style={headerBtn}>PNG</button>
        <button type="button" onClick={handleExportPdf} style={headerBtn}>PDF</button>
        {onInsertNotebook && (
          <button type="button" onClick={onInsertNotebook} style={{ ...headerBtn, color: PF_DARK.accent, fontWeight: 700 }}>
            → Carnet
          </button>
        )}
      </FormaModuleHeader>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ProformaToolbar
          tool={editor.tool}
          setTool={editor.setTool}
          onUndo={editor.undo}
          onRedo={editor.redo}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
        />

        <ProformaCanvas
          doc={doc}
          editor={editor}
          panToolActive={editor.tool === 'hand'}
          viewportState={(v) => { viewportRef.current = v; setVp(v) }}
          onViewSize={setViewSize}
        />

        <aside style={{
          width: 200,
          background: PF_DARK.panel,
          borderLeft: `1px solid ${PF_DARK.border}`,
          padding: 12,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: PF_DARK.muted, marginBottom: 8 }}>COULEUR</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {PF_PALETTE.slice(0, 10).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => editor.setColor(c)}
                style={{
                  width: 24, height: 24, borderRadius: 6, background: c, cursor: 'pointer',
                  border: editor.color === c ? `2px solid ${PF_DARK.accent}` : `1px solid ${PF_DARK.border}`,
                }}
              />
            ))}
          </div>
          <label style={labelStyle}>
            Épaisseur ({Math.round(editor.brush.size || 2.5)}px)
            <input
              type="range"
              min={1}
              max={editor.tool === 'eraser' ? 48 : 12}
              value={editor.brush.size || (editor.tool === 'eraser' ? 18 : 2.5)}
              onChange={(e) => editor.setBrush({ size: parseFloat(e.target.value) })}
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </aside>
      </div>
    </div>
  )
}

const headerBtn = {
  background: 'none',
  border: 'none',
  color: PF_DARK.muted,
  cursor: 'pointer',
  fontSize: 11,
  fontWeight: 600,
  padding: '4px 8px',
}

const labelStyle = {
  display: 'block',
  fontSize: 10,
  color: PF_DARK.muted,
  fontWeight: 600,
}
