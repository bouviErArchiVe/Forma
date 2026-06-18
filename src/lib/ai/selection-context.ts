/**
 * FormAI — pont LECTURE SEULE entre la sélection du canvas et l'action
 * « expliquer la sélection ».
 *
 * L'accesseur de sélection de Lane B (`src/lib/drawing/selection-accessor.ts`,
 * stable sur `main`) expose un `SelectionSnapshot` STRUCTUREL (combien
 * d'éléments, de quels types, quelle boîte) mais PAS le texte des éléments. Ce
 * module fait le pont côté FormAI :
 *
 *   • il décrit une sélection structurelle en une phrase courte, ancrée et
 *     vérifiable (ex. « 2 traits et 1 zone de texte ») — utilisable comme
 *     repli quand l'hôte ne peut pas extraire de texte ;
 *   • il fabrique, à partir du texte sélectionné fourni par l'hôte (et,
 *     optionnellement, du snapshot), une chaîne propre prête à passer à
 *     `runSelectionAction` via la prop `getSelectionText` de `PageAIActions`.
 *
 * Strictement PUR et read-only : il n'appelle jamais Dexie, ne touche ni la
 * page ni la sélection, n'importe l'accesseur que pour ses TYPES/HELPERS
 * (jamais pour le muter). Aucune invention : si aucun texte n'est disponible,
 * il renvoie une chaîne vide pour que l'action retombe sur la page entière.
 */
import type {
  SelectionSnapshot,
} from '../drawing/selection-accessor'
import type { SelectableKind } from '../../types'

/** Libellés FR singuliers des types sélectionnables (pour description honnête). */
const KIND_LABELS: Record<SelectableKind, { one: string; many: string }> = {
  stroke: { one: 'trait', many: 'traits' },
  shape: { one: 'forme', many: 'formes' },
  text: { one: 'zone de texte', many: 'zones de texte' },
  image: { one: 'image', many: 'images' },
  sticker: { one: 'autocollant', many: 'autocollants' },
  tape: { one: 'ruban', many: 'rubans' },
}

/** « 2 traits », « 1 zone de texte » — pluriel FR simple, jamais inventé. */
function labelFor(kind: SelectableKind, n: number): string {
  const l = KIND_LABELS[kind]
  return `${n} ${n > 1 ? l.many : l.one}`
}

/**
 * Décrit, en une phrase courte et factuelle, ce que contient une sélection
 * structurelle (sans son texte). Utile comme repli quand l'hôte n'a pas pu
 * extraire de texte mais sait CE QUI est sélectionné.
 *
 * Pur, ne lit rien. Renvoie `''` pour une sélection vide (l'appelant retombera
 * alors sur la page entière). Les libellés reflètent fidèlement le snapshot ;
 * aucune donnée n'est inventée.
 */
export function describeSelectionStructure(snapshot: SelectionSnapshot): string {
  if (snapshot.empty || snapshot.count === 0) return ''
  const parts: string[] = []
  for (const kind of snapshot.kinds) {
    const n = snapshot.countByKind[kind]
    if (n > 0) parts.push(labelFor(kind, n))
  }
  if (parts.length === 0) return ''
  const joined =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`
  return `Sélection de ${joined}.`
}

/** Entrée du constructeur de texte de sélection (tout est optionnel). */
export interface SelectionContextInput {
  /**
   * Texte des éléments sélectionnés, extrait par l'hôte (zones de texte,
   * blocs, cellules…). Déjà lisible ; sera nettoyé (espaces normalisés).
   */
  selectionText?: string | undefined
  /**
   * Instantané structurel read-only de la sélection (accesseur Lane B). Sert
   * de repli descriptif quand aucun texte n'est disponible, et n'est jamais
   * muté.
   */
  snapshot?: SelectionSnapshot | undefined
}

/**
 * Construit, pour `getSelectionText` / `runSelectionAction`, le texte de
 * sélection à expliquer, à partir de ce que l'hôte sait de la sélection.
 *
 * Règles (ancrage strict, jamais d'invention) :
 *  1. si `selectionText` contient du texte exploitable → on le renvoie nettoyé ;
 *  2. sinon, si un `snapshot` non vide est fourni → on renvoie une DESCRIPTION
 *     structurelle honnête (ex. « Sélection de 2 traits. ») ;
 *  3. sinon → chaîne vide ⇒ l'action « expliquer la sélection » retombe
 *     proprement sur la page entière.
 *
 * Pur et synchrone : aucun effet de bord, aucune lecture Dexie/canvas.
 */
export function buildSelectionText(input: SelectionContextInput): string {
  const text = input.selectionText?.trim() ?? ''
  if (text !== '') return text
  if (input.snapshot) return describeSelectionStructure(input.snapshot)
  return ''
}

/**
 * Adapte une source de sélection en un `getSelectionText: () => string | undefined`
 * directement passable à `PageAIActions`. L'hôte fournit une fonction PURE qui
 * lit l'état courant (texte sélectionné et/ou snapshot read-only) ; on en
 * dérive le texte au moment du clic, sans jamais le conserver.
 *
 * Renvoie `undefined` quand rien d'exploitable n'est sélectionné, ce qui
 * déclenche le repli page entière dans `runSelectionAction`.
 */
export function makeGetSelectionText(
  read: () => SelectionContextInput,
): () => string | undefined {
  return () => {
    const built = buildSelectionText(read())
    return built !== '' ? built : undefined
  }
}
