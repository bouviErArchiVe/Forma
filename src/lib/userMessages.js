/** Messages utilisateur — évite d'afficher les erreurs API brutes */

export function mapAuthError(error) {
  const msg = error?.message || ''
  const known = {
    'Invalid login credentials': 'Email ou mot de passe incorrect',
    'User already registered': 'Cet email est déjà utilisé',
    'Email not confirmed': 'Confirmez votre email avant de vous connecter',
    'Password should be at least 6 characters': 'Mot de passe : 6 caractères minimum',
    'Signup requires a valid password': 'Mot de passe invalide',
  }
  if (known[msg]) return known[msg]
  if (/network|fetch|failed to fetch/i.test(msg)) return 'Connexion réseau indisponible. Réessayez.'
  return 'Connexion impossible. Vérifiez vos identifiants.'
}

export function mapSocialError(error) {
  const msg = (error?.message || '').toLowerCase()
  if (!msg) return 'Fonctionnalités sociales temporairement indisponibles.'
  if (/relation|profiles|does not exist|schema|42p01/.test(msg)) {
    return 'Fonctionnalités sociales indisponibles — base de données non configurée.'
  }
  if (/jwt|not authenticated|invalid claim|session/.test(msg)) {
    return 'Session expirée — reconnectez-vous.'
  }
  if (/network|fetch|timeout/.test(msg)) return 'Connexion réseau indisponible. Réessayez.'
  return 'Fonctionnalités sociales temporairement indisponibles.'
}

export function mapActionError(error, fallback = 'Action impossible. Réessayez.') {
  const social = mapSocialError(error)
  if (social !== 'Fonctionnalités sociales temporairement indisponibles.') return social
  const raw = error?.message || ''
  if (/network|fetch|timeout/i.test(raw)) return 'Connexion réseau indisponible. Réessayez.'
  if (/permission|denied|403|401/i.test(raw)) return 'Accès refusé. Vérifiez votre connexion.'
  return fallback
}

export function formatTimeShort(value) {
  if (value == null || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
