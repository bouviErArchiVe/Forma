import { glassStyle, rgbaFromHex } from '@/theme/glass'
import { TOKENS } from '@/theme/tokens'

function btnStyle(T, { active, accent, danger, success, purple, cyan, green } = {}) {
  let border = rgbaFromHex(T.border, 0.4)
  let bg = rgbaFromHex(T.ink, 0.06)
  let color = T.muted

  if (danger) {
    border = 'rgba(233,69,96,.35)'
    bg = active ? 'rgba(233,69,96,.22)' : 'rgba(233,69,96,.1)'
    color = '#e94560'
  } else if (success) {
    border = active ? 'rgba(74,222,128,.45)' : 'rgba(74,222,128,.28)'
    bg = active ? 'rgba(74,222,128,.18)' : 'rgba(74,222,128,.1)'
    color = '#4ade80'
  } else if (purple) {
    border = active ? 'rgba(168,85,247,.5)' : rgbaFromHex(T.border, 0.4)
    bg = active ? 'rgba(168,85,247,.2)' : rgbaFromHex(T.ink, 0.06)
    color = active ? '#a855f7' : T.muted
  } else if (cyan) {
    border = active ? '#00ffcc' : rgbaFromHex(T.border, 0.4)
    bg = active ? 'rgba(0,255,204,.15)' : rgbaFromHex(T.ink, 0.06)
    color = active ? '#00ffcc' : T.muted
  } else if (green) {
    border = active ? 'rgba(74,222,128,.45)' : rgbaFromHex(T.border, 0.4)
    bg = active ? 'rgba(74,222,128,.15)' : rgbaFromHex(T.ink, 0.06)
    color = active ? '#4ade80' : T.muted
  } else if (active || accent) {
    border = rgbaFromHex(T.accent, 0.55)
    bg = `${T.accent}22`
    color = T.accent
  }

  return {
    padding: '4px 8px',
    borderRadius: TOKENS.radius.sm,
    border: `1px solid ${border}`,
    background: bg,
    color,
    cursor: 'pointer',
    fontSize: 10,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  }
}

function Group({ children, T }) {
  return (
    <div
      className="forma-toolbar-group"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 4,
        padding: '2px 4px',
        borderRadius: TOKENS.radius.sm,
        background: rgbaFromHex(T.ink, 0.03),
        border: `1px solid ${rgbaFromHex(T.border, 0.25)}`,
      }}
    >
      {children}
    </div>
  )
}

function Divider({ T }) {
  return (
    <div
      className="forma-toolbar-divider"
      style={{
        width: 1,
        height: 22,
        background: rgbaFromHex(T.border, 0.45),
        flexShrink: 0,
        margin: '0 2px',
      }}
    />
  )
}

export default function EditorTopBar({
  T,
  focusMode,
  nb,
  navigate,
  collabCursors,
  collabColors,
  saveStatus,
  unitSys,
  setUnitSys,
  scale,
  setScale,
  scalesM,
  scalesI,
  zoom,
  zoomBy,
  viewSize,
  showLib,
  setShowLib,
  showPagePanel,
  setShowPagePanel,
  setShowPageSettings,
  showLayers,
  onSaveNow,
  saveLabel,
  setShowLayers,
  showRuler,
  setShowRuler,
  infiniteMode,
  applyPageSettings,
  page,
  showHistory,
  setShowHistory,
  actionLogLength,
  pencilOnly,
  setPencilOnly,
  readOnly,
  setReadOnly,
  readOnlyLocked = false,
  sharePermission = null,
  isTablet = false,
  showEditorSidebar = false,
  setShowEditorSidebar,
  setShowPresent,
  showCalc,
  setShowCalc,
  showConv,
  setShowConv,
  showTranslate,
  setShowTranslate,
  showDictation,
  setShowDictation,
  showToolsToolbar,
  setShowToolsToolbar,
  showPropsPanel,
  propsCollapsed,
  setShowPropsPanel,
  setPropsCollapsed,
  showEraserPanel,
  setShowEraserPanel,
  tool,
  showTimer,
  setShowTimer,
  timerRunning,
  timerSec,
  showFlash,
  setShowFlash,
  flashCardsLength,
  toggleFocusMode,
  setShowShare,
  handleImport,
  exportPNG,
  exporting,
}) {
  if (focusMode) return null

  const fieldStyle = {
    padding: '3px 6px',
    borderRadius: TOKENS.radius.sm,
    border: `1px solid ${rgbaFromHex(T.border, 0.4)}`,
    background: rgbaFromHex(T.bg, 0.5),
    color: T.muted,
    fontSize: 9,
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <div
      className="forma-editor-topbar"
      style={{
        minHeight: 46,
        overflow: 'hidden',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '5px 10px',
        gap: 6,
        flexShrink: 0,
        zIndex: TOKENS.zIndex.toolbar,
        ...glassStyle(T, { variant: 'toolbar', border: false }),
      }}
    >
      <Group T={T}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="forma-btn-glass"
          style={{ ...btnStyle(T), background: 'transparent', border: 'none', color: T.muted }}
        >
          ← Retour
        </button>
        <Divider T={T} />
        <div
          style={{
            fontFamily: "'Syne',sans-serif",
            fontWeight: 600,
            fontSize: 12,
            color: T.ink,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: 160,
          }}
        >
          {nb.title}
        </div>
        {isTablet && setShowEditorSidebar && (
          <button
            type="button"
            onClick={() => setShowEditorSidebar((v) => !v)}
            title="Panneau outils & pages"
            className="forma-btn-glass"
            style={btnStyle(T, { active: showEditorSidebar, accent: true })}
          >
            ☰
          </button>
        )}
        {collabCursors.length > 0 && (
          <div style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
            {collabCursors.map((c, i) => (
              <div
                key={c.userId}
                title={c.userName}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: collabColors[i % 6],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 8,
                  fontWeight: 700,
                  color: '#fff',
                  border: `2px solid ${rgbaFromHex(T.ink, 0.15)}`,
                }}
              >
                {(c.userName || '?')[0].toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </Group>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginLeft: 'auto' }}>
        {saveStatus === 'dirty' && <span style={{ fontSize: 9, color: '#f5a623' }}>●</span>}
        {saveStatus === 'saving' && <span style={{ fontSize: 9, color: '#f5a623' }}>⏳</span>}
        {saveStatus === 'saved' && <span style={{ fontSize: 9, color: '#4ade80' }}>✓</span>}
        {saveStatus === 'offline' && <span style={{ fontSize: 9, color: '#f5a623' }}>💾</span>}
        {saveStatus === 'error' && <span style={{ fontSize: 9, color: '#e94560' }}>!</span>}
        {saveLabel && <span style={{ fontSize: 8, color: T.muted, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{saveLabel}</span>}
        {onSaveNow && (
          <button type="button" onClick={onSaveNow} title="Sauvegarder maintenant" className="forma-btn-glass" style={btnStyle(T, { accent: true })}>💾</button>
        )}

        <Group T={T}>
          <div style={{ display: 'flex', borderRadius: TOKENS.radius.sm, overflow: 'hidden', border: `1px solid ${rgbaFromHex(T.border, 0.4)}` }}>
            <button
              type="button"
              onClick={() => { setUnitSys('metric'); setScale('1:50') }}
              style={{
                padding: '3px 8px',
                background: unitSys === 'metric' ? `${T.accent}55` : 'transparent',
                border: 'none',
                color: unitSys === 'metric' ? '#fff' : T.muted,
                cursor: 'pointer',
                fontSize: 9,
              }}
            >
              mm
            </button>
            <button
              type="button"
              onClick={() => { setUnitSys('imperial'); setScale('1/4"=1\'') }}
              style={{
                padding: '3px 8px',
                background: unitSys === 'imperial' ? `${T.accent}55` : 'transparent',
                border: 'none',
                color: unitSys === 'imperial' ? '#fff' : T.muted,
                cursor: 'pointer',
                fontSize: 9,
              }}
            >
              in
            </button>
          </div>
          <select value={scale} onChange={(e) => setScale(e.target.value)} style={fieldStyle}>
            {(unitSys === 'metric' ? scalesM : scalesI).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: rgbaFromHex(T.ink, 0.05),
              borderRadius: TOKENS.radius.sm,
              padding: '0 6px',
              border: `1px solid ${rgbaFromHex(T.border, 0.3)}`,
            }}
          >
            <button type="button" onClick={() => zoomBy(1 / 1.1, { x: viewSize.w / 2, y: viewSize.h / 2 })} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 13 }}>−</button>
            <span style={{ color: T.muted, fontSize: 9, minWidth: 28, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => zoomBy(1.1, { x: viewSize.w / 2, y: viewSize.h / 2 })} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 13 }}>+</button>
          </div>
        </Group>

        <Group T={T}>
          {[
            [() => setShowToolsToolbar((v) => !v), '🧰', showToolsToolbar, 'Barre outils'],
            [() => {
              if (!showPropsPanel || propsCollapsed) {
                setShowPropsPanel(true)
                setPropsCollapsed(false)
              } else {
                setShowPropsPanel(false)
              }
            }, '🖍', showPropsPanel, 'Couleurs & taille'],
            ...(tool === 'eraser' ? [[() => setShowEraserPanel((v) => !v), '◻', showEraserPanel, 'Options gomme']] : []),
            [() => setShowLib((v) => !v), '🏗', showLib, 'Bibliothèque'],
            [() => setShowPagePanel((v) => !v), '📋', showPagePanel, 'Pages'],
            [() => setShowPageSettings(true), '🎨', false, 'Fond / Grille'],
            [() => setShowLayers((v) => !v), '⊞', showLayers, 'Calques'],
            [() => setShowRuler((v) => !v), '📏', showRuler, 'Règle'],
          ].map(([fn, label, active, title], i) => (
            <button key={i} type="button" onClick={fn} title={title} className="forma-btn-glass" style={btnStyle(T, { active })}>{label}</button>
          ))}
        </Group>

        <Group T={T}>
          <button type="button" onClick={() => applyPageSettings(page, { infinite: !infiniteMode })} title="Canvas infini" className="forma-btn-glass" style={btnStyle(T, { cyan: true, active: infiniteMode })}>
            ∞{infiniteMode ? '✓' : ''}
          </button>
          <button type="button" onClick={() => setShowHistory((v) => !v)} title="Historique" className="forma-btn-glass" style={btnStyle(T, { active: showHistory })}>
            🕐{actionLogLength > 0 ? actionLogLength : ''}
          </button>
          <button type="button" onClick={() => setPencilOnly((v) => !v)} title="Apple Pencil uniquement" className="forma-btn-glass" style={btnStyle(T, { purple: true, active: pencilOnly })}>
            ✏️{pencilOnly ? '✓' : ''}
          </button>
          <button
            type="button"
            onClick={() => { if (!readOnlyLocked) setReadOnly((v) => !v) }}
            title={readOnlyLocked ? `Lecture seule (${sharePermission || 'partagé'})` : 'Lecture seule'}
            className="forma-btn-glass"
            style={{
              ...btnStyle(T, { danger: true, active: readOnly }),
              opacity: readOnlyLocked ? 0.85 : 1,
              cursor: readOnlyLocked ? 'default' : 'pointer',
            }}
          >
            🔒{readOnlyLocked ? '✓' : ''}
          </button>
          <button type="button" onClick={() => setShowPresent(true)} title="Présentation" className="forma-btn-glass" style={btnStyle(T)}>📽</button>
          <button type="button" onClick={toggleFocusMode} title="Mode focus (F)" className="forma-btn-glass" style={btnStyle(T, { purple: true })}>⛶</button>
        </Group>

        <Group T={T}>
          <button type="button" onClick={() => setShowCalc((v) => !v)} title="Calculatrice" className="forma-btn-glass" style={btnStyle(T, { active: showCalc })}>🔢</button>
          <button type="button" onClick={() => setShowConv((v) => !v)} title="Convertisseur" className="forma-btn-glass" style={btnStyle(T, { active: showConv })}>📐</button>
          <button type="button" onClick={() => setShowTranslate((v) => !v)} title="Traduction" className="forma-btn-glass" style={btnStyle(T, { active: showTranslate })}>🌐</button>
          <button type="button" onClick={() => setShowDictation((v) => !v)} title="Dictée vocale" className="forma-btn-glass" style={btnStyle(T, { active: showDictation, purple: true })}>🎙</button>
          <button type="button" onClick={() => setShowTimer((v) => !v)} title="Pomodoro" className="forma-btn-glass" style={btnStyle(T, { green: true, active: showTimer })}>
            {timerRunning ? `⏱${String(Math.floor(timerSec / 60)).padStart(2, '0')}:${String(timerSec % 60).padStart(2, '0')}` : '⏱'}
          </button>
          <button type="button" onClick={() => setShowFlash((v) => !v)} title="Flashcards" className="forma-btn-glass" style={btnStyle(T, { purple: true, active: showFlash })}>
            🃏{flashCardsLength > 0 ? flashCardsLength : ''}
          </button>
        </Group>

        <Group T={T}>
          <button type="button" onClick={() => setShowShare(true)} title="Partager" className="forma-btn-glass" style={btnStyle(T, { accent: true })}>🤝</button>
          <label title="Importer image" className="forma-btn-glass" style={{ ...btnStyle(T), cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
            📎
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button type="button" onClick={exportPNG} disabled={exporting} title="Export PNG" className="forma-btn-glass" style={btnStyle(T, { success: true })}>{exporting ? '⏳' : '⬇️'}</button>
          <button type="button" onClick={() => window.__undo?.()} title="Annuler" className="forma-btn-glass" style={btnStyle(T)}>↩</button>
          <button type="button" onClick={() => window.__redo?.()} title="Refaire" className="forma-btn-glass" style={btnStyle(T)}>↪</button>
          <button type="button" onClick={() => window.__clear?.()} title="Effacer canvas" className="forma-btn-glass" style={btnStyle(T, { danger: true })}>🗑</button>
        </Group>
      </div>
    </div>
  )
}
