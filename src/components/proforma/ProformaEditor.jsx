import { useCallback, useEffect, useRef, useState } from 'react'
import { PF_DARK } from '@/lib/proforma/constants'
import { useProformaEditor } from '@/hooks/useProformaEditor'
import ProformaCanvas from './ProformaCanvas'
import ProformaToolbar from './ProformaToolbar'
import ProformaLayersPanel from './ProformaLayersPanel'
import ProformaColorsPanel from './ProformaColorsPanel'
import { Panel } from './ProformaLayersPanel'
import { exportProformaPng, exportProformaPdf, downloadBlob, downloadDataUrl } from '@/lib/proforma/export'
import { formatLabel } from '@/lib/pageFormats'

export default function ProformaEditor({ doc, setDoc, onBack, onInsertNotebook, addNotification }) {
  const [panels, setPanels] = useState({ layers: true, colors: true, props: true })
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 })
  const [vp, setVp] = useState({ zoom: 1 })
  const viewportRef = useRef({ zoom: 1, panX: 0, panY: 0 })

  const editor = useProformaEditor(doc, setDoc, {
    viewportRef,
    viewSize,
  })

  const togglePanel = (key) => setPanels((p) => ({ ...p, [key]: !p[key] }))

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
      <header style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 14px',
        borderBottom: `1px solid ${PF_DARK.border}`,
        background: PF_DARK.panel,
        flexShrink: 0,
      }}>
        <button type="button" onClick={onBack} style={headerBtn}>← Bibliothèque</button>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15 }}>
          Proforma
        </div>
        <input
          value={doc.name}
          onChange={(e) => setDoc((d) => ({ ...d, name: e.target.value }))}
          style={{
            flex: 1,
            maxWidth: 280,
            background: PF_DARK.surface,
            border: `1px solid ${PF_DARK.border}`,
            borderRadius: 8,
            padding: '6px 10px',
            color: PF_DARK.ink,
            fontSize: 12,
            fontWeight: 600,
          }}
        />
        <span style={{ fontSize: 10, color: PF_DARK.muted }}>
          {formatLabel(doc.formatId)} · {doc.width}×{doc.height}px
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: PF_DARK.muted }}>
          <button type="button" style={headerBtn} onClick={() => vp.zoomBy?.(0.8)} title="Zoom −">−</button>
          <span style={{ minWidth: 42, textAlign: 'center', color: PF_DARK.ink, fontWeight: 700 }}>{Math.round((vp.zoom || 1) * 100)}%</span>
          <button type="button" style={headerBtn} onClick={() => vp.zoomBy?.(1.25)} title="Zoom +">+</button>
          <button type="button" style={headerBtn} onClick={() => vp.resetViewport?.()} title="Reset zoom">100%</button>
        </div>
        <button type="button" onClick={() => editor.commitDoc((d) => ({ ...d, showGrid: !d.showGrid }), { recordHistory: false })} style={headerBtn}>
          {doc.showGrid ? '▦ Grille' : 'Grille'}
        </button>
        <button type="button" onClick={() => editor.commitDoc((d) => ({ ...d, snapGrid: !d.snapGrid }), { recordHistory: false })} style={headerBtn}>
          {doc.snapGrid ? '🧲 Snap' : 'Snap'}
        </button>
        <button type="button" onClick={handleExportPng} style={headerBtn}>PNG</button>
        <button type="button" onClick={handleExportPdf} style={headerBtn}>PDF</button>
        {onInsertNotebook && (
          <button type="button" onClick={onInsertNotebook} style={{ ...headerBtn, color: PF_DARK.accent, fontWeight: 700 }}>
            → Carnet
          </button>
        )}
      </header>

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
          width: 260,
          background: PF_DARK.panel,
          borderLeft: `1px solid ${PF_DARK.border}`,
          overflowY: 'auto',
          padding: 10,
          flexShrink: 0,
        }}>
          {panels.layers && (
            <ProformaLayersPanel
              doc={doc}
              setDoc={setDoc}
              activeLayerId={doc.activeLayerId}
              setActiveLayerId={editor.setActiveLayerId}
              commitDoc={editor.commitDoc}
            />
          )}
          {panels.colors && (
            <ProformaColorsPanel
              color={editor.color}
              setColor={editor.setColor}
              brush={editor.brush}
              setBrush={editor.setBrush}
              tool={editor.tool}
            />
          )}
          <Panel title="Document">
            <label style={labelStyle}>
              Fond
              <input
                type="color"
                value={doc.bgColor || '#ffffff'}
                onChange={(e) => editor.commitDoc((d) => ({ ...d, bgColor: e.target.value }), { recordHistory: false })}
                style={{ width: '100%', height: 28, marginTop: 4 }}
              />
            </label>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={!!doc.transparent}
                onChange={(e) => editor.commitDoc((d) => ({ ...d, transparent: e.target.checked }), { recordHistory: false })}
              />
              Fond transparent (export PNG)
            </label>
            <label style={{ ...labelStyle, marginTop: 8 }}>
              Rotation vue ({doc.viewRotation || 0}°)
              <input
                type="range"
                min={0}
                max={359}
                value={doc.viewRotation || 0}
                onChange={(e) => editor.commitDoc((d) => ({ ...d, viewRotation: parseInt(e.target.value, 10) }), { recordHistory: false })}
                style={{ width: '100%' }}
              />
            </label>
            <button
              type="button"
              style={{ ...headerBtn, width: '100%', marginTop: 8 }}
              onClick={() => editor.commitDoc((d) => ({ ...d, viewRotation: 0 }), { recordHistory: false })}
            >
              Reset rotation
            </button>
          </Panel>
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
