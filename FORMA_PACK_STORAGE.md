# FORMA — Stratégie de stockage du Resource Pack (Sprint #26)

Le pack documentaire PDF (≈64 MB : `forma_dictionary_core` 23 MB, `formai_rag_review`
26 MB, `formai_rag_core` 15 MB, + index légers) est aujourd'hui **servi en
same-origin** depuis `public/knowledge-pack/part10/` et **versionné dans le repo**
(seul P1 de l'audit RC #25). Ce sprint introduit une **abstraction de source non
destructive** (`src/services/knowledge-pack/pack-source.ts`) pour préparer une
sortie progressive du repo, **sans rien supprimer ni casser**.

## Abstraction livrée (#26)

- `resolvePackBaseUrl()` : `explicit` > base distante configurée > **same-origin (défaut)**.
- `configurePackSource({ remoteBaseUrl, allowSameOriginFallback })` : opt-in (ou `VITE_FORMA_PACK_BASE_URL`).
- `fetchPackJson(file, { baseUrl?, expectedChecksum? })` : repli same-origin si la source distante échoue (transport) ; **jamais** de repli sur un mismatch de **checksum** (intégrité).
- Checksum SHA-256 vérifié **si** le manifeste fournit `checksums[file]` (sinon ignoré → comportement inchangé).
- Fail-safe : mismatch checksum / échec ⇒ `batch failed`, **aucune écriture Dexie**, dataset existant préservé.
- Import lazy par dataset (#22), idempotence, `packDataInBundle=0`, Dexie v17 : **inchangés**.

## Matrice de décision

| Option | Coût | Complexité | Offline-first | Versioning | Checksum | Sécurité | CORS | Cache | Rollback | Déploiement / Vercel | PWA | Reco |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. Repo Git (actuel) | gratuit | nulle | ✅ ship avec l'app | via git | manifeste | public | n/a (same-origin) | navigateur+Dexie | git revert | repo lourd (+64 MB clone/CI) | ✅ | court terme |
| 2. Git LFS | gratuit→payant (quota) | moyenne | ✅ (checkout) | LFS ptrs | manifeste | public | n/a | idem | LFS | Vercel doit pull LFS ; CI plus lourd | ✅ | non prioritaire |
| 3. GitHub Release assets | gratuit | faible | ⚠️ fetch au 1er usage | tag/release | sha par asset | public | CORS GH OK | Dexie après import | re-upload | repo léger ; fetch externe | ✅ après import | **moyen terme ✅** |
| 4. CDN (Cloudflare/jsDelivr) | faible | moyenne | ⚠️ 1er usage | path/version | manifeste | public | configurable | CDN+Dexie | re-publish | repo léger ; dépend CDN | ✅ après import | bon si trafic |
| 5. Supabase Storage | faible→payant | moyenne | ⚠️ 1er usage | bucket/version | manifeste | clé/RLS possible | configurable | Dexie | versions bucket | repo léger ; dépend Supabase | ✅ après import | si déjà Supabase |
| 6. Vercel Blob | usage | moyenne | ⚠️ 1er usage | clé/version | manifeste | token | même-origine possible | Dexie | re-upload | natif Vercel | ✅ après import | si hébergé Vercel |
| 7. same-origin `public/` sans git (build-time copy) | gratuit | faible | ✅ ship avec l'app | build | manifeste | public | n/a | navigateur+Dexie | rebuild | repo léger SI pack récupéré au build | ✅ | **transition ✅** |
| 8. Pack externe versionné (manifeste pointant la source) | variable | moyenne | ⚠️ 1er usage | manifeste+checksum | ✅ | selon backend | configurable | Dexie | manifeste | flexible | ✅ après import | cible long terme |

## Recommandation

- **Court terme (maintenant)** : conserver **same-origin par défaut** (option 1). L'abstraction #26 est en place, opt-in, testée — aucun changement de comportement, offline-first préservé.
- **Transition (étape suivante, hors de ce sprint)** : option **7** (sortir les 64 MB du suivi git ; les fournir au build/déploiement dans `public/`) OU option **3** (GitHub Release assets via `VITE_FORMA_PACK_BASE_URL`), en **ajoutant des `checksums` au manifeste** pour activer la vérification d'intégrité. Cela vide le repo des 64 MB **sans réécriture d'historique** (un commit `git rm --cached` + `.gitignore` suffit le jour J).
- **Long terme** : option **8** (pack externe versionné, manifeste pointant la source + checksums), avec téléchargement à la demande et cache Dexie offline.
- **À NE PAS faire** : supprimer les fichiers existants ou réécrire l'historique git **avant** d'avoir validé un backend et l'offline (Option C — PWA/Offline Verification). L'abstraction rend cette migration future **propre et réversible**.

## Étapes de migration future (non exécutées ce sprint)

1. Choisir le backend (3 ou 7 recommandés) + générer `checksums` SHA-256 par fichier dans `offline_manifest.json`.
2. Vérifier l'offline (Option C) : SW + pack en Dexie après 1er import.
3. Publier le pack sur le backend ; définir `VITE_FORMA_PACK_BASE_URL`.
4. `git rm --cached public/knowledge-pack/part10/data/app/*.json` + `.gitignore` (pas de réécriture d'historique).
5. Vérifier import distant + repli + checksum en conditions réelles.

## Checksums réels ACTIVÉS (Sprint #28)

- `offline_manifest.json` porte désormais les **SHA-256 réels** des 8 fichiers du pack (section `checksums`), générés par `npm run knowledge:pack-checksums` sur les **octets exacts** des fichiers disque.
- Stabilité octets garantie : `public/knowledge-pack/** -text` dans `.gitattributes` (aucune conversion EOL sur aucun clone, LF sans BOM).
- Équivalence vérifiée par test : hash « octets disque » (script Node/Buffer) == hash « texte fetché » (import navigateur, `TextEncoder`) sur le vrai fichier.
- `createdAt` du manifeste **inchangé** (clé d'idempotence : la changer forcerait un réimport global chez les utilisateurs existants).
- Fail-safe prouvé sur données réelles : contenu altéré ⇒ `PackChecksumError`, batch `failed`, **aucune écriture Dexie**, dataset existant conservé, jamais de repli same-origin sur une erreur d'intégrité.
- **Régénération obligatoire** après toute modification d'un fichier du pack : `npm run knowledge:pack-checksums` (sinon l'import échoue fail-safe).
- Conséquence : le prérequis « intégrité » de la migration externe est rempli — un pack distant corrompu/tronqué sera rejeté avant Dexie.

---

# Sprint #29 — Décision backend & runbooks de migration

Préparation technique COMPLÈTE (#26 abstraction + #27 offline + #28 intégrité).
Ce document transforme la matrice en décision opérationnelle. **Docs-only : aucune
migration effectuée, les 64 MB restent dans le repo jusqu'à validation réelle.**

## 1. Décision recommandée

| Backend | Coût | Complexité | Versioning | CORS | Verdict |
|---|---|---|---|---|---|
| **GitHub Release assets** | gratuit | très faible | tag par release | `*` (objects.githubusercontent.com) | ✅ **RECOMMANDÉ** |
| Supabase Storage | gratuit → payant | moyenne | chemin par version | permissif (bucket public) | ✅ alternative « produit » |
| CDN dédié (Cloudflare R2…) | faible | moyenne | chemin | à configurer | alternative robuste |
| Vercel Blob | payant au volume | faible | URL par blob | OK | seulement si déjà sur Vercel Pro |
| Same-origin actuel | inclus | nulle | git | n/a | conservé comme **fallback** |
| Build-time copy (hors repo) | nul | faible | manuel | n/a | n'enlève pas le poids du déploiement |
| Git LFS rétroactif | quota LFS | élevée (réécriture historique) | git | n/a | ❌ écarté (décision #22) |

- **Choix recommandé / le plus simple / économique : GitHub Release assets** — gratuit, versionné par tag, aucun backend applicatif, CORS `*` natif, URLs stables.
- **Choix professionnel / le plus robuste : Supabase Storage ou CDN** — gestion de cache fine, renouvellement de pack sans release GitHub.
- Court terme : **garder same-origin en fallback** (les 64 MB restent servis) jusqu'à plusieurs validations réelles.

## 2. Runbook — GitHub Release assets (recommandé)

> Les étapes marquées **[UTILISATEUR]** exigent le compte GitHub réel — non exécutables par l'agent.

1. **[UTILISATEUR]** Créer une release versionnée sur le repo :
   `gh release create pack-part10-v1 --title "Forma Pack Part10 v1" --notes "Resource Pack 64MB"`  
2. **[UTILISATEUR]** Uploader les 9 fichiers de `public/knowledge-pack/part10/data/app/` **à plat** (les assets GitHub n'ont pas de sous-dossiers ; notre loader fetch des noms de fichiers à plat → compatible tel quel) :
   `gh release upload pack-part10-v1 public/knowledge-pack/part10/data/app/*.json`
3. URL de base attendue :
   `https://github.com/<OWNER>/<REPO>/releases/download/pack-part10-v1`
   (chaque fichier = `<base>/offline_manifest.json`, `<base>/forma_dictionary_core.json`, …)
4. Vérifier le service : `curl -sI <base>/offline_manifest.json` → 302 vers `objects.githubusercontent.com`, puis 200 ; header `access-control-allow-origin: *` sur la cible. Note : `content-type: application/octet-stream` est OK (le loader lit `res.text()` + `JSON.parse`, pas `res.json()`).
5. Vérifier les checksums post-upload : télécharger un fichier, `sha256sum`, comparer à `manifest.checksums` (déjà réels depuis #28).
6. Configurer `VITE_FORMA_PACK_BASE_URL=<base>` (voir §4), **build**, **preview**.
7. Valider selon la checklist §5 (import dictionary/rag/search, fail-safe, offline, fallback).
8. **Rollback** : retirer `VITE_FORMA_PACK_BASE_URL`, rebuild/redeploy → retour same-origin (§6).

## 3. Runbook — Supabase Storage (alternative)

1. **[UTILISATEUR]** Créer un bucket **public** `forma-pack` ; uploader les 9 fichiers sous `part10/` avec `cache-control: public, max-age=31536000, immutable` (fichiers immuables par version).
2. URL de base : `https://<project>.supabase.co/storage/v1/object/public/forma-pack/part10`
3. CORS : le storage public Supabase sert des en-têtes permissifs par défaut ; vérifier avec `curl -sI` que `access-control-allow-origin` couvre l'origine de Forma.
4. Vérifier checksums post-upload (idem §2.5).
5. `VITE_FORMA_PACK_BASE_URL=<base>` → build → preview → checklist §5.
6. Rollback identique (§6). Nouvelle version de pack = nouveau préfixe `part10-v2/` + régénération `knowledge:pack-checksums` + nouveau manifest.

## 4. Variable d'environnement

- `VITE_FORMA_PACK_BASE_URL` — **build-time** (Vite inline `import.meta.env` au build : changer la valeur ⇒ rebuild/redeploy obligatoire).
  - vide/absente ⇒ same-origin `/knowledge-pack/part10/data/app` (défaut actuel, inchangé) ;
  - définie ⇒ source distante opt-in, avec **repli same-origin automatique** sur échec transport (jamais sur erreur d'intégrité).
- Local : `VITE_FORMA_PACK_BASE_URL=https://… npm run build && npm run preview` (ou `.env.local`).
- Vercel : Project → Settings → Environment Variables → `VITE_FORMA_PACK_BASE_URL` (Production), puis redeploy.

## 5. Checklist de validation post-migration

- [ ] `<base>/offline_manifest.json` accessible (200, CORS OK)
- [ ] Les 8 fichiers datasets accessibles
- [ ] Checksums post-upload == `manifest.checksums` (#28)
- [ ] Import dictionary OK (Dexie peuplé)
- [ ] Import rag OK
- [ ] Import search OK (2500 keywords)
- [ ] Fail-safe testé : altérer un octet distant ⇒ `PackChecksumError`, rien en Dexie
- [ ] Offline après import OK (pack lu depuis Dexie, #27)
- [ ] Search docpack OK · Dictionary Documents OK · FormAI pack grounding OK
- [ ] Fallback same-origin OK (couper le remote ⇒ repli silencieux)
- [ ] Console propre · packDataInBundle=0

## 6. Rollback

Désactiver `VITE_FORMA_PACK_BASE_URL` → rebuild/redeploy → retour same-origin.
**Aucun risque utilisateur** : les packs déjà importés vivent dans Dexie (idempotence
par version, pas de réimport) ; le fallback transport couvre aussi les pannes remote
sans redéploiement tant que les 64 MB restent servis en same-origin.

## 7. Plan futur de suppression des 64 MB

UNIQUEMENT après plusieurs validations réelles de la checklist §5 :
1. PR dédiée supprimant `public/knowledge-pack/part10/data/{app hors manifest?}` — décision fine : garder `offline_manifest.json` local n'a pas de sens si la base est distante ; suppression simple des fichiers, **pas de réécriture d'historique** (le repo garde le poids dans l'historique, acceptable court terme).
2. Vérifier build + deploy + import distant sans fallback possible (`allowSameOriginFallback` reste vrai mais la cible same-origin 404 → l'échec remonte proprement : tester ce chemin).
3. MAJ docs (ce fichier, RC audit, STATE) ; la release/le bucket devient la **source officielle**.
4. Nettoyage de l'historique Git (filter-repo/BFG) : décision séparée, plus tard, seulement si le poids du clone devient un problème réel.

## 8. Décision à trancher (product owner)

| Critère | Choix |
|---|---|
| Recommandé (défaut argumenté) | **GitHub Release assets** |
| Le plus économique | GitHub Release assets (gratuit) |
| Le plus simple | GitHub Release assets (2 commandes `gh`) |
| Le plus professionnel | Supabase Storage / CDN |
| Le plus robuste long terme | CDN (R2/CloudFront) |

**Action attendue** : choisir le backend, exécuter les étapes [UTILISATEUR] du runbook,
puis lancer le sprint « Effective Pack Migration » (court : env var + validation §5).
