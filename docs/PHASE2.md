# Phase 2 — Performance moteur

État après **0.23.0**.

## 2.1 Virtualisation vue continue

| Élément | Statut |
|---------|--------|
| IntersectionObserver mount/unmount | ✅ |
| Marge dynamique (40/80+ pages) | ✅ `continuousRootMargin` |
| Démontage différé 700 ms | ✅ |
| Prefetch PDF voisines | ✅ `computePrefetchIndices` + `centerIndex` |
| Page pooling canvas | ✅ `page-canvas-pool.ts` (3–5 montages) |

## 2.2 Canvas

| Élément | Statut |
|---------|--------|
| Dirty rects encre | ✅ |
| RAF overlay (lasso, ruban) | ✅ 0.22 |
| Audit redraws global | ⏳ partiel |

## 2.3 PDF

| Élément | Statut |
|---------|--------|
| Cache LRU 36 pages | ✅ |
| Prefetch ordonné, concurrence 3 | ✅ |
| Bench dev (Paramètres) | ✅ 0.23+ |
| Tests 50/200 pages automatisés | ⏳ manuel |

## 2.4 Miniatures

| Élément | Statut |
|---------|--------|
| `thumb-queue.ts` | ✅ coalescence, invalidation |
| Sidebar lazy IO | ✅ |
| Bibliothèque lazy IO | ✅ 0.22 |
| Stroke batching pen | ✅ ≥4 traits |

## Prochaines étapes

- Réutilisation DOM canvas entre pages (vrai pool)
- Bench PDF automatisé (seuil CI ou script)
- SLA perf mesuré sur iPad réel
