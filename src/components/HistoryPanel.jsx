import { useState, useMemo } from 'react'
import { formatActionTime, renderStrokeThumb } from '@/lib/actionHistory'
import { TOKENS } from '@/theme/tokens'

function ActionThumb({ preview }) {
  const src = useMemo(() => (preview ? renderStrokeThumb(preview) : null), [preview])
  if (!src) {
    return (
      <div
        style={{
          width: 72,
          height: 52,
          borderRadius: TOKENS.radius.sm,
          background: 'rgba(128,128,128,.12)',
          flexShrink: 0,
        }}
      />
    )
  }
  return (
    <img
      src={src}
      alt=""
      style={{ width: 72, height: 52, borderRadius: TOKENS.radius.sm, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(0,0,0,.06)' }}
    />
  )
}

export default function HistoryPanel({
  T,
  actionLog,
  pageHistory,
  onClose,
  onSaveVersion,
  onRestoreVersion,
  onClearActions,
}) {
  const [tab, setTab] = useState('journal')

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 300,
        background: T.surface,
        borderLeft: `1px solid ${T.border}`,
        zIndex: 150,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,.2)',
      }}
    >
      <div style={{ background: T.panel, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff' }}>🕐 Historique</span>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>
          ×
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: T.bg }}>
        {[['journal', `Journal (${actionLog.length})`], ['versions', `Versions (${pageHistory.length})`]].map(([id, lbl]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderBottom: `2px solid ${tab === id ? T.accent : 'transparent'}`,
              background: 'transparent',
              color: tab === id ? T.accent : T.muted,
              fontWeight: tab === id ? 700 : 500,
              fontSize: 10,
              cursor: 'pointer',
            }}
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === 'journal' && (
        <>
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 6 }}>
            {actionLog.length > 0 && (
              <button
                type="button"
                onClick={onClearActions}
                style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${T.border}`, background: T.bg, color: T.muted, fontSize: 9, cursor: 'pointer' }}
              >
                Effacer journal
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {actionLog.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 12px', color: T.muted, fontSize: 12, lineHeight: 1.5 }}>
                Aucune action enregistrée.
                <br />
                Dessinez, modifiez ou importez pour remplir le journal.
              </div>
            )}
            {actionLog.map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${i === 0 ? `${T.accent}55` : T.border}`,
                  background: i === 0 ? `${T.accent}08` : T.bg,
                  padding: '7px 8px',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <ActionThumb preview={entry.preview} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12 }}>{entry.icon}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 8, color: T.muted, fontFamily: 'monospace', marginTop: 2 }}>
                    {formatActionTime(entry.ts)}
                    {entry.detail && entry.type !== 'stroke_text' ? ` · ${entry.detail}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'versions' && (
        <>
          <div style={{ padding: '10px 10px 6px', borderBottom: `1px solid ${T.border}` }}>
            <button
              type="button"
              onClick={onSaveVersion}
              style={{
                width: '100%',
                padding: '7px 0',
                borderRadius: 8,
                background: `linear-gradient(135deg,${T.accent},${T.a2})`,
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              📸 Sauvegarder version
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pageHistory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 0', color: T.muted, fontSize: 12 }}>
                Aucune version sauvegardée.
                <br />
                Cliquez sur « Sauvegarder version ».
              </div>
            )}
            {pageHistory.map((ver, i) => (
              <div key={ver.ts} style={{ borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', background: T.bg }}>
                {ver.snap && <img src={ver.snap} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block', opacity: 0.85 }} />}
                <div style={{ padding: '6px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.ink }}>{i === 0 ? 'Dernière' : `Version ${pageHistory.length - i}`}</div>
                    <div style={{ fontSize: 8, color: T.muted, fontFamily: 'monospace' }}>{ver.label}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestoreVersion(ver)}
                    style={{ padding: '4px 9px', borderRadius: 7, background: `${T.accent}18`, border: `1px solid ${T.accent}44`, color: T.accent, cursor: 'pointer', fontSize: 9, fontWeight: 700 }}
                  >
                    Restaurer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
