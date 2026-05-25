import { useState } from "react"
import { useNavigate } from "react-router-dom"
import useAppStore from "@/stores/useAppStore"
import { supabase } from "@/lib/supabase"

export default function AuthPage() {
  const navigate = useNavigate()
  const { getTheme } = useAppStore()
  const T = getTheme()
  const [mode, setMode] = useState("login") // login | signup
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const submit = async () => {
    if (!email.trim() || !password.trim()) { setError("Remplis tous les champs"); return }
    if (password.length < 6) { setError("Mot de passe : 6 caractères minimum"); return }
    setLoading(true); setError(""); setSuccess("")
    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name } }
        })
        if (err) throw err
        setSuccess("✓ Compte créé ! Vérifie ton email pour confirmer, puis connecte-toi.")
        setMode("login")
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
        navigate("/")
      }
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : err.message)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito',sans-serif", padding: 20 }}>
      <div style={{ background: T.surface, borderRadius: 20, padding: 32, width: 400, maxWidth: "100%", boxShadow: "0 20px 60px rgba(0,0,0,.12)", border: `1px solid ${T.border}` }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <img src={T.img} alt={T.n} style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", boxShadow: `0 4px 14px ${T.accent}44` }}/>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: T.ink }}>Forma</div>
            <div style={{ fontSize: 11, color: T.muted }}>Carnet de conception · Architecture & Design</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: T.bg, borderRadius: 10, padding: 4, marginBottom: 24, border: `1px solid ${T.border}` }}>
          <button onClick={() => { setMode("login"); setError(""); setSuccess("") }}
            style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === "login" ? T.surface : "transparent", color: mode === "login" ? T.ink : T.muted, fontWeight: mode === "login" ? 700 : 400, fontSize: 14, cursor: "pointer", boxShadow: mode === "login" ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .2s" }}>
            Se connecter
          </button>
          <button onClick={() => { setMode("signup"); setError(""); setSuccess("") }}
            style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: mode === "signup" ? T.surface : "transparent", color: mode === "signup" ? T.ink : T.muted, fontWeight: mode === "signup" ? 700 : 400, fontSize: 14, cursor: "pointer", boxShadow: mode === "signup" ? "0 1px 4px rgba(0,0,0,.1)" : "none", transition: "all .2s" }}>
            Créer un compte
          </button>
        </div>

        {/* Success */}
        {success && (
          <div style={{ background: "rgba(74,222,128,.1)", border: "1px solid rgba(74,222,128,.3)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#4ade80" }}>
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(233,69,96,.1)", border: "1px solid rgba(233,69,96,.3)", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#e94560" }}>
            {error}
          </div>
        )}

        {/* Name (signup only) */}
        {mode === "signup" && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>PRÉNOM ET NOM</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Prénom Nom"
              style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, outline: "none", color: T.ink, background: T.bg, boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = T.accent}
              onBlur={e => e.target.style.borderColor = T.border} />
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>EMAIL</div>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ton@email.com" type="email"
            style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, outline: "none", color: T.ink, background: T.bg, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = T.accent}
            onBlur={e => e.target.style.borderColor = T.border} />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5 }}>MOT DE PASSE</div>
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password"
            onKeyDown={e => e.key === "Enter" && submit()}
            style={{ width: "100%", padding: "11px 13px", borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 14, outline: "none", color: T.ink, background: T.bg, boxSizing: "border-box" }}
            onFocus={e => e.target.style.borderColor = T.accent}
            onBlur={e => e.target.style.borderColor = T.border} />
          {mode === "signup" && <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>6 caractères minimum</div>}
        </div>

        {/* Submit */}
        <button onClick={submit} disabled={loading}
          style={{ width: "100%", padding: 14, borderRadius: 11, background: loading ? T.border : T.accent, border: "none", color: "#fff", fontWeight: 700, fontSize: 15, cursor: loading ? "wait" : "pointer", boxShadow: loading ? "none" : `0 4px 14px ${T.accent}44`, transition: "all .2s", marginBottom: 12 }}>
          {loading ? "..." : mode === "login" ? "Se connecter →" : "Créer mon compte →"}
        </button>

        {/* Skip */}
        <button onClick={() => navigate("/")}
          style={{ width: "100%", padding: 12, borderRadius: 11, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
          Continuer sans compte (mode local)
        </button>

        {mode === "signup" && (
          <div style={{ marginTop: 16, padding: 14, background: `${T.a2}08`, borderRadius: 10, border: `1px solid ${T.a2}22`, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
            ✓ Sauvegarde cloud de tous tes carnets<br/>
            ✓ Accès depuis n'importe quel appareil<br/>
            ✓ Partage et collaboration<br/>
            ✓ 100% gratuit, toujours
          </div>
        )}
      </div>
    </div>
  )
}
