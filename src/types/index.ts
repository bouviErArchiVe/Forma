export type PaperTemplate =
  | 'blank'
  | 'lined'
  | 'lined-wide'
  | 'lined-narrow'
  | 'grid'
  | 'dots'
  | 'cornell'
  | 'planner'
  | 'music'

export type ViewMode = 'grid' | 'list' | 'timeline'
export type SortBy = 'name' | 'modified' | 'created' | 'subject' | 'size'
export type SortOrder = 'asc' | 'desc'

export type ToolType =
  | 'pen'
  | 'pencil'
  | 'highlighter'
  | 'eraser'
  | 'lasso'
  | 'shapes'
  | 'text'
  | 'image'
  | 'elements'
  | 'tape'
  | 'laser'

export type ShapeType = 'line' | 'arrow' | 'rectangle' | 'ellipse'
export type DocumentType = 'notebook' | 'pdf' | 'whiteboard'
export type ThemeMode = 'light' | 'dark' | 'system'
export type Orientation = 'portrait' | 'landscape'
export type StrokeTool = 'pen' | 'highlighter' | 'pencil'

export interface Point {
  x: number
  y: number
  pressure: number
  /** Alias spec addendum : `time` */
  timestamp: number
  tiltX?: number
  tiltY?: number
}

export interface Stroke {
  id: string
  tool: StrokeTool
  color: string
  width: number
  opacity: number
  points: Point[]
  pageId: string
}

export interface ShapeElement {
  id: string
  type: ShapeType
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  pageId: string
}

export interface TextElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  content: string
  fontSize: number
  color: string
  align: 'left' | 'center' | 'right'
  /** Rotation en radians autour du centre du bloc. */
  rotation?: number
  pageId: string
}

export interface PdfLink {
  x: number
  y: number
  width: number
  height: number
  url?: string
  /** Index de page cible (0-based) pour liens PDF internes */
  targetPageIndex?: number
}

export interface ImageElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  /** Inline legacy ou blob: URL après hydratation */
  dataUrl?: string
  /** Référence IndexedDB `assets` */
  assetId?: string
  /** Rotation en radians autour du centre. */
  rotation?: number
  pageId: string
}

export interface TapeElement {
  id: string
  x: number
  y: number
  width: number
  height: number
  color: string
  revealed: boolean
  pageId: string
}

export interface StickerElement {
  id: string
  stickerId: string
  x: number
  y: number
  size: number
  rotation?: number
  pageId: string
}

export interface Page {
  id: string
  notebookId: string
  order: number
  template: PaperTemplate
  strokes: Stroke[]
  shapes: ShapeElement[]
  texts: TextElement[]
  images: ImageElement[]
  stickers: StickerElement[]
  tapes: TapeElement[]
  pdfPageIndex?: number
  pdfDataUrl?: string
  pdfAssetId?: string
  pdfText?: string
  pdfLinks?: PdfLink[]
  /** Texte OCR de l’encre (recherche manuscrit) */
  inkText?: string
  rotation: 0 | 90 | 180 | 270
  favorite?: boolean
}

export interface Notebook {
  id: string
  folderId: string | null
  name: string
  coverColor: string
  paperTemplate: PaperTemplate
  orientation: Orientation
  type: DocumentType
  createdAt: number
  updatedAt: number
  favorite?: boolean
  deletedAt?: number
  /** Matière (legacy ArchNote subjects) */
  subjectId?: string
  /** PDF source original pour réindexation texte */
  pdfSourceDataUrl?: string
  pdfSourceAssetId?: string
}

export interface Folder {
  id: string
  parentId: string | null
  name: string
  emoji?: string
  color?: string
  createdAt: number
  updatedAt: number
}

export interface AudioRecording {
  id: string
  notebookId: string
  pageId: string | null
  dataUrl?: string
  assetId?: string
  duration: number
  createdAt: number
  markers: { time: number; pageId: string }[]
  /** Transcription vocale (Web Speech API) */
  transcript?: string
}

export interface StudyCard {
  id: string
  notebookId: string
  front: string
  back: string
  mastery: number
  nextReview: number
  createdAt: number
}

/** Instantané manuel d'une page (historique de versions) */
export interface PageSnapshot {
  id: string
  pageId: string
  label: string
  createdAt: number
  data: Page
}

export interface ShareLink {
  id: string
  notebookId: string
  token: string
  permission: 'view' | 'edit'
  createdAt: number
}

export interface ToolPreset {
  tool: 'pen' | 'pencil' | 'highlighter'
  color: string
  width: number
}

export const DEFAULT_TOOL_PRESETS: ToolPreset[] = [
  { tool: 'pen', color: '#000000', width: 2 },
  { tool: 'pen', color: '#1e40af', width: 2.5 },
  { tool: 'highlighter', color: '#fef08a', width: 20 },
]

export interface EditorSettings {
  activeTool: ToolType
  shapeType: ShapeType
  penColor: string
  penWidth: number
  pencilColor: string
  pencilWidth: number
  highlighterColor: string
  highlighterWidth: number
  eraserSize: number
  eraserMode: 'all' | 'pen' | 'highlighter' | 'shapes' | 'tape'
  tapeColor: string
  readMode: boolean
  toolbarOrder: ToolType[]
}

export type SelectableKind = 'stroke' | 'shape' | 'text' | 'image' | 'sticker' | 'tape'

export interface SelectionItem {
  kind: SelectableKind
  id: string
}

export const COVER_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
] as const

export const PEN_COLORS = [
  '#000000',
  '#1e40af',
  '#dc2626',
  '#16a34a',
  '#9333ea',
  '#ea580c',
] as const

export const DEFAULT_TOOLBAR: ToolType[] = [
  'pen',
  'pencil',
  'highlighter',
  'eraser',
  'lasso',
  'shapes',
  'text',
  'image',
  'elements',
  'tape',
  'laser',
]

export type PageViewMode = 'single' | 'continuous'

export type SyncInterval = 'off' | 'daily' | 'weekly'
export type PaperTone = 'cream' | 'white' | 'sepia'

export const PAPER_TONE_COLORS: Record<PaperTone, string> = {
  cream: '#fffef9',
  white: '#ffffff',
  sepia: '#f4ecd8',
}

export interface AppSettings {
  theme: ThemeMode
  palmRejection: boolean
  fingerScroll: boolean
  gridSnap: boolean
  defaultPenWidth: number
  defaultZoom: number
  shapeHoldMs: number
  onboardingDone: boolean
  pageViewMode: PageViewMode
  autoSnapshot: boolean
  scribbleErase: boolean
  showRuler: boolean
  showPerfHud: boolean
  syncInterval: SyncInterval
  paperTone: PaperTone
  defaultPaperTemplate: PaperTemplate
  defaultCoverColor: string
  /** Thème visuel FTheme (20 palettes ArchNote). */
  visualThemeId: string
}

function normalizePoint(p: Point): Point {
  return {
    x: p.x,
    y: p.y,
    pressure: p.pressure ?? 0.5,
    timestamp: p.timestamp ?? Date.now(),
    tiltX: p.tiltX ?? 0,
    tiltY: p.tiltY ?? 0,
  }
}

export function normalizePage(page: Page): Page {
  return {
    ...page,
    strokes: (page.strokes ?? []).map((s) => ({
      ...s,
      points: s.points.map(normalizePoint),
    })),
    shapes: page.shapes ?? [],
    texts: page.texts ?? [],
    images: page.images ?? [],
    stickers: page.stickers ?? [],
    tapes: page.tapes ?? [],
    pdfLinks: page.pdfLinks ?? [],
  }
}

export function emptyPageFields(): Pick<
  Page,
  'strokes' | 'shapes' | 'texts' | 'images' | 'stickers' | 'tapes'
> {
  return { strokes: [], shapes: [], texts: [], images: [], stickers: [], tapes: [] }
}
