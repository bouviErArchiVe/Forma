import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/hooks/useAppearance'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { loadLocalNotebooks } from '@/lib/projectPersistence'
import useAppStore from '@/stores/useAppStore'
import { BRAND } from '@/config/branding'
import { FORMULA_CATEGORIES, filterFormulas, getFormulaById } from '@/data/formulas'
import { useFormulaPrefs } from '@/hooks/useFormulaPrefs'
import FormulaCategoryMenu from '@/components/formulas/FormulaCategoryMenu'
import FormulaCard from '@/components/formulas/FormulaCard'
import FormulaCalculator from '@/components/formulas/FormulaCalculator'
import FormaAppShell from '@/components/FormaAppShell'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassButton from '@/components/ui/GlassButton'

const MENU_CATEGORIES = [
  { id: 'favorites', label: 'Favoris', icon: '★' },
  { id: 'recent', label: 'Récents', icon: '🕐' },
  { id: 'custom', label: 'Formules personnalisées', icon: '✎' },
  ...FORMULA_CATEGORIES.filter((c) => c.id !== 'all'),
]
const CUSTOM_FORMULAS_KEY = 'forma_custom_formulas_v1'

function loadCustomFormulas() {
  try {
    const list = JSON.parse(localStorage.getItem(CUSTOM_FORMULAS_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch { return [] }
}

function saveCustomFormulas(list) {
  try { localStorage.setItem(CUSTOM_FORMULAS_KEY, JSON.stringify(list)) } catch {}
}

function buildNoteText(formula, result) {
  const lines = [
    `📐 ${formula.title}`,
    formula.formulaText,
    '',
    ...(result.rows || []).map((r) => `• ${r.label}: ${r.value}`),
    '',
    result.summary || '',
    '',
    `— ${BRAND.productLine} · ${new Date().toLocaleString('fr-FR')}`,
  ]
  return lines.join('\n')
}

export default function FormulasPage() {
  const navigate = useNavigate()
  const { T } = useTheme()
  const { userId } = useAuth()
  const { addNotification, setActiveNotebook, setPendingFormulaNote } = useAppStore()
  const { favorites, recent, lengthUnit, setLengthUnit, toggleFavorite, touchRecent } = useFormulaPrefs()

  const [collapsed, setCollapsed] = useState(false)
  const [categoryId, setCategoryId] = useState('structures')
  const [search, setSearch] = useState('')
  const [activeFormulaId, setActiveFormulaId] = useState(null)
  const [activeCustomId, setActiveCustomId] = useState(null)
  const [customFormulas, setCustomFormulas] = useState(loadCustomFormulas)
  const [customDraft, setCustomDraft] = useState(null)
  const [notebooks, setNotebooks] = useState([])
  const [sendModal, setSendModal] = useState(null)

  const activeFormula = useMemo(() => getFormulaById(activeFormulaId), [activeFormulaId])
  const activeCustom = useMemo(() => customFormulas.find((f) => f.id === activeCustomId) || null, [customFormulas, activeCustomId])

  useEffect(() => { saveCustomFormulas(customFormulas) }, [customFormulas])

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
          if (!cancelled && data?.length) {
            setNotebooks(data)
            return
          }
        } catch { /* offline */ }
      }
      if (!cancelled) setNotebooks(local)
    })()
    return () => { cancelled = true }
  }, [userId])

  const listedFormulas = useMemo(() => {
    if (categoryId === 'custom') {
      const q = search.trim().toLowerCase()
      return customFormulas.filter((f) => !q || [f.title, f.description, f.formulaText, f.category].some((v) => String(v || '').toLowerCase().includes(q)))
    }
    let list = filterFormulas({ categoryId: categoryId === 'recent' ? 'all' : categoryId, search, favorites })
    if (categoryId === 'recent') {
      const order = new Map(recent.map((id, i) => [id, i]))
      list = list.filter((f) => order.has(f.id)).sort((a, b) => order.get(a.id) - order.get(b.id))
    }
    return list
  }, [categoryId, search, favorites, recent, customFormulas])

  const openFormula = useCallback((id) => {
    if (String(id).startsWith('custom-')) {
      setActiveCustomId(id)
      setActiveFormulaId(null)
      return
    }
    setActiveFormulaId(id)
    setActiveCustomId(null)
    touchRecent(id)
  }, [touchRecent])

  const saveCustomFormula = useCallback((draft) => {
    const title = draft.title.trim()
    const formulaText = draft.formulaText.trim()
    if (!title || !formulaText) return
    const item = {
      id: draft.id || `custom-${Date.now()}`,
      categoryId: 'custom',
      icon: '✎',
      title,
      formulaText,
      description: draft.description.trim(),
      category: draft.category.trim() || 'Personnel',
      tags: ['custom', draft.category.trim()].filter(Boolean),
    }
    setCustomFormulas((list) => [item, ...list.filter((f) => f.id !== item.id)])
    setCustomDraft(null)
    setCategoryId('custom')
    setActiveCustomId(item.id)
    addNotification('Formule personnalisée sauvegardée', 'success')
  }, [addNotification])

  const deleteCustomFormula = useCallback((id) => {
    setCustomFormulas((list) => list.filter((f) => f.id !== id))
    setActiveCustomId(null)
    addNotification('Formule personnalisée supprimée', 'success')
  }, [addNotification])

  const handleCopy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      addNotification('Résultat copié', 'success')
    } catch {
      addNotification('Copie impossible', 'error')
    }
  }, [addNotification])

  const handleSendToNotebook = useCallback((formula, result) => {
    if (!result || result.error) return
    setSendModal({ formula, result, text: buildNoteText(formula, result) })
  }, [])

  const confirmSend = useCallback((nb) => {
    if (!sendModal) return
    setPendingFormulaNote({ notebookId: nb.id, text: sendModal.text })
    setActiveNotebook(nb)
    setSendModal(null)
    addNotification(`Calcul envoyé vers « ${nb.title} »`, 'success')
    navigate(`/editor/${nb.id}`)
  }, [sendModal, setPendingFormulaNote, setActiveNotebook, addNotification, navigate])

  return (
    <FormaAppShell
      title="Formules"
      subtitle={`Calculateurs intégrés · ${listedFormulas.length} formules`}
      headerExtra={(
        <>
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setActiveFormulaId(null); setActiveCustomId(null) }}
          style={{
            padding: '8px 10px', borderRadius: 8, border: `1px solid ${T.border}`,
            background: T.bg, color: T.ink, fontSize: 12, maxWidth: 200,
          }}
          aria-label="Catégorie de formules"
        >
          {MENU_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une formule (ex. Blondel)…"
            style={{ width: '100%', padding: '11px 12px 11px 36px', borderRadius: 11, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
        <button type="button" onClick={() => setCollapsed((v) => !v)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', fontSize: 12, color: T.muted }}>
          {collapsed ? '☰' : '◧'}
        </button>
        <button type="button" onClick={() => setCustomDraft({ title: '', formulaText: '', description: '', category: '' })} style={{ background: T.accent, border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: '#fff', fontWeight: 700 }}>
          + Formule
        </button>
        </>
      )}
    >
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', height: '100%' }}>
        <FormulaCategoryMenu
          T={T}
          categories={MENU_CATEGORIES}
          activeId={activeFormulaId || activeCustomId ? null : categoryId}
          collapsed={collapsed}
          onSelect={(id) => { setCategoryId(id); setActiveFormulaId(null); setActiveCustomId(null) }}
        />

        {activeCustom ? (
          <CustomFormulaDetail T={T} formula={activeCustom} onBack={() => setActiveCustomId(null)} onEdit={() => setCustomDraft(activeCustom)} onDelete={() => deleteCustomFormula(activeCustom.id)} onCopy={handleCopy} />
        ) : activeFormula ? (
          <FormulaCalculator
            T={T}
            formula={activeFormula}
            lengthUnit={lengthUnit}
            onLengthUnitChange={setLengthUnit}
            favorite={favorites.includes(activeFormula.id)}
            onToggleFavorite={toggleFavorite}
            onBack={() => setActiveFormulaId(null)}
            onCopy={handleCopy}
            onSendToNotebook={handleSendToNotebook}
            onComputed={() => touchRecent(activeFormula.id)}
          />
        ) : (
          <main style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 24px 48px' }}>
            <div style={{ marginBottom: 18 }}>
              <h2 style={{ margin: 0, fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800 }}>
                {MENU_CATEGORIES.find((c) => c.id === categoryId)?.label || 'Formules'}
              </h2>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: T.muted }}>
                {search ? `Résultats pour « ${search} »` : 'Sélectionnez un calculateur'}
              </p>
            </div>

            {listedFormulas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: T.muted }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📐</div>
                <div style={{ fontSize: 14 }}>Aucune formule trouvée</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
                {listedFormulas.map((f) => (
                  <FormulaCard
                    key={f.id}
                    T={T}
                    formula={f}
                    favorite={!String(f.id).startsWith('custom-') && favorites.includes(f.id)}
                    onOpen={openFormula}
                    onToggleFavorite={String(f.id).startsWith('custom-') ? () => {} : toggleFavorite}
                  />
                ))}
              </div>
            )}
          </main>
        )}
      </div>

      {sendModal && (
        <ModalOverlay onClose={() => setSendModal(null)}>
          <div style={{ width: 'min(420px, 92vw)', padding: 22, borderRadius: 16, background: T.surface, border: `1px solid ${T.border}` }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Envoyer vers un carnet</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Le calcul sera inséré comme texte dans le carnet choisi.</div>
            {notebooks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 13 }}>
                Aucun carnet disponible.
                <div style={{ marginTop: 12 }}>
                  <GlassButton T={T} accent onClick={() => { setSendModal(null); navigate('/') }}>Créer un carnet</GlassButton>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                {notebooks.map((nb) => (
                  <button
                    key={nb.id}
                    type="button"
                    onClick={() => confirmSend(nb)}
                    style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.bg, cursor: 'pointer', textAlign: 'left', color: T.ink, fontSize: 13 }}
                  >
                    <div style={{ fontWeight: 700 }}>{nb.title}</div>
                    {nb.subject && <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{nb.subject}</div>}
                  </button>
                ))}
              </div>
            )}
            <GlassButton T={T} size="md" onClick={() => setSendModal(null)} style={{ width: '100%', marginTop: 14 }}>Annuler</GlassButton>
          </div>
        </ModalOverlay>
      )}
      {customDraft && (
        <CustomFormulaModal T={T} draft={customDraft} setDraft={setCustomDraft} onSave={saveCustomFormula} onClose={() => setCustomDraft(null)} />
      )}
    </FormaAppShell>
  )
}

function CustomFormulaDetail({ T, formula, onBack, onEdit, onDelete, onCopy }) {
  return (
    <main style={{ flex: 1, overflow: 'auto', padding: '22px 24px' }}>
      <button type="button" onClick={onBack} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, color: T.ink }}>← Retour</button>
      <div style={{ marginTop: 18, padding: 18, borderRadius: 14, border: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ fontSize: 11, color: T.accent, fontWeight: 800, marginBottom: 8 }}>{formula.category || 'Personnel'}</div>
        <h1 style={{ margin: 0, fontSize: 22, color: T.ink }}>{formula.title}</h1>
        {formula.description && <p style={{ color: T.muted, fontSize: 13, lineHeight: 1.5 }}>{formula.description}</p>}
        <pre style={{ whiteSpace: 'pre-wrap', padding: 14, borderRadius: 10, background: T.bg, color: T.accent, border: `1px solid ${T.border}`, fontFamily: 'monospace' }}>{formula.formulaText}</pre>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => onCopy(`${formula.title}\n${formula.formulaText}`)} style={smallBtn(T, true)}>Copier</button>
          <button type="button" onClick={onEdit} style={smallBtn(T)}>Modifier</button>
          <button type="button" onClick={onDelete} style={{ ...smallBtn(T), color: '#e94560', borderColor: '#e9456044' }}>Supprimer</button>
        </div>
      </div>
    </main>
  )
}

function CustomFormulaModal({ T, draft, setDraft, onSave, onClose }) {
  const field = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 9, border: `1px solid ${T.border}`, background: T.bg, color: T.ink, fontSize: 13 }
  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: 'min(520px, 94vw)', padding: 22, borderRadius: 16, background: T.surface, border: `1px solid ${T.border}` }}>
        <h2 style={{ margin: '0 0 14px', fontSize: 17, color: T.ink }}>Formule personnalisée</h2>
        <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Nom formule" style={{ ...field, marginBottom: 10 }} />
        <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Catégorie" style={{ ...field, marginBottom: 10 }} />
        <textarea value={draft.formulaText} onChange={(e) => setDraft({ ...draft, formulaText: e.target.value })} placeholder="Expression / formule" rows={4} style={{ ...field, marginBottom: 10, resize: 'vertical' }} />
        <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Description" rows={3} style={{ ...field, marginBottom: 14, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={smallBtn(T)}>Annuler</button>
          <button type="button" onClick={() => onSave(draft)} style={smallBtn(T, true)}>Sauvegarder</button>
        </div>
      </div>
    </ModalOverlay>
  )
}

function smallBtn(T, primary = false) {
  return { padding: '9px 12px', borderRadius: 9, border: primary ? 'none' : `1px solid ${T.border}`, background: primary ? T.accent : T.bg, color: primary ? '#fff' : T.ink, fontSize: 12, fontWeight: 700, cursor: 'pointer' }
}
