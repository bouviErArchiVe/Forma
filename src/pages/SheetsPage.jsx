import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { loadLocalNotebooks } from '@/lib/projectPersistence'
import useAppStore from '@/stores/useAppStore'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassButton from '@/components/ui/GlassButton'
import SpreadsheetGrid from '@/components/spreadsheet/SpreadsheetGrid'
import SpreadsheetPreview from '@/components/spreadsheet/SpreadsheetPreview'
import {
  listSheets, createAndSave, saveSheet, deleteSheet, duplicateSheet,
  searchSheets, sortSheets, autosaveSheet, getSheet,
} from '@/lib/spreadsheet/persistence'
import { exportCsv, exportJson, exportPngFromElement, exportPdfFromElement, renderSheetToDataUrl } from '@/lib/spreadsheet/export'

export default function SheetsPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { userId } = useAuth()
  const { addNotification, setActiveNotebook, setPendingSpreadsheetInsert } = useAppStore()

  const [view, setView] = useState('library')
  const [sheets, setSheets] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [sheet, setSheet] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('updated')
  const [sortDir, setSortDir] = useState('desc')
  const [notebooks, setNotebooks] = useState([])
  const [insertModal, setInsertModal] = useState(false)
  const [insertMode, setInsertMode] = useState('live')
  const gridRef = useRef(null)

  const refresh = useCallback(() => {
    setSheets(sortSheets(searchSheets(search), sortBy, sortDir))
  }, [search, sortBy, sortDir])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const local = loadLocalNotebooks()
      if (userId) {
        try {
          const { data } = await supabase
            .from('notebooks')
            .select('id,title,subject,updated_at')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
          if (!cancelled && data?.length) { setNotebooks(data); return }
        } catch { /* offline */ }
      }
      if (!cancelled) setNotebooks(local)
    })()
    return () => { cancelled = true }
  }, [userId])

  const openSheet = useCallback((id) => {
    const s = getSheet(id)
    if (!s) return
    setActiveId(id)
    setSheet(JSON.parse(JSON.stringify(s)))
    setView('editor')
  }, [])

  const handleNew = useCallback(() => {
    const s = createAndSave('Nouveau tableau')
    setActiveId(s.id)
    setSheet(JSON.parse(JSON.stringify(s)))
    setView('editor')
    refresh()
    addNotification('Tableau créé', 'success')
  }, [refresh, addNotification])

  const handleChange = useCallback((next) => {
    setSheet(next)
    autosaveSheet(next)
  }, [])

  const handleRename = useCallback((name) => {
    if (!sheet) return
    const next = { ...sheet, name: name.trim() || sheet.name }
    setSheet(next)
    saveSheet(next)
    refresh()
  }, [sheet, refresh])

  const handleDuplicate = useCallback((id) => {
    const copy = duplicateSheet(id)
    if (copy) {
      refresh()
      addNotification('Tableau dupliqué', 'success')
    }
  }, [refresh, addNotification])

  const handleDelete = useCallback((id) => {
    deleteSheet(id)
    if (activeId === id) {
      setView('library')
      setActiveId(null)
      setSheet(null)
    }
    refresh()
    addNotification('Tableau supprimé', 'info')
  }, [activeId, refresh, addNotification])

  const handleExport = useCallback(async (type) => {
    if (!sheet) return
    const safe = (sheet.name || 'tableau').replace(/[^\w\- ]+/g, '_')
    if (type === 'csv') exportCsv(sheet)
    else if (type === 'json') exportJson(sheet)
    else if (type === 'png') await exportPngFromElement(gridRef.current, `${safe}.png`)
    else if (type === 'pdf') await exportPdfFromElement(gridRef.current, `${safe}.pdf`)
    addNotification(`Export ${type.toUpperCase()} lancé`, 'success')
  }, [sheet, addNotification])

  const confirmInsert = useCallback(async (nb) => {
    if (!sheet) return
    saveSheet(sheet)
    let imageSrc = null
    if (insertMode === 'image' && gridRef.current) {
      try { imageSrc = await renderSheetToDataUrl(gridRef.current) } catch { /* ignore */ }
    }
    setPendingSpreadsheetInsert({
      notebookId: nb.id,
      sheetId: sheet.id,
      name: sheet.name,
      mode: insertMode,
      imageSrc,
      w: 340,
      h: 200,
    })
    setActiveNotebook(nb)
    setInsertModal(false)
    addNotification(`Tableau « ${sheet.name} » envoyé vers « ${nb.title} »`, 'success')
    navigate(`/editor/${nb.id}`)
  }, [sheet, insertMode, setPendingSpreadsheetInsert, setActiveNotebook, addNotification, navigate])

  const listed = useMemo(() => sheets, [sheets])

  if (view === 'editor' && sheet) {
    return (
      <div style={{ minHeight: '100dvh', background: T.bg, color: T.ink, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          padding: '12px 18px', borderBottom: `1px solid ${T.border}`, background: T.surface,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 20,
        }}>
          <button type="button" onClick={() => { saveSheet(sheet); setView('library'); refresh() }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.accent, fontWeight: 600 }}>
            ← Bibliothèque
          </button>
          <input
            value={sheet.name}
            onChange={(e) => setSheet({ ...sheet, name: e.target.value })}
            onBlur={(e) => handleRename(e.target.value)}
            style={{ flex: 1, minWidth: 160, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, border: 'none', background: 'transparent', color: T.ink, outline: 'none' }}
          />
          <GlassButton T={T} size="sm" onClick={() => setInsertModal(true)}>Insérer dans la page</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('csv')}>CSV</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('json')}>JSON</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('png')}>PNG</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('pdf')}>PDF</GlassButton>
          <button
            type="button"
            title={sheet.locked ? 'Déverrouiller' : 'Verrouiller'}
            onClick={() => handleChange({ ...sheet, locked: !sheet.locked })}
            style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 14 }}
          >
            {sheet.locked ? '🔒' : '🔓'}
          </button>
        </header>
        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '12px 16px max(24px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column' }}>
          <SpreadsheetGrid sheet={sheet} onChange={handleChange} T={T} gridRef={gridRef} readOnly={!!sheet.locked} />
        </main>

        {insertModal && (
          <ModalOverlay onClose={() => setInsertModal(false)}>
            <div style={{ background: T.surface, borderRadius: 14, padding: 20, width: 'min(420px,92vw)', border: `1px solid ${T.border}` }}>
              <h3 style={{ margin: '0 0 12px', fontFamily: "'Syne',sans-serif" }}>Insérer dans un carnet</h3>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button type="button" onClick={() => setInsertMode('live')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${insertMode === 'live' ? T.accent : T.border}`, background: insertMode === 'live' ? `${T.accent}15` : T.bg, cursor: 'pointer', color: T.ink, fontSize: 12 }}>
                  Objet modifiable (lié)
                </button>
                <button type="button" onClick={() => setInsertMode('image')} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${insertMode === 'image' ? T.accent : T.border}`, background: insertMode === 'image' ? `${T.accent}15` : T.bg, cursor: 'pointer', color: T.ink, fontSize: 12 }}>
                  Image figée
                </button>
              </div>
              <div style={{ maxHeight: 280, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {notebooks.length === 0 ? (
                  <div style={{ color: T.muted, fontSize: 13 }}>Aucun carnet disponible</div>
                ) : notebooks.map((nb) => (
                  <button key={nb.id} type="button" onClick={() => confirmInsert(nb)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', color: T.ink }}>
                    <div style={{ fontWeight: 600 }}>{nb.title}</div>
                    {nb.subject && <div style={{ fontSize: 11, color: T.muted }}>{nb.subject}</div>}
                  </button>
                ))}
              </div>
            </div>
          </ModalOverlay>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, color: T.ink, display: 'flex', flexDirection: 'column' }}>
      <FormaModuleHeader
        title="FormaTab"
        subtitle={`${listed.length} tableau${listed.length !== 1 ? 'x' : ''}`}
        sticky
      >
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un tableau…"
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 11, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select value={`${sortBy}-${sortDir}`} onChange={(e) => { const [b, d] = e.target.value.split('-'); setSortBy(b); setSortDir(d) }} style={{ padding: '9px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }}>
          <option value="updated-desc">Plus récent</option>
          <option value="updated-asc">Plus ancien</option>
          <option value="name-asc">Nom A→Z</option>
          <option value="name-desc">Nom Z→A</option>
        </select>
        <GlassButton T={T} size="md" onClick={handleNew}>+ Nouveau tableau</GlassButton>
      </FormaModuleHeader>

      <main style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 24px max(40px, env(safe-area-inset-bottom))', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {listed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: T.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucun tableau</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Créez votre premier tableau pour cours, quantités, budgets…</div>
            <GlassButton T={T} size="md" onClick={handleNew}>Nouveau tableau</GlassButton>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {listed.map((s) => (
              <div key={s.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 140, overflow: 'hidden', background: '#fff', borderBottom: `1px solid ${T.border}` }}>
                  <SpreadsheetPreview sheet={s} maxRows={5} maxCols={5} compact />
                </div>
                <div style={{ padding: '12px 14px', flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
                    Modifié {new Date(s.updatedAt).toLocaleString('fr-FR')}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <GlassButton T={T} size="sm" onClick={() => openSheet(s.id)}>Ouvrir</GlassButton>
                    <GlassButton T={T} size="sm" onClick={() => handleDuplicate(s.id)}>Dupliquer</GlassButton>
                    <GlassButton T={T} size="sm" onClick={() => handleDelete(s.id)} style={{ color: '#e94560' }}>Supprimer</GlassButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
