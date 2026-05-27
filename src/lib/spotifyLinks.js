export const SPOTIFY_LINK_MAX = 10

const SPOTIFY_HOST = /^(https?:\/\/)?(open\.)?spotify\.com\//i

export function isValidSpotifyUrl(raw) {
  if (!raw || typeof raw !== 'string') return false
  return SPOTIFY_HOST.test(raw.trim())
}

export function normalizeSpotifyUrl(raw) {
  if (!isValidSpotifyUrl(raw)) return null
  let url = raw.trim()
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  return url.split('#')[0].split('?')[0]
}

export function spotifyEmbedUrl(raw) {
  const url = normalizeSpotifyUrl(raw)
  if (!url) return ''
  return `${url.replace('open.spotify.com/', 'open.spotify.com/embed/')}?utm_source=generator&theme=0`
}

export function spotifyLinkLabel(raw) {
  const url = normalizeSpotifyUrl(raw)
  if (!url) return 'Lien Spotify'
  const parts = url.replace(/\/+$/, '').split('/')
  const type = parts[parts.length - 2] || 'playlist'
  const id = parts[parts.length - 1] || ''
  const typeLabel = { playlist: 'Playlist', album: 'Album', track: 'Morceau', artist: 'Artiste', episode: 'Épisode', show: 'Podcast' }[type] || 'Spotify'
  return id ? `${typeLabel} · ${id.slice(0, 8)}…` : typeLabel
}
