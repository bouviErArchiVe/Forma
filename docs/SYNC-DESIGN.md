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
