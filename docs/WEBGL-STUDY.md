# WebGL — étude technique (0.25.2)

**Décision** : ne pas activer en production avant 0.26+.

## Comparatif

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Canvas 2D optimisé** (actuel) | Simple, undo facile, PDF raster OK | Limite ~10k traits fluides |
| **PixiJS** | Sprites, batch, filtres | Dépendance lourde, courbe d’apprentissage |
| **WebGL custom** | Contrôle total | Coût maintenance élevé |
| **Hybride 2D + WebGL** | Encre WebGL, UI 2D | Deux pipelines à synchroniser |

## Seuils d’activation proposés

| Métrique | Canvas 2D | Envisager WebGL |
|----------|-----------|-----------------|
| Traits page | < 3k | ≥ 5k sustained |
| FPS pan/zoom | ≥ 55 | < 45 |
| Mémoire tab | < 400 MB | > 600 MB |
| Pages PDF actives | < 20 | > 50 |

## Abstraction renderer (migration progressive)

```typescript
interface RenderCommand {
  kind: 'stroke' | 'image' | 'clear' | 'clip'
  data: unknown
}

interface PageRenderer {
  drawBackground(page: Page): Promise<void>
  drawCommands(cmds: RenderCommand[]): void
  readPixels?(clip: InkClip): ImageData
}
```

Implémentations futures : `Canvas2DRenderer`, `WebGLRenderer` (stub).

## Plan migration

1. Extraire `renderPageContent` → liste `RenderCommand` (0.26)
2. Bench Playwright réel (0.25.2+) pour valider seuils
3. Prototype WebGL offscreen (branche expérimentale)
4. Feature flag `settings.webglInk` — default off
