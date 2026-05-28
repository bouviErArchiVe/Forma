/** FormaMessage — messagerie Forma */

export const FM_STORAGE_KEY = 'forma-message-v1'

export const MSG_TYPES = {
  text: 'text',
  image: 'image',
  file: 'file',
  voice: 'voice',
  sticker: 'sticker',
  share: 'share',
}

export const MSG_STATUS = {
  draft: 'draft',
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
}

export const FM_STICKERS = ['👋', '😊', '🎓', '📐', '✅', '🔥', '💡', '📎', '🖼', '📝', '🤝', '⭐']

export const FM_DARK = {
  bg: '#0f1118',
  surface: '#151724',
  panel: '#1a1e28',
  ink: '#e8ecf4',
  muted: '#8b95a8',
  border: '#2a3144',
  accent: '#6b9fd4',
  mine: '#2a4a6b',
}

export const CONNECTION_MODES = {
  local: 'local',
  cloud_pending: 'cloud_pending',
  cloud: 'cloud',
}
