import { useState, useRef } from 'react'
import {
  SPOTIFY_LINK_MAX,
  isValidSpotifyUrl,
  normalizeSpotifyUrl,
  spotifyEmbedUrl,
  spotifyLinkLabel,
} from '@/lib/spotifyLinks'

function SpotifyIcon({ size = 16, fill = '#1db954' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

export default function SpotifyLibraryPanel({
  T,
  open,
  onClose,
  links,
  activeId,
  onSelect,
  onAdd,
  onRemove,
  onNotify,
  iframeRef,
}) {
  const [input, setInput] = useState('')
  const [labelInput, setLabelInput] = useState('')
  const inputRef = useRef(null)

  if (!open) return null

  const activeLink = links.find((l) => l.id === activeId) || links[0] || null
  const activeUrl = activeLink?.url ?? ''
  const atLimit = links.length >= SPOTIFY_LINK_MAX

  const tryAdd = (rawUrl, rawLabel = '') => {
    const url = normalizeSpotifyUrl(rawUrl)
    if (!url) {
      onNotify?.('Lien Spotify invalide', 'error')
      return
    }
    if (links.some((l) => l.url === url)) {
      onNotify?.('Ce lien est déjà dans la bibliothèque', 'info')
      const existing = links.find((l) => l.url === url)
      if (existing) onSelect(existing.id)
      return
    }
    if (atLimit) {
      onNotify?.(`Maximum ${SPOTIFY_LINK_MAX} liens`, 'error')
      return
    }
    onAdd(url, rawLabel.trim() || spotifyLinkLabel(url))
    setInput('')
    setLabelInput('')
    onNotify?.('Playlist ajoutée', 'success')
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text?.trim()) {
        setInput(text.trim())
        inputRef.current?.focus()
      }
    } catch {
      onNotify?.('Coller depuis le presse-papier impossible ici', 'info')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 72,
        left: 24,
        zIndex: 190,
        background: T.surface,
        borderRadius: 18,
        boxShadow: '0 12px 40px rgba(0,0,0,.22)',
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
        width: 320,
        maxHeight: 'min(520px, calc(100vh - 120px))',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <SpotifyIcon />
          <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>Bibliothèque Spotify</span>
          <span style={{ fontSize: 9, color: T.muted }}>{links.length}/{SPOTIFY_LINK_MAX}</span>
        </div>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 16 }}>×</button>
      </div>

      {activeUrl ? (
        <iframe
          ref={iframeRef}
          key={activeUrl}
          src={spotifyEmbedUrl(activeUrl)}
          title="Spotify"
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ display: 'block', flexShrink: 0 }}
        />
      ) : (
        <div style={{ padding: '14px 16px', fontSize: 11, color: T.muted, flexShrink: 0 }}>
          Ajoute une playlist, un album ou un morceau Spotify ci-dessous.
        </div>
      )}

      {links.length > 0 && (
        <div
          style={{
            borderTop: `1px solid ${T.border}`,
            borderBottom: `1px solid ${T.border}`,
            maxHeight: 140,
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          {links.map((link) => {
            const selected = link.id === (activeId || links[0]?.id)
            return (
              <div
                key={link.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  background: selected ? `${T.accent}12` : 'transparent',
                  borderBottom: `1px solid ${T.border}22`,
                }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(link.id)}
                  title="Lire"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 11, color: selected ? T.accent : T.muted }}>{selected ? '▶' : '○'}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: selected ? 700 : 500,
                      color: selected ? T.accent : T.ink,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {link.label || spotifyLinkLabel(link.url)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(link.id)}
                  title="Supprimer"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: T.muted,
                    fontSize: 14,
                    lineHeight: 1,
                    padding: '0 2px',
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: T.muted }}>
          {atLimit ? `Limite atteinte (${SPOTIFY_LINK_MAX} liens)` : 'Coller un lien open.spotify.com'}
        </div>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://open.spotify.com/playlist/..."
          disabled={atLimit}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.bg,
            color: T.ink,
            fontSize: 11,
            outline: 'none',
            boxSizing: 'border-box',
            opacity: atLimit ? 0.6 : 1,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) tryAdd(input, labelInput)
          }}
        />
        <input
          value={labelInput}
          onChange={(e) => setLabelInput(e.target.value)}
          placeholder="Nom (optionnel)"
          disabled={atLimit}
          style={{
            width: '100%',
            padding: '6px 10px',
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: T.bg,
            color: T.ink,
            fontSize: 10,
            outline: 'none',
            boxSizing: 'border-box',
            opacity: atLimit ? 0.6 : 1,
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) tryAdd(input, labelInput)
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={handlePaste}
            disabled={atLimit}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 8,
              background: T.bg,
              border: `1px solid ${T.border}`,
              color: T.muted,
              fontSize: 10,
              cursor: atLimit ? 'default' : 'pointer',
              opacity: atLimit ? 0.5 : 1,
            }}
          >
            📋 Coller
          </button>
          <button
            type="button"
            onClick={() => input.trim() && tryAdd(input, labelInput)}
            disabled={atLimit || !isValidSpotifyUrl(input)}
            style={{
              flex: 1,
              padding: '7px 0',
              borderRadius: 8,
              background: '#1db954',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: 11,
              cursor: atLimit || !isValidSpotifyUrl(input) ? 'default' : 'pointer',
              opacity: atLimit || !isValidSpotifyUrl(input) ? 0.5 : 1,
            }}
          >
            + Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
