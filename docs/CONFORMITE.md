# Matrice de conformité — Spec ↔ Code

**Version** : 0.24.0 · **Dernière revue QA** : 2026-05-29

| ID | Exigence | Statut | Notes |
|----|----------|--------|-------|
| PWA-1 | manifest standalone | ✅ | `public/manifest.json` — name, theme, maskable icons |
| PWA-2 | Service Worker offline | ✅ | `sw.js` v8 — shell precache, network-first HTML, cache-first `/assets/` |
| PWA-3 | Icônes PNG multi-tailles | ✅ | `icon-192.png`, `icon-512.png` |
| PWA-4 | Indicateur offline | ✅ | `OfflineBanner.tsx` + reconnexion |
| PWA-6 | Multi-onglets | ✅ | `MultiTabBanner` + BroadcastChannel |
| PWA-5 | Update flow | ✅ | `pwa.ts` + Paramètres — SKIP_WAITING, reload |
| ARCH-1 | Pas de refactor massif | ✅ | Diffs ciblés par périmètre |
| CANVAS-1 | Coordonnées world/screen | 🟡 | World OK ; zoom par carnet persisté |
| CANVAS-2 | Layers séparés | 🟡 | 3 calques canvas ; pas 10 layers spec |
| CANVAS-3 | Dirty rectangles | 🟡 | Encre partielle + fond caché ; RAF overlay |
| CANVAS-4 | Pooling vue continue | 🟡 | `maxMountedCanvases` 3–5 ; placeholder hors pool |
| STROKE-1 | Split 5k / 10s | ✅ | `lib/stroke-finalize.ts` |
| STROKE-2 | tiltX/tiltY | ✅ | Champs sur `Point` |
| STROKE-3 | Export PDF vectoriel | 🟡 | Traits, formes, flèches ; fond raster |
| FORMA-1 | Structure ZIP arborescente | ✅ | v1 + validation + tests |
| FORMA-2 | Assets en blobs + intégrité | ✅ | Blobs + SHA-256 manifest (warning si mismatch) |
| SAVE-1 | Autosave debounce 2s | ✅ | Tests `autosave.test.ts` |
| SAVE-2 | Flush visibility | ✅ | `visibilitychange` + `pagehide` |
| SAVE-3 | État Error | ✅ | UI + réessai ; toast quota |
| PDF-1 | Lazy import | ✅ | Import lazy par défaut |
| PDF-2 | Cache viewport | ✅ | LRU 36, prefetch ±2, concurrence 3 |
| PDF-3 | Liens mode lecture | ✅ | |
| PERF-1 | Virtualisation vue continue | 🟡 | IO + pool canvas + démontage différé |
| PERF-2 | Mesures FPS / SLA | 🟡 | HUD dev ; pas de gate CI |
| SEL-1 | Moteur sélection | 🟡 | Lasso ; rotation clavier `[` `]` (0.24) |
| DATA-1 | Cycle de vie assets | ✅ | GC, clone, move ; Dexie v6 migration |
| DATA-2 | `.forma` round-trip | ✅ | merge + replace (backup auto avant replace) |
| DATA-3 | Import replace sécurisé | ✅ | Sauvegarde `.forma` auto horodatée |
| SYNC-1 | Queue / oplog futur | 🟡 | localStorage ; tests ; pas de backend |
| EXPORT-1 | PNG 2× | ✅ | `exportPageToPng` async |
| EXPORT-2 | SVG vecteur | 🟡 | RDP `path-simplify` ; images inline |
| TEST-1 | Suite Vitest | ✅ | **94/94** (17 fichiers) |
| TEST-2 | Journal save | ✅ | `save-journal.test.ts` |
| TEST-3 | E2E Playwright | 🟡 | Smoke : accueil, carnet, navigation |

## Couverture tests (0.22.0)

| Fichier | Périmètre |
|---------|-----------|
| `backup-roundtrip.test.ts` | Dexie export/import, blobs, carnet |
| `dataurl-migration.test.ts` | Externalisation dataURL |
| `forma-package.test.ts` | Import + intégrité SHA-256 |
| `schema.test.ts` | Dexie v5 |
| `page-history.test.ts` | Undo batch |
| `continuous-viewport.test.ts` | Pool + prefetch indices |
| `selection-engine.test.ts` | Sélection pure |
| `pdf-page-render.test.ts` | Helpers purs (sans pdfjs) |
| `thumb-queue.test.ts` | Priorité, coalescence |
| `autosave.test.ts` | Debounce, flush |
| `sync-queue.test.ts` | Queue localStorage |
| `save-journal.test.ts` | Ring buffer |

## Résultats build / test (2026-05-29)

```
npm run test  → 70 passed (15 files)
npm run build → OK
```

Légende : ✅ conforme · 🟡 partiel · ❌ absent
