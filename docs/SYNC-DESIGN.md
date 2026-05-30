# Sync / cloud — design (préparation 0.25.2)

**Statut** : non branché · queue locale uniquement (`sync-queue.ts`)

## Objectif

Synchroniser carnets/pages/assets entre appareils via Supabase sans refonte IndexedDB.

## Modèle Supabase (proposé)

| Table | Clés | Notes |
|-------|------|-------|
| `profiles` | `id` (auth.users) | plan, prefs |
| `notebooks` | `id`, `owner_id` | métadonnées carnet |
| `pages` | `id`, `notebook_id` | JSON page compressé ou refs assets |
| `assets` | `id`, `owner_id` | blob storage Supabase |
| `ops` | `id`, `notebook_id`, `seq` | op-log append-only |
| `memberships` | `notebook_id`, `user_id`, `role` | owner / editor / viewer |

## Permissions

- **owner** : CRUD + partage
- **editor** : écriture pages, pas delete carnet
- **viewer** : lecture seule (comme verrou multi-onglets)

## Auth

- Supabase Auth (email/OAuth) — variables `VITE_SUPABASE_*` documentées dans `.env.example`
- JWT court + refresh ; pas de clé service côté client

## Op-log local → cloud

1. Mutation locale (autosave) → enqueue op sérialisable
2. Worker push batch vers `/ops`
3. Serveur assigne `seq`, broadcast realtime (futur)
4. Pull : replay ops `seq > lastApplied`

## Conflits (v1 simple)

- Last-write-wins par `page.id` + horodatage
- Ops non commutatives : flag `failed`, UI merge manuel (futur)

## Audit `sync-queue.ts`

- Statuts : `pending`, `applied`, `synced`, `failed`
- Max 500 ops, purge 30 jours
- Ops JSON : `{ type, notebookId, pageId?, payload, at }`

## API future (REST)

```
POST /v1/notebooks/{id}/ops     — push batch
GET  /v1/notebooks/{id}/ops?since=seq
GET  /v1/notebooks/{id}/snapshot
```

Voir aussi [SYNC_API.md](./SYNC_API.md).

## 0.26.1 — replay & sérialisation

- Ops locales doivent rester **JSON-safe** (pas de Blob inline)
- Replay : ordre `seq` strict ; idempotence via `op.id`
- Feature flag futur : `VITE_SYNC_ENABLED` (default off)

---

## Pack 6 — moteur de sync hérité (ArchNote → cible Forma)

Cette section documente le moteur de synchronisation legacy d'ArchNote afin de guider
une intégration progressive. Rien n'est branché : Forma reste **local-first**, le cloud
est opt-in derrière un flag.

### Fournisseurs cloud (`lib/sync/cloudProviders.js`)

| Provider | id | Statut |
|----------|----|--------|
| Local seulement | `local` | actif (défaut) |
| Supabase Cloud | `supabase` | actif si `isSupabaseConfigured` |
| iCloud / CloudKit | `icloud` | préparé, `comingSoon` |

- `resolveSyncModeLabel({...})` calcule un statut UI : `saved_local`, `offline`,
  `syncing_cloud`, `synced`, `error`.
- `connectCloudProvider(id)` valide la config (ex : `VITE_SUPABASE_URL` /
  `VITE_SUPABASE_ANON_KEY`) avant d'activer.

### File d'attente cloud (`lib/sync/cloudQueue.js`)

- Queue persistée en `localStorage` (clé `SYNC_KEYS.cloudQueue`), **bornée à 100 items**.
- Items : `{ id, resourceType, resourceId, label, enqueuedAt, attempts, lastAttempt }`.
- `enqueueCloudSync` dédoublonne par `(resourceType, resourceId)`.
- `processCloudQueue(handlers, { cloudEnabled })` : no-op si offline ou cloud désactivé ;
  back-off via `CLOUD_RETRY_MS` après échec ; succès → `removeFromCloudQueue`.
- **Cible Forma** : remplacer le `localStorage` par la table Dexie `sync-queue.ts`
  existante (mêmes statuts `pending`/`applied`/`synced`/`failed`).

### Détection de conflits (`detectSyncConflict`)

```
detectSyncConflict({ localUpdatedAt, remoteUpdatedAt, localHash, remoteHash })
```

- Égalité de hash → pas de conflit.
- Sinon compare les horodatages : version locale plus récente conservée, version cloud
  plus récente → proposer restauration depuis l'historique. Aligné sur le LWW décrit ci-dessus.

### Push page → cloud (`lib/sync/cloudSync.js`)

- `syncNotebookPageToCloud(pageId, notebookId, pageRecord)` : ignore les carnets locaux
  (`isLocalNotebookId`), met à jour `pages` (canvas_data, elements) + `notebooks.updated_at`.

## Versions & snapshots

Le legacy stocke des **snapshots** versionnés (récupération / historique) :

| Fonction | Table | Rôle |
|----------|-------|------|
| `saveCloudSnapshot({ userId, resourceType, resourceId, payload, label })` | `resource_snapshots` | sauvegarde versionnée |
| `listCloudSnapshots(userId, type, id, limit=20)` | `resource_snapshots` | historique récent |
| `getCloudSnapshot` / `restoreCloudSnapshot` | `resource_snapshots` | lecture / restauration |

UI associée legacy : `SyncStatusBadge`, `SyncSettingsSection`, `SyncRecoveryModal`.

## FormaCloud — bundles (`lib/formacloud/sync.js`)

Orchestration multi-provider (Drive/iCloud-like) + **export/import bundle local** sans serveur :

- `runFormaCloudSync(store, { force })` : machine à états (`offline`/`syncing`/`synced`/
  `conflict`/`error`) avec file d'attente dédiée (`lib/formacloud/queue.js`).
- `exportFormaBundle()` → fichier JSON `forma-cloud-bundle` v1 (index + contenus).
- `importFormaBundle(file, { confirmOverwrite })` : **jamais d'écrasement sans confirmation
  explicite** ; mappe les chemins du bundle vers les clés de stockage locales.
- **Cible Forma** : `exportFormaBundle`/`importFormaBundle` sont les meilleurs candidats à
  porter en premier (transfert manuel multi-appareils, zéro dépendance cloud) sur Dexie.

## Hub / Message — backlog

- Messagerie inter-utilisateurs (`lib/formamessage/cloud.js` legacy) : hors périmètre.
- Dépend de la couche collaboration ([COLLAB-DESIGN.md](./COLLAB-DESIGN.md)) et de Supabase
  Realtime. À planifier après Phase B collaboration.

## Ordre de portage recommandé

1. `exportFormaBundle` / `importFormaBundle` sur Dexie (backup/restore manuel) — sans réseau.
2. `resource_snapshots` local → table Dexie `snapshots` (historique + restauration).
3. Branchement Supabase opt-in (`VITE_SYNC_ENABLED`) : queue Dexie → `/ops`.
4. Conflits avancés (merge manuel) et temps réel.
