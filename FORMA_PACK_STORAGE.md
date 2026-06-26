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
