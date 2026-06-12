/**
 * Registre central des types de documents Forma V2.
 *
 * Source de vérité pour : libellés, descriptions, icônes, couleurs,
 * groupes du menu « + Nouveau », badges Library, comportement recherche.
 *
 * IMPORTANT — compatibilité des données : les chaînes `DocumentType`
 * historiques ('formataб' avec б cyrillique, 'fmoodboard'…) sont des clés
 * de stockage Dexie et ne doivent JAMAIS être renommées. Ce registre
 * fournit les noms d'affichage propres par-dessus.
 */
import type { IconName } from '../components/ui/Icon'
import type { DocumentType } from '../types'

/** Groupes du menu de création (et de l'organisation Library). */
export type DocumentKindGroup = 'create' | 'study' | 'organize' | 'tools'

export const KIND_GROUP_LABELS: Record<DocumentKindGroup, string> = {
  create: 'Créer',
  study: 'Étudier',
  organize: 'Organiser',
  tools: 'Outils',
}

export interface DocumentKindMeta {
  /** Chaîne de stockage (DocumentType) — invariante. */
  id: DocumentType
  /** Nom d'affichage. */
  name: string
  description: string
  icon: IconName
  /** Couleur d'accent (badge, icône de carte). */
  color: string
  /** Groupe dans le menu « + Nouveau ». */
  group: DocumentKindGroup
  /** Le type est proposé dans le menu de création. */
  creatable: boolean
  /** Données du module dans page.moduleData (modules V2). */
  usesModuleData: boolean
  /** Libellé du badge Library (court). */
  badge: string
  /** Inclus dans la recherche plein texte par défaut. */
  searchable: boolean
}

/** Registre — l'ordre détermine l'ordre d'affichage dans chaque groupe. */
export const DOCUMENT_KINDS: DocumentKindMeta[] = [
  // ── Créer ──────────────────────────────────────────────────────────────────
  {
    id: 'notebook',
    name: 'Carnet',
    description: 'Notes manuscrites par pages',
    icon: 'book',
    color: '#3b82f6',
    group: 'create',
    creatable: true,
    usesModuleData: false,
    badge: 'Carnet',
    searchable: true,
  },
  {
    id: 'whiteboard',
    name: 'Whiteboard',
    description: 'Toile libre en paysage',
    icon: 'layout',
    color: '#06b6d4',
    group: 'create',
    creatable: true,
    usesModuleData: false,
    badge: 'Whiteboard',
    searchable: true,
  },
  {
    id: 'formadoc',
    name: 'Document',
    description: 'Texte riche, export PDF / Markdown',
    icon: 'file-text',
    color: '#8b5cf6',
    group: 'create',
    creatable: true,
    usesModuleData: false,
    badge: 'Document',
    searchable: true,
  },
  {
    id: 'formataб',
    name: 'Tableau',
    description: 'Tableur simple avec formules',
    icon: 'table',
    color: '#10b981',
    group: 'create',
    creatable: true,
    usesModuleData: false,
    badge: 'Tableau',
    searchable: true,
  },
  {
    id: 'fmoodboard',
    name: 'Moodboard',
    description: 'Images, textes et formes libres',
    icon: 'image',
    color: '#ec4899',
    group: 'create',
    creatable: true,
    usesModuleData: false,
    badge: 'Moodboard',
    searchable: true,
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'PDF annotable importé',
    icon: 'file-text',
    color: '#ef4444',
    group: 'create',
    creatable: false, // créé via Importer PDF, pas via le menu de types
    usesModuleData: false,
    badge: 'PDF',
    searchable: true,
  },
  // ── Étudier ────────────────────────────────────────────────────────────────
  {
    id: 'subject',
    name: 'Matière',
    description: 'Regroupe documents, stats et couleur par cours',
    icon: 'folder',
    color: '#f59e0b',
    group: 'study',
    creatable: true,
    usesModuleData: true,
    badge: 'Matière',
    searchable: true,
  },
  {
    id: 'formula',
    name: 'Formules',
    description: 'Bibliothèque de formules, calculatrices, conversions',
    icon: 'table',
    color: '#0ea5e9',
    group: 'study',
    creatable: true,
    usesModuleData: true,
    badge: 'Formules',
    searchable: true,
  },
  {
    id: 'translator',
    name: 'Traduction',
    description: 'FR ↔ EN, modes simple / professionnel / technique',
    icon: 'cloud',
    color: '#6366f1',
    group: 'study',
    creatable: true,
    usesModuleData: true,
    badge: 'Traduction',
    searchable: true,
  },
  {
    id: 'dictionary',
    name: 'Dictionnaire',
    description: 'Définitions, base architecture intégrée, notes',
    icon: 'book',
    color: '#14b8a6',
    group: 'study',
    creatable: true,
    usesModuleData: true,
    badge: 'Dico',
    searchable: true,
  },
  // ── Organiser ──────────────────────────────────────────────────────────────
  {
    id: 'calendar',
    name: 'Calendrier',
    description: 'Événements par jour / semaine / mois, liés aux matières',
    icon: 'check',
    color: '#f97316',
    group: 'organize',
    creatable: true,
    usesModuleData: true,
    badge: 'Calendrier',
    searchable: true,
  },
  {
    id: 'presence',
    name: 'Présence',
    description: 'Suivi des séances : présent, absent, retard, stats',
    icon: 'check',
    color: '#84cc16',
    group: 'organize',
    creatable: true,
    usesModuleData: true,
    badge: 'Présence',
    searchable: true,
  },
  // ── Outils ─────────────────────────────────────────────────────────────────
  {
    id: 'combine',
    name: 'Combine',
    description: 'Fusionner PDF et images en un seul document',
    icon: 'copy',
    color: '#a855f7',
    group: 'tools',
    creatable: true,
    usesModuleData: true,
    badge: 'Combine',
    searchable: true,
  },
  {
    id: 'pause',
    name: 'Pause',
    description: 'Mini-jeux et minuteur de pauses',
    icon: 'zap',
    color: '#eab308',
    group: 'tools',
    creatable: true,
    usesModuleData: true,
    badge: 'Pause',
    searchable: false, // contenu ludique, pas de texte utile à indexer
  },
]

const BY_ID = new Map(DOCUMENT_KINDS.map((k) => [k.id, k]))

/** Métadonnées d'un type — fallback raisonnable si type inconnu. */
export function getKindMeta(id: DocumentType | string | undefined): DocumentKindMeta {
  return BY_ID.get(id as DocumentType) ?? (BY_ID.get('notebook') as DocumentKindMeta)
}

/** Types créables, groupés pour le menu « + Nouveau ». */
export function creatableKindsByGroup(): { group: DocumentKindGroup; label: string; kinds: DocumentKindMeta[] }[] {
  const groups: DocumentKindGroup[] = ['create', 'study', 'organize', 'tools']
  return groups.map((group) => ({
    group,
    label: KIND_GROUP_LABELS[group],
    kinds: DOCUMENT_KINDS.filter((k) => k.group === group && k.creatable),
  }))
}

/** Modules V2 (rendus par ModulePage via page.moduleData). */
export function isModuleKind(id: DocumentType | string | undefined): boolean {
  return BY_ID.get(id as DocumentType)?.usesModuleData ?? false
}

/** Nom par défaut d'un nouveau document selon son type. */
export function defaultNameForKind(kind: Exclude<DocumentType, 'pdf'>): string {
  switch (kind) {
    case 'notebook': return 'Nouveau carnet'
    case 'whiteboard': return 'Tableau blanc'
    case 'formadoc': return 'Nouveau document'
    case 'formataб': return 'Nouveau tableau'
    case 'fmoodboard': return 'Nouveau moodboard'
    case 'subject': return 'Nouvelle matière'
    case 'formula': return 'Mes formules'
    case 'translator': return 'Traduction'
    case 'dictionary': return 'Dictionnaire'
    case 'calendar': return 'Mon calendrier'
    case 'presence': return 'Suivi de présence'
    case 'combine': return 'Projet Combine'
    case 'pause': return 'Pause'
  }
}
