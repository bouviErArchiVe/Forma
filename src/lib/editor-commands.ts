export type EditorCommand =
  | 'search'
  | 'outline'
  | 'history'
  | 'presentation'
  | 'toggle-continuous'
  | 'shortcuts'
  | 'scanner'
  | 'prev-page'
  | 'next-page'
  | 'toggle-sidebar'
  | 'focus-mode'
  | 'index-ink'
  | 'index-notebook'
  | 'duplicate-page'
  | 'print'
  | 'panel-ai'
  | 'ai-summarize-page'
  | 'ai-explain-page'
  | 'panel-study'
  | 'panel-ocr'
  | 'panel-share'
  | 'panel-audio'
  | 'export-markdown-page'
  | 'export-markdown-notebook'
  | 'close-other-tabs'
  | 'export-study-csv'
  | 'toggle-read-mode'
  | 'toggle-page-favorite'
  | 'toggle-fullscreen'

const EVENT = 'forma-editor-command'

export function dispatchEditorCommand(cmd: EditorCommand): void {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: cmd }))
}

export function onEditorCommand(handler: (cmd: EditorCommand) => void): () => void {
  const fn = (e: Event) => handler((e as CustomEvent<EditorCommand>).detail)
  window.addEventListener(EVENT, fn)
  return () => window.removeEventListener(EVENT, fn)
}
