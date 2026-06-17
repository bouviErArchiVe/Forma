/**
 * FormAI Page Agents V2 — presets d'agents spécialisés pour les actions de page.
 *
 * Ce registre est VOLONTAIREMENT léger et local : chaque agent est un PRESET de
 * prompt système (persona + cadrage métier) appliqué par-dessus les builders de
 * `canvas-actions.ts` (expliquer / résumer / expliquer-sélection). Il ne porte
 * aucune logique réseau ni d'écriture : c'est de la donnée pure, testable.
 *
 * Distinct du registre de CHAT `src/services/ai/agents.ts` (conversations
 * complètes) : ici on enrichit uniquement les actions contextuelles d'une page
 * dans `PageAIActions`. L'agent par défaut (`generic`) laisse le comportement
 * existant strictement inchangé.
 *
 * Garde-fous repris du flux canvas-actions :
 *  • Ancrage strict : on s'appuie UNIQUEMENT sur le texte de la page (les
 *    builders injectent déjà GROUNDING_RULES) ; le preset n'autorise jamais à
 *    inventer chiffres, articles ou normes.
 *  • Agents NORMATIFS (`normative: true`) : ajoutent une consigne anti-invention
 *    renforcée ET un avertissement de vérification officielle (NORMATIVE_DISCLAIMER)
 *    affiché dans l'UI à côté du disclaimer générique. Ils ne citent jamais un
 *    numéro d'article/tableau sans le marquer « à vérifier dans le texte officiel ».
 *
 * Local-first : aucun de ces agents n'exige le cloud. Sans provider cloud
 * configuré, le provider local honnête répond (extractif, sans invention).
 */

/** Identifiant d'un agent de page. `generic` = comportement par défaut. */
export type PageAgentId = 'generic' | 'architecture' | 'normes' | 'structure' | 'etudes'

/** Agent par défaut : preset neutre, comportement historique inchangé. */
export const DEFAULT_PAGE_AGENT_ID: PageAgentId = 'generic'

/**
 * Avertissement spécifique aux agents NORMATIFS, affiché EN PLUS de
 * AI_DISCLAIMER. Aucune sortie normative ne doit être traitée comme une
 * référence faisant foi : la vérification dans le texte officiel est obligatoire.
 */
export const NORMATIVE_DISCLAIMER =
  'Domaine normatif : aucun numéro d’article, valeur ou exigence cité ici ne fait foi. '
  + 'Vérifiez systématiquement dans le texte officiel applicable (selon juridiction et date) '
  + 'et faites valider la conformité par un professionnel agréé.'

export interface PageAgent {
  id: PageAgentId
  /** Libellé court affiché dans le sélecteur. */
  name: string
  /** Nom d'icône du composant ui/Icon. */
  icon: string
  /** Rôle en une phrase (tooltip / aide). */
  description: string
  /**
   * Persona injectée en tête du prompt système des actions de page. Vide pour
   * `generic` (on garde alors le prompt d'origine des builders tel quel).
   */
  persona: string
  /**
   * true ⇒ agent normatif : consigne anti-invention renforcée dans le prompt
   * système + NORMATIVE_DISCLAIMER affiché côté UI.
   */
  normative: boolean
}

/**
 * Consigne anti-invention renforcée ajoutée au prompt système des agents
 * normatifs (complète, sans la remplacer, la garde GROUNDING_RULES des builders).
 */
export const NORMATIVE_GROUNDING =
  'Tu n’inventes JAMAIS de numéro d’article, de tableau, d’annexe ou de valeur '
  + 'réglementaire. Si une référence précise n’est pas présente dans le texte fourni, '
  + 'décris le concept et écris explicitement « à vérifier dans le texte officiel ». '
  + 'La version applicable dépend de la juridiction et de la date ; recommande la '
  + 'validation par un professionnel agréé.'

/** Registre des agents de page (ordre = ordre d'affichage dans le sélecteur). */
export const PAGE_AGENTS: PageAgent[] = [
  {
    id: 'generic',
    name: 'Général',
    icon: 'sparkles',
    description: 'Assistant FormAI généraliste — comportement par défaut.',
    persona: '',
    normative: false,
  },
  {
    id: 'architecture',
    name: 'Architecture',
    icon: 'layout',
    description: 'Conception : espaces, circulation, composition, lumière, parti.',
    persona:
      "Adopte le point de vue de l'agent Architecture de FormAI : tu analyses le "
      + 'contenu sous l’angle de la conception architecturale (organisation spatiale, '
      + 'circulation, composition, proportions, lumière naturelle, programme, intention '
      + 'de projet). Les dimensions évoquées restent des ordres de grandeur indicatifs, '
      + 'à valider selon le contexte réglementaire du projet.',
    normative: false,
  },
  {
    id: 'normes',
    name: 'Normes (CNB/CCQ)',
    icon: 'book',
    description: 'Réglementation du bâtiment — concepts, avec vérification officielle.',
    persona:
      "Adopte le point de vue de l'agent Normes de FormAI (réglementation du bâtiment, "
      + 'CNB au Canada / CCQ au Québec). Tu expliques les CONCEPTS réglementaires '
      + '(usages, aires, séparations coupe-feu, issues et évacuation, accessibilité, '
      + 'sécurité incendie) à partir du texte fourni. '
      + NORMATIVE_GROUNDING,
    normative: true,
  },
  {
    id: 'structure',
    name: 'Structure',
    icon: 'folder',
    description: 'Comportement structural : charges, systèmes porteurs, principes.',
    persona:
      "Adopte le point de vue de l'agent Structure de FormAI : tu analyses le contenu "
      + 'sous l’angle du comportement structural (descente de charges, systèmes porteurs, '
      + 'flexion/compression/traction, stabilité, portées, matériaux structuraux). Tu '
      + 'raisonnes en principes et ordres de grandeur. '
      + NORMATIVE_GROUNDING,
    normative: true,
  },
  {
    id: 'etudes',
    name: 'Études',
    icon: 'book',
    description: 'Aide aux études : explication pédagogique, points clés, révision.',
    persona:
      "Adopte le point de vue de l'agent Études de FormAI : tu aides un étudiant à "
      + 'comprendre et réviser le contenu (explication pédagogique progressive, mise en '
      + 'évidence des notions clés et du vocabulaire, liens entre les idées). Tu restes '
      + 'fidèle au texte fourni et tu n’ajoutes pas de connaissances externes non vérifiées.',
    normative: false,
  },
]

/** Retourne l'agent demandé, ou l'agent générique si l'id est inconnu/absent. */
export function getPageAgent(id: PageAgentId | string | undefined | null): PageAgent {
  return PAGE_AGENTS.find((a) => a.id === id) ?? PAGE_AGENTS[0]
}

/** true si l'agent (résolu depuis son id) est normatif (vérification officielle). */
export function isNormativeAgent(id: PageAgentId | string | undefined | null): boolean {
  return getPageAgent(id).normative
}

/**
 * Compose un prompt système d'action de page avec la persona de l'agent.
 *
 * Pur : préfixe `basePrompt` (issu d'un builder canvas-actions) par la persona
 * de l'agent. Pour `generic` (persona vide), renvoie `basePrompt` inchangé — ce
 * qui garantit la non-régression du comportement par défaut.
 *
 * La garde anti-hallucination (GROUNDING_RULES) reste portée par `basePrompt` ;
 * les agents normatifs y ajoutent NORMATIVE_GROUNDING via leur persona.
 */
export function applyAgentToSystemPrompt(
  basePrompt: string,
  id: PageAgentId | string | undefined | null,
): string {
  const agent = getPageAgent(id)
  if (agent.persona.trim() === '') return basePrompt
  return `${agent.persona}\n\n${basePrompt}`
}
