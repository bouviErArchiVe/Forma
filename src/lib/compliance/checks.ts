/**
 * Compliance Checker (Pack A — A6) — vérifications INDICATIVES de conformité.
 *
 * AVERTISSEMENT CENTRAL : aucun article officiel n'est cité ni inventé. Chaque
 * vérification compare des entrées utilisateur à des VALEURS DE RÉFÉRENCE
 * PARAMÉTRABLES (modifiables par l'utilisateur) dont les défauts sont des
 * ordres de grandeur courants — JAMAIS présentés comme la règle officielle.
 * Le résultat est indicatif et ne remplace ni le texte officiel ni l'avis
 * d'un professionnel.
 */

export const COMPLIANCE_DISCLAIMER =
  'À vérifier dans le texte officiel. Résultat indicatif — ne remplace pas le code applicable ni l’avis d’un professionnel.'

export type ComplianceCategory =
  | 'escaliers'
  | 'garde-corps'
  | 'accessibilite'
  | 'issues'
  | 'portes'
  | 'stationnement'
  | 'occupation'

export const COMPLIANCE_CATEGORY_LABELS: Record<ComplianceCategory, string> = {
  escaliers: 'Escaliers',
  'garde-corps': 'Garde-corps',
  accessibilite: 'Rampes / Accessibilité',
  issues: 'Issues',
  portes: 'Portes',
  stationnement: 'Stationnement',
  occupation: 'Occupation',
}

export type ComplianceStatus = 'conforme' | 'non-conforme' | 'a-verifier'

export interface ComplianceField {
  id: string
  label: string
  unit: string
}

/** Valeur de référence paramétrable (seuil), avec défaut indicatif. */
export interface ComplianceParam {
  id: string
  label: string
  unit: string
  default: number
}

export interface ComplianceResult {
  status: ComplianceStatus
  /** Message principal lisible. */
  message: string
  /** Points de détail (un par critère évalué). */
  details: { label: string; ok: boolean | null; note: string }[]
}

export interface ComplianceCheck {
  id: string
  category: ComplianceCategory
  name: string
  description: string
  fields: ComplianceField[]
  params: ComplianceParam[]
  /**
   * Évalue les entrées par rapport aux valeurs de référence (paramètres).
   * Toute entrée manquante/invalide ⇒ statut « a-verifier » (jamais inventé).
   */
  evaluate: (values: Record<string, number>, params: Record<string, number>) => ComplianceResult
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function allFinite(values: Record<string, number>, ids: string[]): boolean {
  return ids.every((id) => Number.isFinite(values[id]))
}

/** Agrège des critères booléens en statut + message. */
function summarize(details: { label: string; ok: boolean | null; note: string }[]): ComplianceResult {
  const known = details.filter((d) => d.ok !== null)
  if (known.length === 0) {
    return { status: 'a-verifier', message: 'Renseignez les valeurs pour évaluer.', details }
  }
  const failed = known.filter((d) => d.ok === false)
  if (failed.length > 0) {
    return {
      status: 'non-conforme',
      message: `${failed.length} critère(s) hors des valeurs de référence : ${failed.map((d) => d.label).join(', ')}.`,
      details,
    }
  }
  return { status: 'conforme', message: 'Tous les critères respectent les valeurs de référence indiquées.', details }
}

const fmt = (n: number) => String(Number(n.toFixed(2)))

// ── Catalogue de vérifications ──────────────────────────────────────────────────

export const COMPLIANCE_CHECKS: ComplianceCheck[] = [
  // ─── Escaliers ───────────────────────────────────────────────────────────────
  {
    id: 'chk-escalier',
    category: 'escaliers',
    name: 'Escalier — marche, giron et confort',
    description: 'Vérifie la hauteur de marche, le giron et la relation de confort de Blondel par rapport aux valeurs de référence.',
    fields: [
      { id: 'h', label: 'Hauteur de marche', unit: 'mm' },
      { id: 'g', label: 'Giron', unit: 'mm' },
    ],
    params: [
      { id: 'hMax', label: 'Hauteur de marche max', unit: 'mm', default: 200 },
      { id: 'gMin', label: 'Giron min', unit: 'mm', default: 250 },
      { id: 'blondelMin', label: 'Blondel min (2h+g)', unit: 'mm', default: 590 },
      { id: 'blondelMax', label: 'Blondel max (2h+g)', unit: 'mm', default: 660 },
    ],
    evaluate: (v, p) => {
      if (!allFinite(v, ['h', 'g'])) return summarize([])
      const blondel = 2 * v.h + v.g
      return summarize([
        { label: 'Hauteur de marche', ok: v.h <= p.hMax, note: `${fmt(v.h)} mm (réf. ≤ ${fmt(p.hMax)} mm)` },
        { label: 'Giron', ok: v.g >= p.gMin, note: `${fmt(v.g)} mm (réf. ≥ ${fmt(p.gMin)} mm)` },
        { label: 'Confort de Blondel', ok: blondel >= p.blondelMin && blondel <= p.blondelMax, note: `2h+g = ${fmt(blondel)} mm (réf. ${fmt(p.blondelMin)}–${fmt(p.blondelMax)} mm)` },
      ])
    },
  },

  // ─── Garde-corps ─────────────────────────────────────────────────────────────
  {
    id: 'chk-garde-corps',
    category: 'garde-corps',
    name: 'Garde-corps — hauteur et ajourement',
    description: 'Vérifie la hauteur du garde-corps et l’espacement des éléments (passage d’une sphère) par rapport aux valeurs de référence.',
    fields: [
      { id: 'hauteur', label: 'Hauteur du garde-corps', unit: 'mm' },
      { id: 'espacement', label: 'Espacement libre max entre éléments', unit: 'mm' },
    ],
    params: [
      { id: 'hauteurMin', label: 'Hauteur min', unit: 'mm', default: 1070 },
      { id: 'espacementMax', label: 'Ajourement max', unit: 'mm', default: 100 },
    ],
    evaluate: (v, p) => {
      if (!allFinite(v, ['hauteur', 'espacement'])) return summarize([])
      return summarize([
        { label: 'Hauteur', ok: v.hauteur >= p.hauteurMin, note: `${fmt(v.hauteur)} mm (réf. ≥ ${fmt(p.hauteurMin)} mm)` },
        { label: 'Ajourement', ok: v.espacement <= p.espacementMax, note: `${fmt(v.espacement)} mm (réf. ≤ ${fmt(p.espacementMax)} mm)` },
      ])
    },
  },

  // ─── Rampes / Accessibilité ──────────────────────────────────────────────────
  {
    id: 'chk-rampe',
    category: 'accessibilite',
    name: 'Rampe accessible — pente et largeur',
    description: 'Vérifie la pente et la largeur libre d’une rampe accessible par rapport aux valeurs de référence.',
    fields: [
      { id: 'denivele', label: 'Dénivelé', unit: 'mm' },
      { id: 'longueur', label: 'Longueur horizontale', unit: 'mm' },
      { id: 'largeur', label: 'Largeur libre', unit: 'mm' },
    ],
    params: [
      { id: 'penteMax', label: 'Pente max', unit: '%', default: 8.33 },
      { id: 'largeurMin', label: 'Largeur libre min', unit: 'mm', default: 870 },
    ],
    evaluate: (v, p) => {
      if (!allFinite(v, ['denivele', 'longueur', 'largeur']) || v.longueur <= 0) {
        return summarize([{ label: 'Pente', ok: null, note: 'Longueur horizontale requise (> 0).' }])
      }
      const pente = (v.denivele / v.longueur) * 100
      return summarize([
        { label: 'Pente', ok: pente <= p.penteMax, note: `${fmt(pente)} % (réf. ≤ ${fmt(p.penteMax)} %)` },
        { label: 'Largeur libre', ok: v.largeur >= p.largeurMin, note: `${fmt(v.largeur)} mm (réf. ≥ ${fmt(p.largeurMin)} mm)` },
      ])
    },
  },

  // ─── Issues ──────────────────────────────────────────────────────────────────
  {
    id: 'chk-issues',
    category: 'issues',
    name: 'Issue — largeur selon occupants',
    description: 'Compare la largeur d’issue disponible à la largeur requise calculée à partir du nombre d’occupants et d’un facteur paramétrable.',
    fields: [
      { id: 'occupants', label: 'Personnes desservies', unit: 'pers' },
      { id: 'largeurDispo', label: 'Largeur d’issue disponible', unit: 'mm' },
    ],
    params: [
      { id: 'facteur', label: 'Largeur par personne', unit: 'mm/pers', default: 6.1 },
      { id: 'largeurMin', label: 'Largeur d’issue min', unit: 'mm', default: 850 },
    ],
    evaluate: (v, p) => {
      if (!allFinite(v, ['occupants', 'largeurDispo'])) return summarize([])
      const requise = Math.max(p.largeurMin, v.occupants * p.facteur)
      return summarize([
        { label: 'Largeur d’issue', ok: v.largeurDispo >= requise, note: `${fmt(v.largeurDispo)} mm disponible (réf. requise ≈ ${fmt(requise)} mm)` },
      ])
    },
  },

  // ─── Portes ──────────────────────────────────────────────────────────────────
  {
    id: 'chk-porte',
    category: 'portes',
    name: 'Porte — largeur libre de passage',
    description: 'Vérifie la largeur libre de passage d’une porte par rapport à la valeur de référence.',
    fields: [{ id: 'largeurLibre', label: 'Largeur libre de passage', unit: 'mm' }],
    params: [{ id: 'largeurMin', label: 'Largeur libre min', unit: 'mm', default: 810 }],
    evaluate: (v, p) => {
      if (!allFinite(v, ['largeurLibre'])) return summarize([])
      return summarize([
        { label: 'Largeur libre', ok: v.largeurLibre >= p.largeurMin, note: `${fmt(v.largeurLibre)} mm (réf. ≥ ${fmt(p.largeurMin)} mm)` },
      ])
    },
  },

  // ─── Stationnement ───────────────────────────────────────────────────────────
  {
    id: 'chk-stationnement',
    category: 'stationnement',
    name: 'Stationnement accessible — places requises',
    description: 'Compare le nombre de places accessibles fournies au minimum requis, calculé à partir du total de places et d’un ratio paramétrable.',
    fields: [
      { id: 'totalPlaces', label: 'Total de places', unit: 'places' },
      { id: 'accessiblesFournies', label: 'Places accessibles fournies', unit: 'places' },
    ],
    params: [
      { id: 'ratio', label: '1 place accessible par', unit: 'places', default: 25 },
      { id: 'minimum', label: 'Minimum de places accessibles', unit: 'places', default: 1 },
    ],
    evaluate: (v, p) => {
      if (!allFinite(v, ['totalPlaces', 'accessiblesFournies']) || p.ratio <= 0) {
        return summarize([{ label: 'Places accessibles', ok: null, note: 'Ratio (> 0) et total requis.' }])
      }
      const requis = Math.max(p.minimum, Math.ceil(v.totalPlaces / p.ratio))
      return summarize([
        { label: 'Places accessibles', ok: v.accessiblesFournies >= requis, note: `${fmt(v.accessiblesFournies)} fournie(s) (réf. requis ≈ ${requis})` },
      ])
    },
  },

  // ─── Occupation ──────────────────────────────────────────────────────────────
  {
    id: 'chk-occupation',
    category: 'occupation',
    name: 'Occupation — charge vs capacité',
    description: 'Estime la charge d’occupants à partir de l’aire et d’une superficie par personne paramétrable, et la compare à une capacité maximale visée.',
    fields: [
      { id: 'aire', label: 'Aire de plancher', unit: 'm²' },
      { id: 'capaciteMax', label: 'Capacité maximale visée', unit: 'pers' },
    ],
    params: [{ id: 'parPersonne', label: 'Superficie par personne', unit: 'm²/pers', default: 1.0 }],
    evaluate: (v, p) => {
      if (!allFinite(v, ['aire', 'capaciteMax']) || p.parPersonne <= 0) {
        return summarize([{ label: 'Charge d’occupants', ok: null, note: 'Superficie par personne (> 0) requise.' }])
      }
      const charge = Math.floor(v.aire / p.parPersonne)
      return summarize([
        { label: 'Charge d’occupants', ok: charge <= v.capaciteMax, note: `≈ ${charge} personnes estimées (capacité visée ${fmt(v.capaciteMax)})` },
      ])
    },
  },
]

const BY_ID = new Map(COMPLIANCE_CHECKS.map((c) => [c.id, c]))

export function getCheck(id: string): ComplianceCheck | undefined {
  return BY_ID.get(id)
}

export function complianceCategories(): ComplianceCategory[] {
  const seen = new Set<ComplianceCategory>()
  for (const c of COMPLIANCE_CHECKS) seen.add(c.category)
  return [...seen]
}

/** Valeurs de référence par défaut d'une vérification. */
export function defaultParams(check: ComplianceCheck): Record<string, number> {
  const out: Record<string, number> = {}
  for (const p of check.params) out[p.id] = p.default
  return out
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

/** Recherche dans nom, description, catégorie et libellés de champs. */
export function searchChecks(query: string): ComplianceCheck[] {
  const q = normalize(query)
  if (q === '') return COMPLIANCE_CHECKS
  return COMPLIANCE_CHECKS.filter((c) => {
    const hay = normalize(
      [c.name, c.description, c.category, COMPLIANCE_CATEGORY_LABELS[c.category], c.fields.map((f) => f.label).join(' ')].join(' '),
    )
    return hay.includes(q)
  })
}
