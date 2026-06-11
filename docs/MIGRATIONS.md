# Migrations Dexie — Forma

**Version courante :** `FORMA_DB_VERSION = 7` (`src/db/index.ts`)

## Historique

| Version | Changement | Upgrade |
|---------|------------|---------|
| v1 | folders, notebooks, pages | — |
| v2 | audio, studyCards, shareLinks, settings ; normalizePage | `.upgrade()` pages |
| v3 | stickers[] par défaut | `.upgrade()` |
| v4 | pageSnapshots | schéma |
| v5 | table `assets` (blobs) | schéma |
| v6 | externalisation dataURL inline pages → assets ; index `pdfAssetId` | `runDexieDataUrlMigrationTx` |
| v7 | `pdfSourceDataUrl` carnet → `pdfSourceAssetId` ; index secondaire | `runDexiePdfSourceMigrationTx` |

## v6 — images / PDF page inline

- Seuil : dataURL ≥ **4096 octets**
- Petites images restent inline
- Tests : `schema.test.ts`, `dataurl-migration.test.ts`

## v7 — PDF source carnet

- Migre `notebook.pdfSourceDataUrl` (data URL) → asset `{id}-pdf-source`
- Idle : `migrateAllPdfNotebookSources()` reste pour rattrapage post-upgrade
- Test : `schema.test.ts` « v7 upgrade externalizes inline pdfSourceDataUrl »

## v8 (prévu) — audio inline

- `AudioRecording.dataUrl` → `assetId`
- Non implémenté ; idle via `persistAudioAsset`

## Règles

1. Toujours ajouter un **changement d’index** Dexie pour déclencher `.upgrade()` si le schéma stores est identique.
2. Migrations upgrade : parse data URL **synchrone** (pas `fetch` en transaction).
3. Ne jamais bloquer l’ouverture DB : migration best-effort, idle rattrape le reste.

Voir `src/lib/dataurl-migration.ts`, `src/db/schema.test.ts`.
