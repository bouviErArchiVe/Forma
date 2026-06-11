import type { TabTable } from './formataб'

const MAX_HISTORY = 50

export class TabHistory {
  private undoStack: string[] = []  // JSON snapshots de TabTable
  private redoStack: string[] = []

  snapshot(table: TabTable): void {
    this.undoStack.push(JSON.stringify(table))
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift()
    this.redoStack = []  // efface redo à chaque nouvelle action
  }

  undo(current: TabTable): TabTable | null {
    if (this.undoStack.length === 0) return null
    this.redoStack.push(JSON.stringify(current))
    return JSON.parse(this.undoStack.pop()!) as TabTable
  }

  redo(current: TabTable): TabTable | null {
    if (this.redoStack.length === 0) return null
    this.undoStack.push(JSON.stringify(current))
    return JSON.parse(this.redoStack.pop()!) as TabTable
  }

  get canUndo(): boolean { return this.undoStack.length > 0 }
  get canRedo(): boolean { return this.redoStack.length > 0 }

  clear(): void {
    this.undoStack = []
    this.redoStack = []
  }
}
