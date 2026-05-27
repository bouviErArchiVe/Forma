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
import FormaModuleHeader from '@/components/FormaModuleHeader'
import ModalOverlay from '@/components/ui/ModalOverlay'
import GlassButton from '@/components/ui/GlassButton'

const MENU_CATEGORIES = [
  { id: 'favorites', label: 'Favoris', icon: '★' },
  { id: 'recent', label: 'Récents', icon: '🕐' },
  ...FORMULA_CATEGORIES.filter((c) => c.id !== 'all'),
]

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
  const [notebooks, setNotebooks] = useState([])
  const [sendModal, setSendModal] = useState(null)

  const activeFormula = useMemo(() => getFormulaById(activeFormulaId), [activeFormulaId])

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
    let list = filterFormulas({ categoryId: categoryId === 'recent' ? 'all' : categoryId, search, favorites })
    if (categoryId === 'recent') {
      const order = new Map(recent.map((id, i) => [id, i]))
      list = list.filter((f) => order.has(f.id)).sort((a, b) => order.get(a.id) - order.get(b.id))
    }
    return list
  }, [categoryId, search, favorites, recent])

  const openFormula = useCallback((id) => {
    setActiveFormulaId(id)
    touchRecent(id)
  }, [touchRecent])

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
    <div style={{ height: '100dvh', background: T.bg, color: T.ink, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <FormaModuleHeader
        title="Formules"
        subtitle={`Calculateurs intégrés · ${listedFormulas.length} formules`}
        sticky
      >
        <select
          value={categoryId}
          onChange={(e) => { setCategoryId(e.target.value); setActiveFormulaId(null) }}
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
      </FormaModuleHeader>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <FormulaCategoryMenu
          T={T}
          categories={MENU_CATEGORIES}
          activeId={activeFormulaId ? null : categoryId}
          collapsed={collapsed}
          onSelect={(id) => { setCategoryId(id); setActiveFormulaId(null) }}
        />

        {activeFormula ? (
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
                    favorite={favorites.includes(f.id)}
                    onOpen={openFormula}
                    onToggleFavorite={toggleFavorite}
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
    </div>
  )
}
