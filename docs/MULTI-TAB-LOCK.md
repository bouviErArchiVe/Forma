# Verrou multi-onglets (document lock)

Forma empêche l’édition concurrente du **même carnet** dans plusieurs onglets du même navigateur.

## Mécanisme

- Clé `localStorage` : `forma-doc-lock-{notebookId}`
- Valeur : `{ tabId, at }` — `at` est rafraîchi toutes les **5 s** par l’onglet éditeur
- Expiration : **45 s** sans refresh (`DOCUMENT_LOCK_STALE_MS`)
- Le second onglet est forcé en **lecture seule** (`readMode: true`) avec bannière

## Cycle de vie

1. **Ouverture éditeur** : `pruneStaleDocumentLocks()` puis `tryAcquireDocumentLock`
2. **Heartbeat** : intervalle 5 s → `refreshDocumentLock`
3. **Storage event** : synchronise l’état entre onglets
4. **Fermeture onglet / navigation** : `releaseDocumentLock` (cleanup React + `pagehide`)
5. **Démarrage app** : `pruneStaleDocumentLocks()` dans `main.tsx`

## Reprise d’édition

Si le verrou est **absent ou expiré** (onglet fermé sans cleanup, crash), le second onglet peut cliquer **Reprendre l’édition** :

- `pruneStaleDocumentLocks()`
- `tryReacquireDocumentLock(notebookId, tabId)`
- désactive `readMode` si succès
- **Hint UI** : compte à rebours `getDocumentLockRemainingMs()` + toast si échec (0.26.1+)

Si un autre onglet détient encore un verrou actif, la reprise échoue silencieusement (pas de perte de données).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `src/lib/document-lock.ts` | API verrou |
| `src/pages/EditorPage.tsx` | Bannière + heartbeat + reprise |
| `tests/e2e/multi-tab.spec.ts` | E2E lecture seule + reprise stale |

## Limites connues

- Verrou **par navigateur / profil** uniquement (pas cross-device)
- Mode privé : `localStorage` peut échouer → pas de verrou fiable
- Deux fenêtres **profils différents** peuvent toujours écrire en parallèle
