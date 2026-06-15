/**
 * Bibliothèque de templates architecture (Pack A — A8 V1).
 *
 * Un template est une STRUCTURE DE DOCUMENT prête à l'emploi (HTML) créée
 * comme FormaDoc via le pipeline de création existant — aucune nouvelle
 * architecture de document. Les fiches qui touchent au code rappellent la
 * vérification officielle et n'inventent aucun article.
 */
import { db } from '../../db'
import { createFormaDoc } from '../../services/library'
import { normalizeText } from './resourceTypes'

export type TemplateCategory = 'chantier' | 'rapport' | 'fiche' | 'projet' | 'etude'

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  chantier: 'Chantier',
  rapport: 'Rapports',
  fiche: 'Fiches techniques',
  projet: 'Projets',
  etude: 'Études / Révision',
}

export interface ArchitectureTemplate {
  id: string
  name: string
  category: TemplateCategory
  description: string
  tags: string[]
  /** Structure de contenu HTML du document créé. */
  contentHtml: string
}

const DISCLAIMER_HTML =
  '<blockquote><em>À vérifier dans le texte officiel. Valeurs et exigences indicatives — ne remplacent pas le code applicable ni l’avis d’un professionnel.</em></blockquote>'

export const TEMPLATES: ArchitectureTemplate[] = [
  // ─── Chantier ─────────────────────────────────────────────────────────────
  {
    id: 't-carnet-chantier', name: 'Carnet de chantier', category: 'chantier',
    description: 'Journal de chantier quotidien : présence, travaux, observations, suivis.',
    tags: ['chantier', 'journal', 'carnet', 'suivi'],
    contentHtml: '<h1>Carnet de chantier</h1><p><strong>Projet :</strong> <br><strong>Date :</strong> <br><strong>Météo :</strong> </p><h2>Personnes présentes</h2><ul><li></li></ul><h2>Travaux réalisés</h2><ul><li></li></ul><h2>Livraisons / matériaux</h2><ul><li></li></ul><h2>Observations</h2><p></p><h2>Points à suivre</h2><ul><li></li></ul>',
  },
  {
    id: 't-rapport-visite', name: 'Rapport de visite de chantier', category: 'chantier',
    description: 'Compte rendu d’une visite : constats, non-conformités, actions.',
    tags: ['visite', 'chantier', 'rapport', 'constat'],
    contentHtml: '<h1>Rapport de visite de chantier</h1><p><strong>Projet :</strong> <br><strong>Date de visite :</strong> <br><strong>Présents :</strong> </p><h2>Objet de la visite</h2><p></p><h2>Constats</h2><ul><li></li></ul><h2>Points à corriger</h2><ul><li></li></ul><h2>Actions et échéances</h2><table><thead><tr><th>Action</th><th>Responsable</th><th>Échéance</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr></tbody></table>',
  },
  {
    id: 't-inspection', name: 'Fiche d’inspection', category: 'chantier',
    description: 'Inspection par points de contrôle : conforme / non conforme / à vérifier.',
    tags: ['inspection', 'contrôle', 'qualité'],
    contentHtml: '<h1>Fiche d’inspection</h1><p><strong>Projet :</strong> <br><strong>Élément inspecté :</strong> <br><strong>Date :</strong> </p><h2>Points de contrôle</h2><table><thead><tr><th>Point</th><th>Statut</th><th>Note</th></tr></thead><tbody><tr><td></td><td>à vérifier</td><td></td></tr></tbody></table>' + DISCLAIMER_HTML,
  },

  // ─── Rapports ─────────────────────────────────────────────────────────────
  {
    id: 't-rapport-technique', name: 'Rapport technique', category: 'rapport',
    description: 'Rapport technique structuré : contexte, analyse, recommandations.',
    tags: ['rapport', 'technique', 'analyse'],
    contentHtml: '<h1>Rapport technique</h1><p><strong>Projet :</strong> <br><strong>Auteur :</strong> <br><strong>Date :</strong> </p><h2>1. Contexte</h2><p></p><h2>2. Objet</h2><p></p><h2>3. Analyse</h2><p></p><h2>4. Conclusions et recommandations</h2><ul><li></li></ul><h2>5. Annexes</h2><p></p>',
  },

  // ─── Fiches techniques ────────────────────────────────────────────────────
  {
    id: 't-fiche-materiaux', name: 'Fiche matériaux', category: 'fiche',
    description: 'Fiche de synthèse d’un matériau : propriétés, usages, limites.',
    tags: ['matériaux', 'fiche', 'propriétés'],
    contentHtml: '<h1>Fiche matériau</h1><p><strong>Matériau :</strong> <br><strong>Catégorie :</strong> </p><h2>Description</h2><p></p><h2>Propriétés</h2><ul><li></li></ul><h2>Avantages</h2><ul><li></li></ul><h2>Limites</h2><ul><li></li></ul><h2>Applications</h2><ul><li></li></ul><h2>Notes</h2><p></p>',
  },
  {
    id: 't-fiche-conformite', name: 'Fiche de conformité', category: 'fiche',
    description: 'Vérification indicative de conformité par critères paramétrables.',
    tags: ['conformité', 'vérification', 'code'],
    contentHtml: '<h1>Fiche de conformité</h1><p><strong>Élément :</strong> <br><strong>Projet :</strong> </p><h2>Critères vérifiés</h2><table><thead><tr><th>Critère</th><th>Valeur relevée</th><th>Valeur de référence</th><th>Statut</th></tr></thead><tbody><tr><td></td><td></td><td></td><td>à vérifier</td></tr></tbody></table>' + DISCLAIMER_HTML,
  },
  {
    id: 't-fiche-detail', name: 'Fiche de détail constructif', category: 'fiche',
    description: 'Documente un détail : composition, points de vigilance, schéma.',
    tags: ['détail', 'constructif', 'coupe'],
    contentHtml: '<h1>Fiche de détail constructif</h1><p><strong>Détail :</strong> <br><strong>Catégorie :</strong> </p><h2>Composition (de l’extérieur vers l’intérieur)</h2><ol><li></li></ol><h2>Points de vigilance</h2><ul><li></li></ul><h2>Schéma</h2><p><em>Insérer le détail depuis la bibliothèque de blocs (onglet « Détails constructifs »).</em></p>' + DISCLAIMER_HTML,
  },
  {
    id: 't-fiche-escalier', name: 'Fiche escalier', category: 'fiche',
    description: 'Synthèse d’un escalier : dimensions et confort (indicatif).',
    tags: ['escalier', 'blondel', 'marche', 'giron'],
    contentHtml: '<h1>Fiche escalier</h1><p><strong>Localisation :</strong> </p><h2>Dimensions</h2><ul><li>Hauteur à franchir : </li><li>Hauteur de marche : </li><li>Giron : </li><li>Nombre de contremarches : </li><li>Blondel (2h+g) : </li><li>Échappée : </li></ul>' + DISCLAIMER_HTML,
  },
  {
    id: 't-fiche-accessibilite', name: 'Fiche accessibilité', category: 'fiche',
    description: 'Points d’accessibilité d’un espace (indicatif, à vérifier au code).',
    tags: ['accessibilité', 'rampe', 'parcours', 'sans obstacle'],
    contentHtml: '<h1>Fiche accessibilité</h1><p><strong>Espace :</strong> </p><h2>Points vérifiés</h2><ul><li>Parcours sans obstacle : </li><li>Largeur de passage : </li><li>Pente de rampe : </li><li>Aires de manœuvre : </li><li>Signalisation : </li></ul>' + DISCLAIMER_HTML,
  },
  {
    id: 't-fiche-stationnement', name: 'Fiche stationnement', category: 'fiche',
    description: 'Synthèse stationnement : nombre de places et cases accessibles.',
    tags: ['stationnement', 'cases', 'accessible'],
    contentHtml: '<h1>Fiche stationnement</h1><p><strong>Projet :</strong> </p><h2>Données</h2><ul><li>Total de places : </li><li>Cases accessibles fournies : </li><li>Ratio de référence : </li><li>Dimensions des cases : </li></ul>' + DISCLAIMER_HTML,
  },
  {
    id: 't-fiche-garde-corps', name: 'Fiche garde-corps', category: 'fiche',
    description: 'Synthèse garde-corps : hauteur, ajourement, charges (indicatif).',
    tags: ['garde-corps', 'hauteur', 'ajourement', 'charge'],
    contentHtml: '<h1>Fiche garde-corps</h1><p><strong>Localisation :</strong> </p><h2>Points vérifiés</h2><ul><li>Hauteur : </li><li>Ajourement (espacement) : </li><li>Charge de calcul : </li><li>Ancrages : </li></ul>' + DISCLAIMER_HTML,
  },

  // ─── Projets ──────────────────────────────────────────────────────────────
  {
    id: 't-projet-residentiel', name: 'Projet résidentiel', category: 'projet',
    description: 'Trame de projet résidentiel : programme, contraintes, phases.',
    tags: ['projet', 'résidentiel', 'programme'],
    contentHtml: '<h1>Projet résidentiel</h1><p><strong>Client :</strong> <br><strong>Adresse :</strong> </p><h2>Programme</h2><ul><li></li></ul><h2>Contraintes (site, zonage, budget)</h2><ul><li></li></ul><h2>Phases</h2><ol><li>Esquisse</li><li>Préliminaire</li><li>Définitif</li><li>Permis</li><li>Chantier</li></ol><h2>Notes</h2><p></p>',
  },
  {
    id: 't-projet-commercial', name: 'Projet commercial', category: 'projet',
    description: 'Trame de projet commercial : usage, occupation, exigences.',
    tags: ['projet', 'commercial', 'occupation'],
    contentHtml: '<h1>Projet commercial</h1><p><strong>Client :</strong> <br><strong>Adresse :</strong> </p><h2>Usage et occupation</h2><ul><li></li></ul><h2>Exigences principales (issues, accessibilité, stationnement)</h2><ul><li></li></ul><h2>Phases</h2><ol><li>Programme</li><li>Concept</li><li>Plans</li><li>Permis</li><li>Chantier</li></ol>' + DISCLAIMER_HTML,
  },

  // ─── Études / Révision ────────────────────────────────────────────────────
  {
    id: 't-plan-revision', name: 'Plan de révision', category: 'etude',
    description: 'Organisation d’une session de révision par matière et échéances.',
    tags: ['révision', 'étude', 'planning'],
    contentHtml: '<h1>Plan de révision</h1><p><strong>Matière :</strong> <br><strong>Échéance :</strong> </p><h2>Objectifs</h2><ul><li></li></ul><h2>Concepts à maîtriser</h2><ul><li></li></ul><h2>Planning</h2><table><thead><tr><th>Date</th><th>Sujet</th><th>Fait</th></tr></thead><tbody><tr><td></td><td></td><td>☐</td></tr></tbody></table>',
  },
  {
    id: 't-checklist-remise', name: 'Checklist de remise', category: 'etude',
    description: 'Liste de vérification avant remise d’un travail ou d’un projet.',
    tags: ['checklist', 'remise', 'livraison'],
    contentHtml: '<h1>Checklist de remise</h1><p><strong>Travail / Projet :</strong> <br><strong>Échéance :</strong> </p><h2>À vérifier avant remise</h2><ul><li>☐ Contenu complet</li><li>☐ Mise en page / présentation</li><li>☐ Références / sources</li><li>☐ Exports (PDF) générés</li><li>☐ Sauvegarde effectuée</li></ul>',
  },
]

const BY_ID = new Map(TEMPLATES.map((t) => [t.id, t]))

export function getTemplate(id: string): ArchitectureTemplate | undefined {
  return BY_ID.get(id)
}

export function templateCategories(): TemplateCategory[] {
  const seen = new Set<TemplateCategory>()
  for (const t of TEMPLATES) seen.add(t.category)
  return [...seen]
}

/** Recherche dans nom, description, tags et catégorie. */
export function searchTemplates(query: string, category?: TemplateCategory | 'all'): ArchitectureTemplate[] {
  let list = TEMPLATES
  if (category && category !== 'all') list = list.filter((t) => t.category === category)
  const q = normalizeText(query)
  if (q === '') return list
  return list.filter((t) => {
    const hay = normalizeText([t.name, t.description, t.tags.join(' '), t.category, TEMPLATE_CATEGORY_LABELS[t.category]].join(' '))
    return hay.includes(q)
  })
}

/**
 * Crée un FormaDoc à partir d'un template (pipeline de création existant).
 * Retourne l'id du carnet créé.
 */
export async function createDocumentFromTemplate(template: ArchitectureTemplate): Promise<string> {
  const nb = await createFormaDoc(template.name)
  const page = await db.pages.where('notebookId').equals(nb.id).first()
  if (page) await db.pages.update(page.id, { content: template.contentHtml })
  return nb.id
}
