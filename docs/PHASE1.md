# Phase 1 — Consolidation noyau documentaire

État après **0.18.0**.

## 1.1 Format `.forma`

| Élément | Statut |
|---------|--------|
| Validation manifest / metadata | ✅ `forma-validate.ts` |
| Import partiel (pages corrompues) | ✅ |
| Blobs round-trip assetId | ✅ |
| Audio assetId export/import | ✅ 0.18 |
| Champ `integrity` manifest (checksum futur) | ✅ réservé `algorithm: none` |
| Tests automatiques | ✅ vitest `forma-validate.test.ts`, `forma-package.test.ts` |
| Thumbnails dans ZIP | ⏳ hors package (régénérés à l’affichage) |

## 1.2 Migration dataURL → Blob

| Élément | Statut |
|---------|--------|
| Migration idle batch | ✅ `migrateInlinePagesBatch` |
| GC orphelins | ✅ |
| Santé DB (refs cassées, inline restant) | ✅ `db-health.ts` + Paramètres |

## 1.3 Autosave

| Élément | Statut |
|---------|--------|
| File séquentielle par page (anti-race) | ✅ 0.18 |
| Génération / re-save si edit pendant flush | ✅ |
| Journal événements | ✅ `save-journal.ts` |
| Toast quota | ✅ 0.17 |
| Recovery localStorage | ✅ existant |

## 1.4 IndexedDB

| Élélement | Statut |
|---------|--------|
| Dexie v5 + assets | ✅ |
| Import backup destructif + confirm | ✅ 0.18 |
| Import backup merge (non destructif) | ✅ 0.23 |
| Rapport santé | ✅ `getDbHealthReport` |

## Prochaines étapes Phase 1

- ~~Tests round-trip avec Dexie in-memory (fake-indexeddb)~~ ✅ 0.22
- ~~Checksum SHA-256 optionnel dans manifest~~ ✅ 0.22
- ~~Merge import backup (non destructif)~~ ✅ 0.23
- Export thumbnails optionnel dans metadata
