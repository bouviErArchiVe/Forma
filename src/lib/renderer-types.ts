/**
 * Abstraction renderer — préparation WebGL sans activation prod.
 * Voir docs/RENDERER.md et docs/WEBGL-STUDY.md.
 */

import type { Page } from '../types'

export type RendererKind = 'canvas2d' | 'webgl'

export interface RenderViewport {
  width: number
  height: number
  scale: number
  offsetX: number
  offsetY: number
}

export type RenderCommand =
  | { type: 'clear'; clip?: { x: number; y: number; w: number; h: number } }
  | { type: 'stroke'; strokeId: string }
  | { type: 'shape'; shapeId: string }
  | { type: 'text'; textId: string }
  | { type: 'image'; imageId: string }
  | { type: 'overlay'; layer: 'selection' | 'lasso' | 'ruler' }

export interface RendererInterface {
  readonly kind: RendererKind
  mount(container: HTMLElement): void
  unmount(): void
  setPage(page: Page, viewport: RenderViewport): void
  execute(commands: RenderCommand[]): void
  readbackPng?(scale?: number): Promise<Blob>
}

/** Implémentation actuelle (Canvas 2D multi-calques). */
export interface CanvasRenderer extends RendererInterface {
  kind: 'canvas2d'
}

/** Esquisse future — non branchée. */
export interface WebGLRenderer extends RendererInterface {
  kind: 'webgl'
}
