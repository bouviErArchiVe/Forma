import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { loadLocalNotebooks } from '@/lib/projectPersistence'
import useAppStore from '@/stores/useAppStore'
import FormaModuleHeader from '@/components/FormaModuleHeader'
import GlassButton from '@/components/ui/GlassButton'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassPanel from '@/components/ui/GlassPanel'
import ProformaEditor from '@/components/proforma/ProformaEditor'
import ProformaNewDocModal from '@/components/proforma/ProformaNewDocModal'
import { PF_DARK } from '@/lib/proforma/constants'
import { formatLabel } from '@/lib/pageFormats'
import {
  listProformaDocs,
  createAndSaveProforma,
  saveProformaDoc,
  deleteProformaDoc,
  duplicateProformaDoc,
  getProformaDoc,
  searchProformaDocs,
} from '@/lib/proforma/persistence'
import { exportProformaPng } from '@/lib/proforma/export'

export default function ProformaPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { userId } = useAuth()
  const { addNotification, setActiveNotebook, setPendingProformaInsert } = useAppStore()

  const [view, setView] = useState('library')
  const [docs, setDocs] = useState([])
  const [doc, setDoc] = useState(null)
  const [search, setSearch] = useState('')
  const [newModal, setNewModal] = useState(false)
  const [insertModal, setInsertModal] = useState(false)
  const [notebooks, setNotebooks] = useState([])

  const refresh = useCallback(() => {
    setDocs(searchProformaDocs(search))
  }, [search])

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
    const d = getProformaDoc(id)
    if (!d) return
    setDoc(JSON.parse(JSON.stringify(d)))
    setView('editor')
  }, [])

  const handleCreate = useCallback((opts) => {
    const d = createAndSaveProforma({ name: opts.name || 'Sans titre', ...opts })
    setDoc(JSON.parse(JSON.stringify(d)))
    setView('editor')
    setNewModal(false)
    refresh()
    addNotification('Document Proforma créé', 'success')
  }, [refresh, addNotification])

  const handleBack = useCallback(() => {
    if (doc) saveProformaDoc(doc)
    setView('library')
    setDoc(null)
    refresh()
  }, [doc, refresh])

  const handleInsertPick = useCallback(async (nb) => {
    if (!doc) return
    const saved = saveProformaDoc(doc)
    const imageSrc = await exportProformaPng(saved)
    setPendingProformaInsert({
      proformaId: saved.id,
      notebookId: nb.id,
      name: saved.name,
      w: Math.min(420, saved.width),
      h: Math.min(320, saved.height),
      imageSrc,
    })
    setActiveNotebook(nb)
    setInsertModal(false)
    addNotification(`Proforma envoyé vers « ${nb.title} »`, 'success')
    navigate(`/editor/${nb.id}`)
  }, [doc, setPendingProformaInsert, setActiveNotebook, addNotification, navigate])

  if (view === 'editor' && doc) {
    return (
      <ProformaEditor
        doc={doc}
        setDoc={setDoc}
        onBack={handleBack}
        onInsertNotebook={() => setInsertModal(true)}
        addNotification={addNotification}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: PF_DARK.bg, color: PF_DARK.ink }}>
      <FormaModuleHeader title="Proforma" subtitle="Dessin V1 stable" dark={PF_DARK}>
        <GlassButton T={{ ...T, accent: PF_DARK.accent, ink: PF_DARK.ink, border: PF_DARK.border, bg: PF_DARK.surface }} accent onClick={() => setNewModal(true)}>
          + Nouveau
        </GlassButton>
      </FormaModuleHeader>

      <main style={{ padding: '24px 20px 48px', maxWidth: 1100, margin: '0 auto' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un dessin…"
          style={{
            width: '100%',
            maxWidth: 360,
            padding: '10px 12px',
            borderRadius: 10,
            border: `1px solid ${PF_DARK.border}`,
            background: PF_DARK.surface,
            color: PF_DARK.ink,
            marginBottom: 20,
            fontSize: 12,
          }}
        />

        {docs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: PF_DARK.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✏</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: PF_DARK.ink, marginBottom: 6 }}>Aucun dessin Proforma</div>
            <div style={{ fontSize: 12, marginBottom: 20 }}>Croquis techniques, détails constructifs, annotations pro…</div>
            <GlassButton T={{ ...T, accent: PF_DARK.accent, ink: PF_DARK.ink, border: PF_DARK.border, bg: PF_DARK.surface }} accent onClick={() => setNewModal(true)}>
              Créer un document
            </GlassButton>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {docs.map((d) => (
              <div
                key={d.id}
                style={{
                  borderRadius: 12,
                  border: `1px solid ${PF_DARK.border}`,
                  background: PF_DARK.panel,
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <div
                  onClick={() => openDoc(d.id)}
                  style={{
                    height: 120,
                    background: d.bgColor || '#fff',
                    borderBottom: `1px solid ${PF_DARK.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 28,
                    opacity: 0.85,
                  }}
                >
                  ✏
                </div>
                <div style={{ padding: '12px 14px' }} onClick={() => openDoc(d.id)}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: PF_DARK.muted }}>
                    {formatLabel(d.formatId)} · {new Date(d.updatedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, padding: '0 12px 12px' }}>
                  <MiniAct label="Ouvrir" onClick={() => openDoc(d.id)} />
                  <MiniAct label="Copie" onClick={() => { duplicateProformaDoc(d.id); refresh() }} />
                  <MiniAct label="🗑" danger onClick={() => { if (window.confirm('Supprimer ?')) { deleteProformaDoc(d.id); refresh() } }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ProformaNewDocModal open={newModal} onClose={() => setNewModal(false)} onCreate={handleCreate} />

      {insertModal && (
        <ModalOverlay onClose={() => setInsertModal(false)}>
          <GlassPanel T={{ ink: PF_DARK.ink, muted: PF_DARK.muted, border: PF_DARK.border, bg: PF_DARK.panel, surface: PF_DARK.surface, accent: PF_DARK.accent }} variant="modal" style={{ padding: 22, width: 400, maxWidth: '94vw' }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 12 }}>Insérer dans un carnet</div>
            {notebooks.length === 0 ? (
              <div style={{ fontSize: 12, color: PF_DARK.muted, textAlign: 'center', padding: 20 }}>Aucun carnet</div>
            ) : (
              notebooks.map((nb) => (
                <button key={nb.id} type="button" onClick={() => handleInsertPick(nb)} style={{
                  width: '100%', padding: '11px 12px', marginBottom: 6, borderRadius: 8,
                  border: `1px solid ${PF_DARK.border}`, background: PF_DARK.surface, color: PF_DARK.ink,
                  textAlign: 'left', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}>
                  {nb.title}
                </button>
              ))
            )}
          </GlassPanel>
        </ModalOverlay>
      )}
    </div>
  )
}

function MiniAct({ label, onClick, danger }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick() }} style={{
      padding: '4px 8px',
      fontSize: 10,
      borderRadius: 6,
      border: `1px solid ${PF_DARK.border}`,
      background: 'transparent',
      color: danger ? PF_DARK.danger : PF_DARK.muted,
      cursor: 'pointer',
    }}>
      {label}
    </button>
  )
}
