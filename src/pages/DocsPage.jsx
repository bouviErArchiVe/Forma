import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { loadLocalNotebooks } from '@/lib/projectPersistence'
import useAppStore from '@/stores/useAppStore'
import BrandLogo from '@/components/BrandLogo'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassButton from '@/components/ui/GlassButton'
import DocEditor from '@/components/docs/DocEditor'
import DocPreview, { docPlainSnippet } from '@/components/docs/DocPreview'
import { DOC_TEMPLATES } from '@/lib/docs/model'
import {
  listDocs, createAndSave, saveDoc, deleteDoc, duplicateDoc,
  searchDocs, sortDocs, autosaveDoc, getDoc,
} from '@/lib/docs/persistence'
import { exportDocPdf, exportDocTxt, exportDocMd, exportDocPng, renderPageToDataUrl } from '@/lib/docs/export'
import { exportDocDocx } from '@/lib/docs/exportDocx'

export default function DocsPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { userId } = useAuth()
  const { addNotification, setActiveNotebook, setPendingDocInsert } = useAppStore()

  const [view, setView] = useState('library')
  const [docs, setDocs] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [doc, setDoc] = useState(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('updated')
  const [sortDir, setSortDir] = useState('desc')
  const [notebooks, setNotebooks] = useState([])
  const [insertModal, setInsertModal] = useState(false)
  const [insertMode, setInsertMode] = useState('live')
  const [templateModal, setTemplateModal] = useState(false)
  const pageRefs = useRef([])

  const refresh = useCallback(() => {
    setDocs(sortDocs(searchDocs(search), sortBy, sortDir))
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

  const openDoc = useCallback((id) => {
    const d = getDoc(id)
    if (!d) return
    setActiveId(id)
    setDoc(JSON.parse(JSON.stringify(d)))
    setView('editor')
  }, [])

  const handleNew = useCallback((templateId = 'blank') => {
    const tpl = DOC_TEMPLATES[templateId]
    const d = createAndSave(tpl?.label || 'Nouveau document', templateId)
    setActiveId(d.id)
    setDoc(JSON.parse(JSON.stringify(d)))
    setView('editor')
    setTemplateModal(false)
    refresh()
    addNotification('Document créé', 'success')
  }, [refresh, addNotification])

  const handleChange = useCallback((next) => {
    setDoc(next)
    autosaveDoc(next)
  }, [])

  const handleRename = useCallback((name) => {
    if (!doc) return
    const next = { ...doc, name: name.trim() || doc.name }
    setDoc(next)
    saveDoc(next)
    refresh()
  }, [doc, refresh])

  const handleDuplicate = useCallback((id) => {
    if (duplicateDoc(id)) {
      refresh()
      addNotification('Document dupliqué', 'success')
    }
  }, [refresh, addNotification])

  const handleDelete = useCallback((id) => {
    deleteDoc(id)
    if (activeId === id) {
      setView('library')
      setActiveId(null)
      setDoc(null)
    }
    refresh()
    addNotification('Document supprimé', 'info')
  }, [activeId, refresh, addNotification])

  const handleExport = useCallback(async (type) => {
    if (!doc) return
    const safe = (doc.name || 'document').replace(/[^\w\- ]+/g, '_')
    if (type === 'txt') exportDocTxt(doc)
    else if (type === 'md') exportDocMd(doc)
    else if (type === 'png') await exportDocPng(pageRefs.current[0], `${safe}.png`)
    else if (type === 'pdf') await exportDocPdf(pageRefs.current.filter(Boolean), `${safe}.pdf`)
    else if (type === 'docx') await exportDocDocx(doc)
    addNotification(`Export ${type.toUpperCase()} lancé`, 'success')
  }, [doc, addNotification])

  const confirmInsert = useCallback(async (nb) => {
    if (!doc) return
    saveDoc(doc)
    let imageSrc = null
    if (insertMode === 'image' && pageRefs.current[0]) {
      try { imageSrc = await renderPageToDataUrl(pageRefs.current[0]) } catch { /* ignore */ }
    }
    setPendingDocInsert({
      notebookId: nb.id,
      docId: doc.id,
      name: doc.name,
      mode: insertMode,
      imageSrc,
      w: 300,
      h: 220,
    })
    setActiveNotebook(nb)
    setInsertModal(false)
    addNotification(`Document « ${doc.name} » envoyé vers « ${nb.title} »`, 'success')
    navigate(`/editor/${nb.id}`)
  }, [doc, insertMode, setPendingDocInsert, setActiveNotebook, addNotification, navigate])

  const listed = useMemo(() => docs, [docs])

  if (view === 'editor' && doc) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, color: T.ink, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          padding: '12px 18px', borderBottom: `1px solid ${T.border}`, background: T.surface,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 20,
        }}>
          <button type="button" onClick={() => { saveDoc(doc); setView('library'); refresh() }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.accent, fontWeight: 600 }}>
            ← Bibliothèque
          </button>
          <input
            value={doc.name}
            onChange={(e) => setDoc({ ...doc, name: e.target.value })}
            onBlur={(e) => handleRename(e.target.value)}
            style={{ flex: 1, minWidth: 160, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, border: 'none', background: 'transparent', color: T.ink, outline: 'none' }}
          />
          <GlassButton T={T} size="sm" onClick={() => setInsertModal(true)}>Insérer dans la page</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('txt')}>TXT</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('md')}>MD</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('docx')}>DOCX</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('png')}>PNG</GlassButton>
          <GlassButton T={T} size="sm" onClick={() => handleExport('pdf')}>PDF</GlassButton>
        </header>
        <main style={{ flex: 1, minHeight: 0, padding: '8px 12px 20px', display: 'flex', flexDirection: 'column' }}>
          <DocEditor doc={doc} onChange={handleChange} T={T} pageRefs={pageRefs} />
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
    <div style={{ minHeight: '100vh', background: T.bg, color: T.ink }}>
      <header style={{
        padding: '14px 20px', borderBottom: `1px solid ${T.border}`, background: T.surface,
        display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: T.accent, fontWeight: 600 }}>
          ← Accueil
        </button>
        <BrandLogo T={T} size={28} />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>FormaDoc</div>
          <div style={{ fontSize: 11, color: T.muted }}>Traitement de texte · {listed.length} document{listed.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un document…"
            style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 11, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <select value={`${sortBy}-${sortDir}`} onChange={(e) => { const [b, d] = e.target.value.split('-'); setSortBy(b); setSortDir(d) }} style={{ padding: '9px 10px', borderRadius: 8, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 12 }}>
          <option value="updated-desc">Plus récent</option>
          <option value="updated-asc">Plus ancien</option>
          <option value="name-asc">Nom A→Z</option>
          <option value="name-desc">Nom Z→A</option>
        </select>
        <GlassButton T={T} size="md" onClick={() => setTemplateModal(true)}>+ Nouveau document</GlassButton>
      </header>

      <main style={{ padding: '20px 24px 40px', maxWidth: 1200, margin: '0 auto' }}>
        {listed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: T.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Aucun document</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Rédigez cours, rapports, fiches techniques et devis</div>
            <GlassButton T={T} size="md" onClick={() => setTemplateModal(true)}>Nouveau document</GlassButton>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {listed.map((d) => (
              <div key={d.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 150, overflow: 'hidden', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${T.border}` }}>
                  <DocPreview doc={d} pageIndex={0} scale={0.18} />
                </div>
                <div style={{ padding: '12px 14px', flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 6, lineHeight: 1.4 }}>{docPlainSnippet(d, 80)}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>
                    {d.pages?.length || 1} p. · Modifié {new Date(d.updatedAt).toLocaleString('fr-FR')}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <GlassButton T={T} size="sm" onClick={() => openDoc(d.id)}>Ouvrir</GlassButton>
                    <GlassButton T={T} size="sm" onClick={() => handleDuplicate(d.id)}>Dupliquer</GlassButton>
                    <GlassButton T={T} size="sm" onClick={() => handleDelete(d.id)} style={{ color: '#e94560' }}>Supprimer</GlassButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {templateModal && (
        <ModalOverlay onClose={() => setTemplateModal(false)}>
          <div style={{ background: T.surface, borderRadius: 14, padding: 20, width: 'min(480px,92vw)', border: `1px solid ${T.border}` }}>
            <h3 style={{ margin: '0 0 14px', fontFamily: "'Syne',sans-serif" }}>Choisir un modèle</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
              {Object.entries(DOC_TEMPLATES).map(([id, tpl]) => (
                <button key={id} type="button" onClick={() => handleNew(id)} style={{
                  padding: '14px 10px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg,
                  cursor: 'pointer', color: T.ink, textAlign: 'center', fontSize: 12, fontWeight: 600,
                }}>
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  )
}
