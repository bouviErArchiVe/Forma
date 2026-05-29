import type { Page } from '../types'

export function clonePageState(page: Page): Page {
  return JSON.parse(JSON.stringify(page)) as Page
}

export class PageHistory {
  private undoStack: Page[] = []
  private redoStack: Page[] = []
  private batchDepth = 0
  private batchBaseline: Page | null = null

  /** Regroupe plusieurs mutations en une seule entrée undo (drag, trait, gomme…). */
  beginBatch(baseline: Page): void {
    if (this.batchDepth === 0) {
      this.batchBaseline = clonePageState(baseline)
    }
    this.batchDepth++
  }

  endBatch(): void {
    if (this.batchDepth <= 0) return
    this.batchDepth--
    if (this.batchDepth === 0 && this.batchBaseline) {
      this.undoStack.push(this.batchBaseline)
      if (this.undoStack.length > 50) this.undoStack.shift()
      this.redoStack = []
      this.batchBaseline = null
    }
  }

  cancelBatch(): void {
    this.batchDepth = Math.max(0, this.batchDepth - 1)
    if (this.batchDepth === 0) this.batchBaseline = null
  }

  isBatching(): boolean {
    return this.batchDepth > 0
  }

  push(state: Page): void {
    if (this.batchDepth > 0) return
    this.undoStack.push(clonePageState(state))
    if (this.undoStack.length > 50) this.undoStack.shift()
    this.redoStack = []
  }

  undoState(current: Page): Page | null {
    if (!this.undoStack.length) return null
    this.redoStack.push(clonePageState(current))
    return this.undoStack.pop() ?? null
  }

  redoState(current: Page): Page | null {
    if (!this.redoStack.length) return null
    this.undoStack.push(clonePageState(current))
    return this.redoStack.pop() ?? null
  }

  reset(): void {
    this.undoStack = []
    this.redoStack = []
    this.batchDepth = 0
    this.batchBaseline = null
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }
}
