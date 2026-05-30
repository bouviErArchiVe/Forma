/** FormaAI — constantes (actions IA + sources de recherche). */

export interface AiActionDef {
  id: string
  label: string
  icon: string
  hint: string
}

export const AI_ACTIONS: Record<string, AiActionDef> = {
  summarize: { id: 'summarize', label: 'Résumer', icon: '📝', hint: 'Synthèse courte du texte' },
  spellcheck: { id: 'spellcheck', label: 'Orthographe', icon: '✓', hint: 'Corriger orthographe et grammaire' },
  reformulate: { id: 'reformulate', label: 'Reformuler', icon: '↻', hint: 'Reformuler plus clairement' },
  technical: { id: 'technical', label: 'Notes techniques', icon: '📐', hint: 'Générer des notes techniques structurées' },
  tableHelp: { id: 'tableHelp', label: 'Aide tableau', icon: '📊', hint: 'Analyser ou structurer un tableau FormaTab' },
  docHelp: { id: 'docHelp', label: 'Aide document', icon: '📄', hint: 'Améliorer un document FormaDoc' },
  presentHelp: { id: 'presentHelp', label: 'Aide présentation', icon: '▶', hint: 'Suggestions pour slides FormaPresent' },
  classify: { id: 'classify', label: 'Classer', icon: '🏷', hint: 'Proposer tags et classement' },
}

export type AiActionId = keyof typeof AI_ACTIONS | 'chat'

export interface SearchSourceDef {
  id: string
  label: string
}

export const SEARCH_SOURCES: Record<string, SearchSourceDef> = {
  all: { id: 'all', label: 'Tout' },
  notebook: { id: 'notebook', label: 'Carnets / notes' },
  doc: { id: 'doc', label: 'FormaDoc' },
  sheet: { id: 'sheet', label: 'FormaTab' },
  present: { id: 'present', label: 'FormaPresent' },
  event: { id: 'event', label: 'FormatCal' },
  review: { id: 'review', label: 'FormaReview' },
  combine: { id: 'combine', label: 'FormaCombine' },
  moodboard: { id: 'moodboard', label: 'Moodboard' },
  folder: { id: 'folder', label: 'Dossiers' },
  formula: { id: 'formula', label: 'Formules / normes' },
}

export const SEARCH_DEBOUNCE_MS = 140

/** TTL du cache de l'index unifié (ms). */
export const INDEX_CACHE_TTL = 8000
