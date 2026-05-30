# Collaboration — design (Pack 6, backlog)

**Statut** : non branché · le nouveau Forma est **local-first**. Ce document décrit le
modèle de collaboration hérité d'ArchNote (`lib/collaboration.js`, Supabase) et la
cible d'intégration progressive. Aucune dépendance réseau n'est ajoutée tant que le
flag `VITE_SUPABASE_*` n'est pas configuré.

## 1. Objectif

Permettre le partage de ressources (carnets, FormaDoc, FormaTab, FormaReview, …) entre
utilisateurs avec permissions, fil de commentaires et notifications, **sans** casser le
fonctionnement hors-ligne actuel.

## 2. Existant local (déjà dans Forma)

| Brique | Fichier | Rôle |
|--------|---------|------|
| Liens de partage | Dexie table `shareLinks` (`id, notebookId, token`) | partage lecture par token |
| Vue partagée | `src/pages/ShareViewPage.tsx` | rendu lecture seule d'un carnet |
| Verrou multi-onglets | `src/lib/document-lock.ts`, `MULTI-TAB-LOCK.md` | un seul éditeur actif (= viewer/editor local) |
| Commentaires locaux | `src/lib/formareview/comments.ts` | threads, réponses, résolution, historique (FormaReview) |

FormaReview fournit déjà le **modèle de commentaires local** (pins, threads, rôles
prof/étudiant/équipe/jury) qui anticipe la collaboration cloud sans dépendance externe.

## 3. Modèle Supabase hérité (`collaboration.js`)

### 3.1 Permissions

```
PERMISSIONS = ['read', 'comment', 'edit', 'owner']
```

| Rôle | Droits |
|------|--------|
| `read` | lecture seule |
| `comment` | lecture + fil de commentaires |
| `edit` | écriture contenu, pas de suppression/partage |
| `owner` | CRUD complet + gestion partages et membres |

### 3.2 Tables (proposées côté serveur)

| Table | Clés | Notes |
|-------|------|-------|
| `profiles` | `id` (auth.users) | `display_name`, `email`, `avatar_url` |
| `friends` | `user_id`, `friend_id` | relation bidirectionnelle (upsert des 2 sens) |
| `friend_requests` | `id`, `from_user_id`, `to_user_id`, `status` | `pending` / `accepted` / `rejected` |
| `notifications` | `id`, `user_id`, `type`, `read` | types : `friend_request`, `friend_accepted`, `share`, `folder_invite`, `comment` |
| `shared_projects` | `id`, `owner_id`, `resource_type`, `resource_id`, `permission` | `share_token` + `is_public_link` pour liens publics |
| `shared_folders` | `id`, `owner_id`, `name` | dossiers partagés |
| `shared_folder_members` | `folder_id`, `user_id`, `permission` | membres d'un dossier |
| `shared_folder_items` | `folder_id`, `resource_type`, `resource_id` | contenu d'un dossier partagé |
| `comments` | `id`, `shared_project_id`, `user_id`, `parent_id`, `mentions`, `resolved` | threads + mentions |

### 3.3 Flux clés

- **Partage ressource** : `shareResource({ ownerId, resourceType, resourceId, permission, withLink })`
  insère dans `shared_projects`, génère un `share_token` (`crypto.randomUUID`) si lien public,
  et notifie le destinataire.
- **Lien public** : `buildShareUrl(share)` → `/{editor/:id|/}?share=<token>`. Côté Forma, mappe
  sur `ShareViewPage` + table `shareLinks`.
- **Demande d'ami** : `sendFriendRequest` → notification → `respondFriendRequest` (upsert
  bidirectionnel `friends`).
- **Commentaires** : `addComment({ sharedProjectId, content, parentId, mentions })` notifie le
  propriétaire ou le destinataire (selon l'auteur).

## 4. Cible d'intégration Forma (local-first → cloud opt-in)

1. **Phase A (local, déjà fait)** : commentaires FormaReview, liens `shareLinks`, vue partagée.
2. **Phase B (opt-in cloud)** : flag `VITE_SUPABASE_ENABLED` (default off). Mapper
   `shared_projects` ↔ `shareLinks`, `comments` ↔ `formaReviewSessions.comments`.
3. **Phase C (temps réel)** : Supabase Realtime sur `comments` et op-log (voir
   [SYNC-DESIGN.md](./SYNC-DESIGN.md)).

## 5. Confidentialité & sécurité

- Aucun upload automatique : partage **explicite** par l'utilisateur.
- Liens publics révocables (`revokeShare`) et tokens régénérables (`enableShareLink`).
- Pas de clé service côté client ; RLS Supabase par `owner_id` / `memberships`.
- Conforme aux principes de [AI-PRIVACY.md](./AI-PRIVACY.md) (opt-in, révocable).

## 6. Non-objectifs (cette version)

- Pas d'édition collaborative temps réel (CRDT/OT) — last-write-wins via op-log.
- Pas de messagerie Hub (voir backlog dans [SYNC-DESIGN.md](./SYNC-DESIGN.md) §Hub).
- Pas de présence/curseurs partagés.
