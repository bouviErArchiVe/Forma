import { useMemo } from "react"
import { UNIT_CATEGORIES, UNITS_BY_CATEGORY, convertValue } from "@/lib/units"
import GlassPanel from "@/components/ui/GlassPanel"
import GlassButton from "@/components/ui/GlassButton"
import { rgbaFromHex } from "@/theme/glass"
import { TOKENS } from "@/theme/tokens"

export default function UnitConverter({
  T,
  value,
  setValue,
  category,
  setCategory,
  fromUnit,
  setFromUnit,
  toUnit,
  setToUnit,
  onClose,
}) {
  const unitsList = useMemo(() => UNITS_BY_CATEGORY[category] || [], [category])
  const result = useMemo(() => convertValue(value, category, fromUnit, toUnit), [value, category, fromUnit, toUnit])

  const ensure = (cid) => {
    const u = UNITS_BY_CATEGORY[cid] || []
    const fOk = u.some(x => x.id === fromUnit)
    const tOk = u.some(x => x.id === toUnit)
    if (!fOk && u[0]) setFromUnit(u[0].id)
    if (!tOk && u[1]) setToUnit((u[1] || u[0]).id)
  }

  const fieldStyle = {
    width: "100%",
    padding: "8px 9px",
    borderRadius: TOKENS.radius.sm,
    border: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
    background: rgbaFromHex(T.bg, 0.4),
    color: T.ink,
    fontSize: 12,
    outline: "none",
    cursor: "pointer",
    transition: `border-color ${TOKENS.transition.fast}, box-shadow ${TOKENS.transition.fast}`,
  }

  return (
    <GlassPanel
      T={T}
      variant="float"
      animate
      style={{ position: "fixed", top: 70, left: 268, zIndex: TOKENS.zIndex.panel, width: 280, overflow: "hidden" }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 14px",
        borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
      }}>
        <div style={{ fontWeight: 800, fontSize: 12, color: T.ink }}>📐 Convertisseur</div>
        <button
          onClick={onClose}
          className="forma-btn-glass"
          style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: 18, lineHeight: 1, padding: "2px 6px" }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 7 }}>CATÉGORIE</div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {UNIT_CATEGORIES.map(c => (
            <GlassButton
              key={c.id}
              T={T}
              active={category === c.id}
              onClick={() => { setCategory(c.id); ensure(c.id) }}
              style={{ flex: 1, padding: "8px 6px", fontSize: 10, fontWeight: category === c.id ? 800 : 600 }}
            >
              {c.label}
            </GlassButton>
          ))}
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>VALEUR</div>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className="forma-btn-glass"
            style={{
              ...fieldStyle,
              padding: "10px 11px",
              fontSize: 16,
              fontWeight: 800,
              boxSizing: "border-box",
              cursor: "text",
            }}
            onFocus={(e) => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 2px ${T.accent}33` }}
            onBlur={(e) => { e.target.style.borderColor = rgbaFromHex(T.border, 0.45); e.target.style.boxShadow = "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 5 }}>DE</div>
            <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} style={fieldStyle}>
              {unitsList.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>

          <div style={{ paddingTop: 18, color: T.muted, fontWeight: 900 }}>→</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 5 }}>VERS</div>
            <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} style={fieldStyle}>
              {unitsList.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
            </select>
          </div>
        </div>

        <div
          className="forma-animate-scale"
          style={{
            padding: "10px 12px",
            borderRadius: TOKENS.radius.md,
            border: `1px solid ${rgbaFromHex(T.border, 0.4)}`,
            background: rgbaFromHex(T.bg, 0.35),
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 4 }}>RÉSULTAT</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 18, color: T.ink, wordBreak: "break-word" }}>
            {result === "" ? "—" : String(result)}
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
