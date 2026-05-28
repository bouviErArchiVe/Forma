/** FormaAI — constantes */

import { FORMA_THEME_VARS } from '@/lib/formaShell'

export const FAI_DARK = {
  ...FORMA_THEME_VARS,
}

export const AI_ACTIONS = {
  summarize: { id: 'summarize', label: 'Résumer', icon: '📝', hint: 'Synthèse courte du texte sélectionné' },
  spellcheck: { id: 'spellcheck', label: 'Orthographe', icon: '✓', hint: 'Corriger l\'orthographe et la grammaire' },
  reformulate: { id: 'reformulate', label: 'Reformuler', icon: '↻', hint: 'Reformuler plus clairement' },
  technical: { id: 'technical', label: 'Notes techniques', icon: '📐', hint: 'Générer des notes techniques structurées' },
  tableHelp: { id: 'tableHelp', label: 'Aide tableau', icon: '📊', hint: 'Analyser ou structurer un tableau FormaTab' },
  docHelp: { id: 'docHelp', label: 'Aide document', icon: '📄', hint: 'Améliorer un document FormaDoc' },
  presentHelp: { id: 'presentHelp', label: 'Aide présentation', icon: '📽', hint: 'Suggestions pour slides FormaPresent' },
  classify: { id: 'classify', label: 'Classer', icon: '🏷', hint: 'Proposer tags et classement automatique' },
}

export const SEARCH_SOURCES = {
  all: { id: 'all', label: 'Tout' },
  library: { id: 'library', label: 'Bibliothèque' },
  notebook: { id: 'notebook', label: 'Notes / carnets' },
  doc: { id: 'doc', label: 'FormaDoc' },
  sheet: { id: 'sheet', label: 'FormaTab' },
  folder: { id: 'folder', label: 'Dossiers' },
  asset: { id: 'asset', label: 'Fichiers importés' },
  formula: { id: 'formula', label: 'Formules / normes' },
  combine: { id: 'combine', label: 'FormaCombine' },
  present: { id: 'present', label: 'FormaPresent' },
}

export const SEARCH_DEBOUNCE_MS = 120
