# Renderer abstraction (préparation WebGL)

Forma utilise aujourd’hui **Canvas 2D** via `PageCanvas.tsx` (3 calques : fond, encre, overlay).

## Types

`src/lib/renderer-types.ts` définit :

| Type | Rôle |
|------|------|
| `RendererInterface` | Contrat commun mount/render/readback |
| `CanvasRenderer` | Implémentation actuelle |
| `WebGLRenderer` | Esquisse future |
| `RenderCommand` | Liste de commandes incrémentales |
| `RenderViewport` | Pan/zoom/scale |

## Migration progressive (proposée)

1. **Phase actuelle** — Canvas 2D + dirty rects (`dirty-rect.ts`, `canvas-redraw-metrics.ts`)
2. **Phase A** — Extraire `RenderScheduler` derrière `RendererInterface` (sans changer le pixel output)
3. **Phase B** — Bench comparatif Canvas vs WebGL sur 1k/5k/10k strokes (`WEBGL-STUDY.md`)
4. **Phase C** — Feature flag `webglRenderer` (opt-in dev) si seuils atteints
5. **Phase D** — Fallback automatique Canvas si WebGL indisponible

## Seuils d’activation suggérés

| Métrique | Canvas 2D OK | Envisager WebGL |
|----------|--------------|-----------------|
| Strokes/page | ≤ 5 000 | > 10 000 |
| FPS pan/zoom | ≥ 45 | < 30 sustained |
| Full redraw ratio | < 40% | > 70% |

## Interdictions prod (0.26.x)

- Pas de PixiJS installé sans benchmark
- Pas de remplacement du renderer sans parité visuelle E2E
- Pas d’activation WebGL sur iPad sans tests stylus

Voir aussi `docs/ARCHITECTURE.md` et `docs/WEBGL-STUDY.md`.

## 0.26.1 — feature flag (prévu)

```typescript
// settingsStore futur — non activé
webglRenderer: 'off' | 'auto' | 'on'
```

Bench E2E `canvas-render-bench.spec.ts` alimente les métriques pan/zoom/reload (advisory CI).
