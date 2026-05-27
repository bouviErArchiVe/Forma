import { useMemo, useState } from "react"
import { UNIT_CATEGORIES, UNITS_BY_CATEGORY, convertValue, convertDrawingScale } from "@/lib/units"
import GlassButton from "@/components/ui/GlassButton"
import GlassPanel from "@/components/ui/GlassPanel"
import { glassStyle, rgbaFromHex } from "@/theme/glass"
import { TOKENS } from "@/theme/tokens"

const SCALE_PRESETS = ["1:20", "1:50", "1:100", "1:200", "1:500"]

function ConverterBody({
  T, tab, setTab, hasScale, scale, setScale,
  category, setCategory, ensure, value, setValue,
  unitsList, fromUnit, setFromUnit, toUnit, setToUnit,
  result, scaleRes, lengthUnits, fieldStyle,
}) {
  return (
    <>
      {hasScale && (
        <div style={{ display: "flex", borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`, flexShrink: 0 }}>
          {[["units", "Unités"], ["scale", "Échelle"]].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                cursor: "pointer",
                fontSize: 10,
                fontWeight: tab === id ? 800 : 500,
                background: tab === id ? `${T.accent}15` : "transparent",
                color: tab === id ? T.accent : T.muted,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 14, minHeight: 0 }}>
        {(!hasScale || tab === "units") && (
          <>
            <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 7 }}>CATÉGORIE</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {UNIT_CATEGORIES.map((c) => (
                <GlassButton
                  key={c.id}
                  T={T}
                  active={category === c.id}
                  onClick={() => { setCategory(c.id); ensure(c.id) }}
                  style={{ flex: "1 1 30%", padding: "8px 4px", fontSize: 9, fontWeight: category === c.id ? 800 : 600 }}
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
                style={{ ...fieldStyle, padding: "10px 11px", fontSize: 16, fontWeight: 800, cursor: "text" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 5 }}>DE</div>
                <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} style={fieldStyle}>
                  {unitsList.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
                </select>
              </div>
              <div style={{ paddingTop: 18, color: T.muted, fontWeight: 900 }}>→</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: T.muted, letterSpacing: 0.8, marginBottom: 5 }}>VERS</div>
                <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} style={fieldStyle}>
                  {unitsList.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
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
          </>
        )}

        {hasScale && tab === "scale" && (
          <>
            <div style={{ fontSize: 9, color: T.muted, textAlign: "center", marginBottom: 10 }}>
              Échelle active : <strong style={{ color: T.accent }}>{scale}</strong>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9.,]/g, ""))}
                placeholder="0"
                className="forma-btn-glass"
                style={{ ...fieldStyle, flex: 1, padding: "10px 11px", fontSize: 16, fontWeight: 800, cursor: "text" }}
              />
              <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} style={{ ...fieldStyle, width: 88 }}>
                {lengthUnits.map((u) => <option key={u.id} value={u.id}>{u.label}</option>)}
              </select>
            </div>

            {scaleRes ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  ["Réalité (mm)", scaleRes.mm, true],
                  ["Réalité (cm)", scaleRes.cm, false],
                  ["Réalité (m)", scaleRes.m, false],
                ].map(([label, val, accent]) => (
                  <div
                    key={label}
                    style={{
                      padding: "7px 9px",
                      borderRadius: TOKENS.radius.sm,
                      background: accent ? `${T.accent}10` : rgbaFromHex(T.bg, 0.35),
                      border: `1px solid ${accent ? `${T.accent}33` : rgbaFromHex(T.border, 0.4)}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 9, color: T.muted }}>{label}</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, color: accent ? T.accent : T.ink, fontSize: 13 }}>{val}</span>
                  </div>
                ))}
                <div style={{ fontSize: 8, color: T.muted, textAlign: "center", marginTop: 4 }}>
                  {value || "0"}{fromUnit} dessin → {scaleRes.m}m réel
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", color: T.muted, fontSize: 11, padding: "16px 0" }}>Entrez une valeur</div>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 12 }}>
              {SCALE_PRESETS.map((s) => (
                <GlassButton
                  key={s}
                  T={T}
                  active={scale === s}
                  onClick={() => setScale(s)}
                  style={{ padding: "4px 8px", fontSize: 9 }}
                >
                  {s}
                </GlassButton>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default function UnitConverter({
  T,
  variant = "drawer",
  open = true,
  onClose,
  stackOffset = 0,
  value,
  setValue,
  category,
  setCategory,
  fromUnit,
  setFromUnit,
  toUnit,
  setToUnit,
  scale,
  setScale,
}) {
  const [tab, setTab] = useState("units")
  const hasScale = !!(scale && setScale)
  const unitsList = useMemo(() => UNITS_BY_CATEGORY[category] || [], [category])
  const result = useMemo(() => convertValue(value, category, fromUnit, toUnit), [value, category, fromUnit, toUnit])
  const scaleRes = useMemo(() => (hasScale ? convertDrawingScale(value, fromUnit, scale) : null), [hasScale, value, fromUnit, scale])

  const ensure = (cid) => {
    const u = UNITS_BY_CATEGORY[cid] || []
    const fOk = u.some((x) => x.id === fromUnit)
    const tOk = u.some((x) => x.id === toUnit)
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
    boxSizing: "border-box",
  }

  const lengthUnits = UNITS_BY_CATEGORY.length || []

  const bodyProps = {
    T, tab, setTab, hasScale, scale, setScale,
    category, setCategory, ensure, value, setValue,
    unitsList, fromUnit, setFromUnit, toUnit, setToUnit,
    result, scaleRes, lengthUnits, fieldStyle,
  }

  if (variant === 'embedded') {
    return <ConverterBody {...bodyProps} />
  }

  const header = (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: variant === "drawer" ? "14px 14px 10px" : "12px 14px",
      borderBottom: `1px solid ${rgbaFromHex(T.border, 0.35)}`,
      flexShrink: 0,
    }}>
      <div style={{ fontWeight: 900, fontSize: 12, color: T.ink }}>📐 Convertisseur</div>
      <button
        type="button"
        onClick={onClose}
        className="forma-btn-glass"
        style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, fontSize: variant === "drawer" ? 20 : 18, lineHeight: 1, padding: "2px 6px" }}
      >
        ×
      </button>
    </div>
  )

  return (
    <div
      className={open ? "forma-animate-in" : ""}
      style={{
        position: "fixed",
        top: 0,
        right: stackOffset,
        bottom: 0,
        width: 300,
        transform: open ? "translateX(0)" : "translateX(110%)",
        transition: `transform ${TOKENS.transition.slow}, right ${TOKENS.transition.slow}`,
        zIndex: TOKENS.zIndex.modal - 1,
        pointerEvents: open ? "auto" : "none",
        display: "flex",
        flexDirection: "column",
        borderLeft: `1px solid ${rgbaFromHex(T.border, 0.45)}`,
        ...glassStyle(T, { variant: "panel", blur: TOKENS.blur.lg, opacity: 0.88 }),
      }}
    >
      {header}
      <ConverterBody {...bodyProps} />
    </div>
  )
}
