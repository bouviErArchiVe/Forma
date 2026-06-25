# FORMA — Audit Release Candidate (Sprint #25)

Audit holistique après les sprints #17–#24 (streaming localmodel, Resource Pack PDF,
RAG grounding, source chips, QA matrix, navigation source, import lazy, dedup/ranking,
readiness pass). Base auditée : `main` 2092ccaf.

## Résultat global : RC-READY (aucun P0/P1 de code)

| Domaine | Résultat | Détail |
|---|---|---|
| Routes (16) | ✅ | toutes rendent ; `/trash` = empty-state légitime (« Corbeille vide ») ; 0 erreur console |
| FormAI | ✅ | seed (lien+source, fromCloud=false), pack clean/review+warning, no-result honnête, streaming mocké, Stop/Abort, fallback — couverts par QA matrix #20 (11/11), coordination #23 (13/13), citations #19 (5/5) |
| Dictionary | ✅ | Base Forma (slug enrichi + source), Documents (monté, filtres, badges Sourcé/À vérifier, quarantine invisible, doc pré-filtré) |
| Search | ✅ | knowledge (5 hits « béton ») ; docpack gardé par `isPackDatasetImported` (pas d'import massif involontaire) |
| Dexie / import | ✅ | v17 intact ; import par dataset (dictionary ≈23 MB / rag ≈41 MB / search léger) idempotent (import-datasets 7/7) ; pack content **0** dans le bundle JS |
| Offline / PWA | ⚠️ P2 | manifest présent ; service worker **production-only** (inactif en dev → non vérifiable ici) ; offline réel repose sur SW buildé + pack en Dexie |
| Mobile / iPad | ✅ | 0 débordement horizontal à 390 et 768 sur FormAI/Dictionary/Search/Documents ; chips tronquées/contenues |
| Bundle / perf | ✅ (P1 noté) | index principal 314 KB ; seeds en chunks lazy (hors index) ; pack **hors bundle JS** ; aucun SDK lourd ; gros chunks lazy (pdf.worker 1,1 MB / pdf 812 KB) |
| Tests | ✅ | tsc -b 0 · vitest 1548/1548 (142 fichiers) · build OK |

## Findings

- **P0 bloquant** : aucun.
- **P1 important** : pack **64 MB versionné** dans `public/knowledge-pack/part10/` → poids du repo / clone / déploiement. *Ce n'est pas un bug* (comportement choisi, offline-first) → traiter via **Option C (stockage externe / LFS)** comme décision de déploiement.
- **P2 mineur** :
  - Service worker offline non vérifiable en dev (production-only) → QA offline réelle = manuelle sur build.
  - QA serveur réel **LM Studio/Ollama** (CORS, streaming, perf) reste **manuelle côté utilisateur** (non testable ici).
- **P3 polish** : `/trash` empty-state au texte minimal (par design) ; highlight page Documents = best-effort si une entrée visible correspond.

## Registre de risques (restants)

| Risque | Sévérité | Statut | Mitigation / décision |
|---|---|---|---|
| Pack 64 MB dans le repo | P1 | acté | Option C : stockage externe (CDN / release asset / LFS) en préservant l'offline-first |
| Import 64 MB à froid (rag ≈41 MB) | P2 | maîtrisé | import lazy **par dataset** #22 (Documents = dictionary seul ; rag à la 1re question FormAI) + état d'import clair |
| LM Studio/Ollama réel non testé | P2 | ouvert | playbook QA manuel + diagnostic exportable #13 ; à exécuter côté utilisateur (Option A) |
| CORS réel localmodel | P2 | ouvert | diagnostic prudent `unreachable-or-cors` #13 ; fallback extractif #11 garantit une réponse |
| Service worker / offline | P2 | maîtrisé | SW production-only ; manifest OK ; données en Dexie (hors ligne après 1re visite/import) |
| Flake `backup.spec` (ipad, parallèle) | P3 | accepté | passe 6/6 en isolation ; environnemental Windows ; non lié au sprint |

## Checklist Release Candidate

- [x] `npx tsc -b` propre
- [x] `npm run test -- --run` vert (1548)
- [x] `npm run build` vert
- [x] `packDataInBundle` = 0 (contenu pack absent des chunks JS)
- [x] Aucun SDK lourd (openai/anthropic/eventsource/langchain absents)
- [x] Dexie v17 inchangé
- [x] Toutes les routes principales rendent (0 erreur console)
- [x] FormAI : seeds + pack + chips + streaming + Stop + fallback + no-result
- [x] Dictionary Base Forma + Documents (badges, source/page, quarantine cachée)
- [x] Search knowledge + docpack (sans import massif involontaire)
- [x] Responsive mobile 390 + iPad 768 sans débordement
- [x] Phrase officielle review inchangée
- [ ] QA réelle LM Studio/Ollama (manuel utilisateur — Option A)
- [ ] Stratégie stockage pack 64 MB (décision — Option C)

## Prochaine étape recommandée (étayée)

L'application est RC-ready côté code. Les deux seuls items ouverts sont **infra/manuel** :
1. **Option C — stockage externe du pack** (résout la seule dette P1 : 64 MB repo) ;
2. **Option A — QA réelle LM Studio/Ollama** (P2, côté utilisateur, non automatisable ici).
La polish Documents (B) reste P3 (optionnelle).
