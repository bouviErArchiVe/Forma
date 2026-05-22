import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"

const SUBJECTS = [
  {id:"arch",    l:"Architecture",    c:"#c8622a", e:"🏛"},
  {id:"struct",  l:"Structure",       c:"#3d6b8c", e:"⚙"},
  {id:"urbanism",l:"Urbanisme",       c:"#5a7a3d", e:"🏙"},
  {id:"history", l:"Histoire Archi",  c:"#7c5c3d", e:"📜"},
  {id:"english", l:"Anglais",         c:"#4a7c59", e:"🇬🇧"},
  {id:"french",  l:"Français",        c:"#8c3d6b", e:"📖"},
  {id:"math",    l:"Mathématiques",   c:"#3d5c8c", e:"📐"},
  {id:"physics", l:"Physique",        c:"#5c3d8c", e:"⚡"},
  {id:"chemistry",l:"Chimie",         c:"#3d8c5c", e:"🧪"},
  {id:"compute", l:"Informatique",    c:"#2a6b8c", e:"💻"},
  {id:"art",     l:"Arts Plastiques", c:"#8c3d3d", e:"🎨"},
  {id:"music",   l:"Musique",         c:"#6b3d8c", e:"🎵"},
  {id:"economy", l:"Économie",        c:"#6b8c3d", e:"📊"},
  {id:"law",     l:"Droit",           c:"#8c6b3d", e:"⚖"},
  {id:"env",     l:"Environnement",   c:"#2d6a4f", e:"🌱"},
  {id:"design",  l:"Design",          c:"#6b3d6b", e:"✏"},
]

const TEMPLATES = [
  {id:"blank",     l:"Vierge",         i:"□"},
  {id:"lined",     l:"Ligné",          i:"≡"},
  {id:"cornell",   l:"Cornell",        i:"⊢"},
  {id:"dotted",    l:"Pointillés",     i:"⠿"},
  {id:"grid5",     l:"Grille 5mm",     i:"⊞"},
  {id:"grid10",    l:"Grille 10mm",    i:"⊞"},
  {id:"plan",      l:"Plan archi",     i:"⊕"},
  {id:"elevation", l:"Élévation",      i:"▭"},
  {id:"section",   l:"Coupe",          i:"⊟"},
  {id:"detail",    l:"Détail tech.",   i:"⊙"},
  {id:"isometric", l:"Isométrique",    i:"◇"},
  {id:"math",      l:"Quadrillé math", i:"#"},
  {id:"music",     l:"Portées",        i:"♩"},
  {id:"mindmap",   l:"Carte mentale",  i:"🧠"},
]

const MOCK_FALLBACK = []

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff/60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins}min`
  const hours = Math.floor(mins/60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours/24)
  if (days === 1) return "Hier"
  return new Date(dateStr).toLocaleDateString("fr-FR")
}

export default function LibraryPage() {
  const navigate = useNavigate()
  const { getTheme, setActiveNotebook } = useAppStore()
  const T = getTheme()
  const [notebooks, setNotebooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filt, setFilt] = useState("all")
  const [showNew, setShowNew] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newSubj, setNewSubj] = useState("arch")
  const [newTmpl, setNewTmpl] = useState("plan")
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUserId(session.user.id)
          loadNotebooks(session.user.id)
        } else {
          setNotebooks(MOCK_FALLBACK)
          setLoading(false)
        }
      } catch {
        setNotebooks(MOCK_FALLBACK)
        setLoading(false)
      }
    }
    init()
  }, [])

  const loadNotebooks = async (uid) => {
    try {
      const { data, error } = await supabase
        .from("notebooks")
        .select("*")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
      if (error) throw error
      if (data.length === 0) {
        const demos = MOCK_FALLBACK.map(n => ({
          title: n.title, subject: n.subject, template: n.template,
          pages_count: n.pages_count, starred: n.starred,
          color: SUBJECTS.find(s => s.id === n.subject)?.c || "#c8622a",
          user_id: uid
        }))
        const { data: inserted } = await supabase.from("notebooks").insert(demos).select()
        setNotebooks(inserted || demos)
      } else {
        setNotebooks(data)
      }
    } catch {
      setNotebooks(MOCK_FALLBACK)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => notebooks.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) &&
    (filt === "all" || n.subject === filt)
  ), [notebooks, search, filt])

  const open = (nb) => { setActiveNotebook(nb); navigate(`/editor/${nb.id}`) }

  const toggleStar = async (id, e) => {
    e.stopPropagation()
    const nb = notebooks.find(n => n.id === id)
    if (!nb) return
    setNotebooks(ns => ns.map(n => n.id === id ? { ...n, starred: !n.starred } : n))
    if (userId) await supabase.from("notebooks").update({ starred: !nb.starred }).eq("id", id)
  }

  const create = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    const subj = SUBJECTS.find(s => s.id === newSubj)
    const newNB = { title: newTitle, subject: newSubj, template: newTmpl, pages_count: 1, starred: false, color: subj?.c || "#c8622a" }
    try {
      if (userId) {
        const { data, error } = await supabase.from("notebooks").insert([{ ...newNB, user_id: userId }]).select().single()
        if (error) throw error
        setNotebooks(p => [data, ...p])
        setShowNew(false); setNewTitle(""); open(data)
      } else {
        const local = { ...newNB, id: Date.now().toString(), updated_at: new Date().toISOString() }
        setNotebooks(p => [local, ...p])
        setShowNew(false); setNewTitle(""); open(local)
      }
    } catch {
      const local = { ...newNB, id: Date.now().toString(), updated_at: new Date().toISOString() }
      setNotebooks(p => [local, ...p])
      setShowNew(false); setNewTitle(""); open(local)
    } finally { setSaving(false) }
  }

  const deleteNotebook = async (id, e) => {
    e.stopPropagation()
    if (!confirm("Supprimer ce carnet ?")) return
    setNotebooks(ns => ns.filter(n => n.id !== id))
    if (userId) await supabase.from("notebooks").delete().eq("id", id)
  }

  const usedSubjects = SUBJECTS.filter(s => notebooks.some(n => n.subject === s.id))

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Nunito',sans-serif", color: T.ink }}>
      {showNew && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: T.surface, borderRadius: 20, padding: 28, width: 520, maxWidth: "94vw", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: T.ink }}>Nouveau carnet</div>
              <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 22 }}>×</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6 }}>TITRE</div>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Projet École Primaire 2026…"
                onKeyDown={e => e.key === "Enter" && create()} autoFocus
                style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, outline: "none", color: T.ink, background: T.bg, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6 }}>MATIÈRE</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, maxHeight: 200, overflowY: "auto" }}>
                {SUBJECTS.map(s => (
                  <button key={s.id} onClick={() => setNewSubj(s.id)}
                    style={{ padding: "8px 5px", borderRadius: 9, border: `1px solid ${newSubj === s.id ? s.c : T.border}`, background: newSubj === s.id ? s.c + "18" : T.bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ fontSize: 16 }}>{s.e}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: newSubj === s.id ? s.c : T.muted, textAlign: "center", lineHeight: 1.1 }}>{s.l}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 6 }}>MODÈLE</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                {TEMPLATES.map(t => (
                  <button key={t.id} onClick={() => setNewTmpl(t.id)}
                    style={{ padding: "9px 5px", borderRadius: 9, border: `1px solid ${newTmpl === t.id ? T.accent : T.border}`, background: newTmpl === t.id ? `${T.accent}10` : T.bg, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                    <div style={{ fontSize: 17, color: newTmpl === t.id ? T.accent : T.muted }}>{t.i}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: newTmpl === t.id ? T.accent : T.muted, textAlign: "center", lineHeight: 1.2 }}>{t.l}</div>
                  </button>
                ))}
              </div>
            </div>
            <button onClick={create} disabled={!newTitle.trim() || saving}
              style={{ width: "100%", padding: 13, borderRadius: 11, background: newTitle.trim() ? T.accent : T.border, border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: newTitle.trim() ? "pointer" : "not-allowed" }}>
              {saving ? "Création..." : "Créer le carnet →"}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 20, boxShadow: "0 1px 12px rgba(0,0,0,.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 4px 14px ${T.accent}44` }}>🏛</div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 21, color: T.ink }}>ArchNote</div>
              <div style={{ fontSize: 10, color: T.muted }}>{userId ? "✓ Sauvegarde cloud active" : "Mode local — connectez-vous pour sauvegarder"}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!userId && (
              <button onClick={() => navigate("/auth")}
                style={{ padding: "7px 14px", borderRadius: 9, background: "transparent", border: `1px solid ${T.accent}`, color: T.accent, fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
                Se connecter
              </button>
            )}
            <button onClick={() => setShowNew(true)}
              style={{ padding: "8px 16px", borderRadius: 9, background: T.accent, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: `0 3px 12px ${T.accent}44` }}>
              + Nouveau carnet
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "20px 24px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
          {[
            { l: "Carnets",  v: notebooks.length,                        c: T.accent,  e: "📓" },
            { l: "Matières", v: usedSubjects.length,                     c: T.a2,      e: "📚" },
            { l: "Favoris",  v: notebooks.filter(n => n.starred).length, c: "#f5a623", e: "⭐" },
            { l: "Pages",    v: notebooks.reduce((a,n) => a+(n.pages_count||1), 0), c: T.a3, e: "📄" },
          ].map(s => (
            <div key={s.l} style={{ padding: "16px 20px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 14, cursor: "default" }}>
              <div style={{ fontSize: 26 }}>{s.e}</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: s.c, lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.l}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 7, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={() => setFilt("all")} style={{ padding: "6px 13px", borderRadius: 20, border: `1px solid ${filt === "all" ? T.accent : T.border}`, background: filt === "all" ? `${T.accent}15` : T.bg, color: filt === "all" ? T.accent : T.muted, fontSize: 12, cursor: "pointer" }}>
            Tous ({notebooks.length})
          </button>
          {usedSubjects.map(s => (
            <button key={s.id} onClick={() => setFilt(s.id)} style={{ padding: "6px 13px", borderRadius: 20, border: `1px solid ${filt === s.id ? s.c : T.border}`, background: filt === s.id ? s.c + "18" : T.bg, color: filt === s.id ? s.c : T.muted, fontSize: 12, cursor: "pointer" }}>
              {s.e} {s.l}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", marginBottom: 22 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: T.muted }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
            style={{ width: "100%", padding: "11px 13px 11px 40px", borderRadius: 11, border: `1px solid ${T.border}`, background: T.surface, fontSize: 14, outline: "none", color: T.ink, boxSizing: "border-box" }} />
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: T.muted }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>⏳</div>
            <div>Chargement…</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
            {filtered.map(nb => {
              const s = SUBJECTS.find(s => s.id === nb.subject) || SUBJECTS[0]
              const t = TEMPLATES.find(t => t.id === nb.template) || TEMPLATES[0]
              return (
                <div key={nb.id} onClick={() => open(nb)}
                  style={{ borderRadius: 15, background: T.surface, border: `1px solid ${T.border}`, overflow: "hidden", cursor: "pointer", transition: "all .22s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = s.c + "66"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${s.c}18` }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none" }}>
                  <div style={{ height: 96, background: `linear-gradient(135deg,${s.c}22,${s.c}06)`, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${T.border}`, position: "relative" }}>
                    <div style={{ fontSize: 34 }}>{s.e}</div>
                    <div style={{ position: "absolute", top: 7, left: 7, width: 5, height: 5, borderRadius: 1, background: s.c }} />
                    <div style={{ position: "absolute", top: 7, right: 7, fontSize: 10, color: s.c + "88" }}>{t.i}</div>
                  </div>
                  <div style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: T.ink, lineHeight: 1.3, flex: 1 }}>{nb.title}</div>
                      <button onClick={e => toggleStar(nb.id, e)} style={{ background: "none", border: "none", color: nb.starred ? "#f5a623" : T.border, cursor: "pointer", fontSize: 14 }}>★</button>
                    </div>
                    <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <div style={{ padding: "2px 7px", borderRadius: 20, background: s.c + "18", color: s.c, fontSize: 9, fontWeight: 700 }}>{s.l}</div>
                        <div style={{ fontSize: 9, color: T.muted }}>{nb.pages_count || 1}p</div>
                      </div>
                      <button onClick={e => deleteNotebook(nb.id, e)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11, opacity: .5 }}>🗑</button>
                    </div>
                    <div style={{ fontSize: 9, color: T.muted, marginTop: 4 }}>{timeAgo(nb.updated_at)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
