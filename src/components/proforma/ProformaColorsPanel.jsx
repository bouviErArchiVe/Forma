import { PF_PALETTE } from '@/lib/proforma/tools'
import { PF_DARK } from '@/lib/proforma/constants'
import { Panel } from './ProformaLayersPanel'

export default function ProformaColorsPanel({ color, setColor, brush, setBrush, tool }) {
  return (
    <>
      <Panel title="Couleurs">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {PF_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: 6,
                border: color === c ? `2px solid ${PF_DARK.accent}` : `1px solid ${PF_DARK.border}`,
                background: c,
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ width: '100%', marginTop: 8, height: 32, border: 'none', cursor: 'pointer' }}
        />
      </Panel>

      <Panel title="Pinceau">
        {[
          { key: 'size', label: 'Taille', min: 0.5, max: 48, step: 0.5 },
          { key: 'opacity', label: 'Opacité', min: 0.05, max: 1, step: 0.05 },
          { key: 'hardness', label: 'Dureté', min: 0, max: 1, step: 0.05 },
          { key: 'smoothing', label: 'Lissage', min: 0, max: 0.9, step: 0.05 },
          { key: 'spacing', label: 'Espacement', min: 0.05, max: 1, step: 0.05 },
          { key: 'flow', label: 'Flux', min: 0.1, max: 1, step: 0.05 },
        ].map((s) => (
          <div key={s.key} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: PF_DARK.muted, marginBottom: 3 }}>
              <span>{s.label}</span>
              <span>{(brush[s.key] ?? 0).toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={s.min}
              max={s.max}
              step={s.step}
              value={brush[s.key] ?? s.min}
              onChange={(e) => setBrush({ ...brush, [s.key]: parseFloat(e.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        ))}
        <div style={{ fontSize: 9, color: PF_DARK.muted, marginTop: 4 }}>Outil : {tool}</div>
      </Panel>
    </>
  )
}
