import type { MoodBoard } from './fmoodboard'

const MAX_HISTORY = 30  // plus lourd que FormaTab donc moins d'états

export class BoardHistory {
  private undoStack: string[] = []
  private redoStack: string[] = []

  snapshot(board: MoodBoard): void {
    this.undoStack.push(JSON.stringify(board))
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift()
    this.redoStack = []
  }

  undo(current: MoodBoard): MoodBoard | null {
    if (this.undoStack.length === 0) return null
    this.redoStack.push(JSON.stringify(current))
    return JSON.parse(this.undoStack.pop()!) as MoodBoard
  }

  redo(current: MoodBoard): MoodBoard | null {
    if (this.redoStack.length === 0) return null
    this.undoStack.push(JSON.stringify(current))
    return JSON.parse(this.redoStack.pop()!) as MoodBoard
  }

  get canUndo() { return this.undoStack.length > 0 }
  get canRedo() { return this.redoStack.length > 0 }
  clear() { this.undoStack = []; this.redoStack = [] }
}
