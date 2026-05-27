import { useMemo } from "react"
import { glassStyle, rgbaFromHex } from "@/theme/glass"
import { TOKENS } from "@/theme/tokens"
import GlassButton from "@/components/ui/GlassButton"

function tryEval(expr) {
  if (!expr) return null
  const safe = String(expr)
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/,/g, ".")
    .replace(/[^0-9+\-*/().\s]/g, "")
  if (!safe.trim()) return null
  // eslint-disable-next-line no-new-func
  const r = Function(`"use strict";return(${safe})`)()
  if (!isFinite(r)) return null
  return r
}

export default function CalculatorDrawer({
  T,
  open,
  onClose,
  compact,
  setCompact,
  display,
  setDisplay,
  history,
  setHistory,
}) {
  const keys = useMemo(() => (
    [["C","⌫","%","÷"],["7","8","9","×"],["4","5","6","−"],["1","2","3","+"],[" ","0",".","="]].flat()
  ), [])

  const press = (k) => {
    if (!k.trim()) return
    if (k === "C") { setDisplay("0"); return }
    if (k === "⌫") { setDisplay(s => (s.length <= 1 ? "0" : s.slice(0, -1))); return }
    if (k === "%") {
      const r = tryEval(display)
      if (r === null) return
      const rs = String(+(r / 100).toFixed(10))
      setHistory(h => [`${display} % = ${rs}`, ...h].slice(0, 12))
      setDisplay(rs)
      return
    }
    if (k === "=") {
      const r = tryEval(display)
      if (r === null) { setDisplay("Erreur"); return }
      const rs = String(+r.toFixed(10))
      setHistory(h => [`${display} = ${rs}`, ...h].slice(0, 12))
      setDisplay(rs)
      return
    }
    setDisplay(s => (s === "0" || s === "Erreur") ? k : (s + k))
  }

  return (
    <div
      className={open ? "forma-animate-in" : ""}
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: compact ? 320 : 420,
        transform: open ? "translateX(0)" : "translateX(110%)",
        transition: `transform ${TOKENS.transition.slow}, opacity ${TOKENS.transition.normal}`,
        zIndex: TOKENS.zIndex.modal,
        pointerEvents: open ? "auto" : "none",
        display: "flex",
        flexDirection: "column",
        borderLeft: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
        ...glassStyle(T, { variant: "panel", blur: TOKENS.blur.lg, opacity: 0.88 }),
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 14px 10px",
        borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
      }}>
        <div style={{ fontWeight: 900, fontSize: 12, color: T.ink }}>🧮 Calculatrice</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GlassButton T={T} size="md" onClick={() => setCompact(v => !v)} style={{ fontSize: 10, fontWeight: 800 }}>
            {compact ? "Étendu" : "Compact"}
          </GlassButton>
          <button
            onClick={onClose}
            className="forma-btn-glass"
            style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 20, lineHeight: 1, padding: "2px 6px" }}
          >
            ×
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 14px 6px", background: rgbaFromHex(T.bg, 0.35) }}>
        <div style={{
          fontFamily: "'Syne',sans-serif",
          fontWeight: 900,
          fontSize: 30,
          color: T.ink,
          textAlign: "right",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minHeight: 38,
        }}>
          {display}
        </div>
      </div>

      {!compact && (
        <div style={{
          padding: "8px 14px 10px",
          borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
          maxHeight: 130,
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>HISTORIQUE</div>
          {history.length === 0 ? (
            <div style={{ fontSize: 11, color: T.muted }}>Aucun calcul pour l’instant.</div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="forma-animate-in" style={{ fontSize: 10, color: T.muted, textAlign: "right", lineHeight: 1.7, animationDelay: `${i * 20}ms` }}>
                {h}
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {keys.map((k, i) => (
            <button
              key={i}
              onClick={() => press(k)}
              className={k.trim() ? "forma-btn-glass" : undefined}
              style={{
                padding: "14px 0",
                borderRadius: TOKENS.radius.md,
                border: "none",
                cursor: k.trim() ? "pointer" : "default",
                fontSize: 14,
                fontWeight: ["=", "÷", "×", "−", "+"].includes(k) ? 900 : 700,
                background: k === "=" ? T.accent : ["C", "⌫"].includes(k) ? "#e9456018" : ["÷", "×", "−", "+", "%"].includes(k) ? `${T.accent}18` : rgbaFromHex(T.bg, 0.45),
                color: k === "=" ? "#fff" : ["C", "⌫"].includes(k) ? "#e94560" : ["÷", "×", "−", "+", "%"].includes(k) ? T.accent : T.ink,
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {!compact && (
          <div style={{
            marginTop: 12,
            padding: "10px 12px",
            borderRadius: TOKENS.radius.lg,
            border: `1px dashed ${rgbaFromHex(T.border, 0.5)}`,
            background: `${T.accent}08`,
            color: T.muted,
            fontSize: 10,
            lineHeight: 1.35,
          }}>
            Mode étendu : historique des calculs récents.
          </div>
        )}
      </div>
    </div>
  )
}
