# IA & confidentialité (préparation 0.25.2)

**Statut** : panneaux UI existants (`AIPanel`, OCR) — **aucune API cloud branchée**.

## Principes

1. **Opt-in explicite** avant tout envoi réseau
2. **Jamais** d’upload automatique de carnets/pages
3. **Consentement** révocable dans Paramètres
4. **Journal local** des requêtes (sans contenu sensible si possible)
5. **Mode offline** : IA désactivée

## Données envoyées (futur, si opt-in)

| Feature | Entrée | Sortie | Stockage |
|---------|--------|--------|----------|
| OCR | image sélection/crop | texte | index recherche local |
| Résumé | texte extrait pages | markdown | panneau IA |
| Q/R | question + contexte limité | réponse | session |
| Flashcards | sélection Study | cartes CSV | Study DB |
| Transcription | blob audio | texte | audio.transcript |

## Points d’intégration code

- `AIPanel.tsx` — orchestration UI
- `OCRPanel.tsx` / `tesseract.js` — OCR **local** aujourd’hui
- `speech-transcribe.ts` — stub cloud
- `handwriting-index.ts` — index local

## Masquage

- Regex emails/téléphones avant log cloud (futur)
- Troncature contexte > N tokens

## Non objectifs 0.25.x

- Pas de clé OpenAI/Anthropic en `.env` prod
- Pas de RAG sur bibliothèque complète

---

## Pack 6 — couche FormaAI héritée (ArchNote → cible Forma)

Documentation du système IA legacy d'ArchNote (`lib/formaai/`) pour guider un portage
respectueux de la vie privée. **Aucune API cloud n'est branchée par défaut** : le mode
local (fallback) fonctionne 100 % hors-ligne.

### Provider IA (`lib/formaai/provider.js`)

Abstraction à deux modes, résolus par `getAIProvider()` :

| Mode | Condition | Comportement |
|------|-----------|--------------|
| `api` | `VITE_AI_API_KEY` (ou `VITE_OPENAI_API_KEY`) présent, ou `VITE_AI_PROVIDER=api` | appel HTTP `VITE_AI_API_URL` (défaut OpenAI), modèle `VITE_AI_MODEL` |
| `mock` | aucune clé, ou `VITE_AI_PROVIDER=mock` | **handlers locaux**, zéro réseau |

- **Fallback systématique** : si l'appel API échoue, `runAIAction` retombe sur le handler
  local correspondant (jamais de blocage utilisateur).
- `testAIConnection()` : vérifie la clé et renvoie un aperçu ; messages d'erreur explicites
  (401/403 = clé invalide, `NO_API` = pas de clé).
- `runAIChat(history)` : chat multi-tours, **exige** une clé API (pas de fallback chat).

### Actions IA locales (sans réseau)

`AI_ACTIONS` / `LOCAL_HANDLERS` couvrent en mode mock :

| Action | Handler local |
|--------|---------------|
| `summarize` | extraction des premières phrases + puces |
| `spellcheck` | corrections regex FR fréquentes |
| `reformulate` | normalisation typographique |
| `technical` | gabarit notes techniques (CNB/NECB) |
| `tableHelp` / `docHelp` / `presentHelp` | gabarits d'aide par module |
| `classify` | tags par mots-clés (escaliers, murs, normes…) |

Chaque action a un `SYSTEM_PROMPT` dédié utilisé **uniquement** quand le mode `api` est actif.

### Indexeur de recherche (`lib/formaai/search/indexer.js`)

Index unifié **100 % local** (aucun envoi réseau) construit à la volée et caché
(`CACHE_TTL = 8 s`, `invalidateSearchIndex()` pour forcer).

Sources indexées et route associée :

| Source | Contenu indexé | Route |
|--------|----------------|-------|
| Carnets / pages | titre, matière, texte éléments | `/editor/:id` |
| FormaDoc | texte des pages (HTML strippé) | `/formadoc` |
| FormaTab | valeurs de cellules | `/formatab` |
| FormaCombine | noms/textes de pages | `/formacombine` |
| FormaPresent | textes des slides | `/formapresent` |
| FormaReview | contenu des commentaires | `/formareview` |
| Dossiers / assets | nom, tags, OCR | `/formafolder` |
| FormaLibrary | nom, tags, catégorie | `/formalibrary` |
| Formules / normes | titre, description, formule, tags | `/formules` |
| Cache pages | texte OCR / imports (`forma_page_*`) | `/` |

- Item normalisé : `{ id, source, type, title, text, route, meta?, updatedAt }`.
- **Cible Forma** : alimenter l'index depuis les services Dexie déjà en place
  (`services/forma*.ts`) plutôt que `localStorage` ; conserver le cache TTL.

### Confidentialité de l'index

- L'index reste **en mémoire**, jamais persisté ni transmis.
- Le RAG (envoi de contexte à l'API) reste un **non-objectif** : seules les actions
  ponctuelles opt-in envoient l'extrait sélectionné, tronqué.
- Variables d'environnement IA documentées dans `.env.example`, **jamais** committées.

## Points d'intégration UI legacy

- `FormaAILayer` : raccourcis globaux + modale recherche (events `forma:open-ai`,
  `forma:open-search`).
- `FormaAIPanel` / `FormaAIChat` / `FormaAIFab` : panneaux d'actions et chat.
- `GlobalSearchModal` : consomme l'index unifié.
