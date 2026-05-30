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

export interface MoodboardBoard {
  id: string
  name: string
  emoji: string
  color: string
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface MoodboardImage {
  id: string
  boardId: string
  assetId?: string
  remoteUrl?: string
  name: string
  tags: string[]
  description: string
  starred: boolean
  x: number
  y: number
  w: number
  h: number
  rotation: number
  zIndex: number
  naturalWidth?: number
  naturalHeight?: number
  createdAt: number
  updatedAt: number
}

export interface FormaDocumentPage {
  id: string
  html: string
}

export type FormaDocTemplateId = 'blank' | 'notes' | 'course' | 'technical'

export interface FormaDocument {
  id: string
  name: string
  templateId: FormaDocTemplateId
  createdAt: number
  updatedAt: number
  fontFamily: string
  fontSize: number
  lineHeight: number
  pages: FormaDocumentPage[]
}

export interface SheetCellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  fontSize?: number
  color?: string
  bg?: string
  alignH?: 'left' | 'center' | 'right'
  alignV?: 'top' | 'middle' | 'bottom'
  format?: 'text' | 'number' | 'percent' | 'date' | 'title'
  border?: boolean
}

export interface SheetCellData {
  raw: string
  style?: SheetCellStyle
}

export interface SheetMergeRange {
  r1: number
  c1: number
  r2: number
  c2: number
}

export interface FormaSheet {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  rows: number
  cols: number
  rowHeights: number[]
  colWidths: number[]
  cells: Record<string, SheetCellData>
  merges: SheetMergeRange[]
  sortCol: number | null
  sortDir: 'asc' | 'desc'
  locked: boolean
}

export type FormaSlideTransition = 'none' | 'fade' | 'slide' | 'zoom'
export type FormaSlideAnimation = 'none' | 'fadeIn' | 'slideUp' | 'zoomIn'
export type FormaSlideElementType = 'text' | 'image'
export type FormaPresentTemplateId =
  | 'blank'
  | 'architecture'
  | 'portfolio'
  | 'jury'
  | 'scolaire'
  | 'concept'

export interface FormaSlideElement {
  id: string
  type: FormaSlideElementType
  x: number
  y: number
  w: number
  h: number
  rotation: number
  opacity: number
  zIndex: number
  animation: FormaSlideAnimation
  createdAt: number
  content?: string
  fontSize?: number
  color?: string
  align?: 'left' | 'center' | 'right'
  fontFamily?: string
  bold?: boolean
  dataUrl?: string | null
  src?: string | null
  label?: string
}

export interface FormaSlide {
  id: string
  name: string
  bgColor: string
  bgImage: string | null
  transition: FormaSlideTransition
  notes: string
  elements: FormaSlideElement[]
  createdAt: number
}

export interface FormaDeckSettings {
  showGrid: boolean
  showGuides: boolean
  snapToGrid: boolean
  gridSize: number
}

export interface FormaDeck {
  id: string
  title: string
  template: FormaPresentTemplateId | string
  slides: FormaSlide[]
  settings: FormaDeckSettings
  createdAt: number
  updatedAt: number
}

export type FormaCalCategory =
  | 'school'
  | 'project'
  | 'architecture'
  | 'work'
  | 'personal'
  | 'exam'
  | 'deadline'
  | 'reading'
  | 'meeting'
  | 'homework'
  | 'reminder'

export type FormaCalPriority = 'low' | 'normal' | 'high' | 'urgent'
export type FormaCalStatus = 'todo' | 'in_progress' | 'done' | 'late'
export type FormaCalViewId =
  | 'day'
  | 'week'
  | 'month'
  | 'year'
  | 'planning'
  | 'timeline'
  | 'agenda'
  | 'project'
  | 'deadlines'

export interface FormaCalChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface FormaCalEvent {
  id: string
  title: string
  description: string
  startAt: number
  endAt: number
  allDay: boolean
  category: FormaCalCategory
  presetId: string | null
  color: string
  icon: string
  priority: FormaCalPriority
  status: FormaCalStatus
  tags: string[]
  reminderOffsets: number[]
  recurrence: unknown | null
  attachments: unknown[]
  links: Record<string, string>
  checklist: FormaCalChecklistItem[]
  completed: boolean
  createdAt: number
  updatedAt: number
}

export interface FormaCalSettings {
  weekStartsOn: 0 | 1
  defaultView: FormaCalViewId
  defaultReminder: number
}

export type FormaReviewMode = 'plans' | 'team' | 'jury' | 'prof'
export type FormaReviewRole = 'prof' | 'student' | 'team' | 'jury'
export type FormaReviewTool =
  | 'select'
  | 'hand'
  | 'draw'
  | 'eraser'
  | 'highlight'
  | 'text'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'pin'

export type FormaReviewMarkupType = 'highlight' | 'text' | 'arrow' | 'draw' | 'rect' | 'circle'

export interface FormaReviewPage {
  id: string
  name: string
  width: number
  height: number
  dataUrl: string | null
  previewScale?: number
  createdAt: number
}

export interface FormaReviewPin {
  id: string
  pageId: string
  x: number
  y: number
  label: string
  authorId: string
  authorName: string
  role: FormaReviewRole
  status: 'open' | 'resolved'
  createdAt: number
}

export interface FormaReviewCommentHistory {
  content: string
  editedAt: number
}

export interface FormaReviewComment {
  id: string
  pinId: string | null
  pageId: string | null
  parentId: string | null
  content: string
  authorId: string
  authorName: string
  role: FormaReviewRole
  resolved: boolean
  history: FormaReviewCommentHistory[]
  createdAt: number
  updatedAt: number
}

export interface FormaReviewMarkup {
  id: string
  pageId: string
  type: FormaReviewMarkupType
  data: Record<string, unknown>
  authorId: string
  authorName: string
  role: FormaReviewRole
  createdAt: number
}

export interface FormaReviewSessionSettings {
  authorRole: FormaReviewRole
  authorName: string
  authorId?: string
  showResolved: boolean
}

export interface FormaReviewSession {
  id: string
  title: string
  description: string
  mode: FormaReviewMode
  pages: FormaReviewPage[]
  pins: FormaReviewPin[]
  markups: FormaReviewMarkup[]
  comments: FormaReviewComment[]
  settings: FormaReviewSessionSettings
  createdAt: number
  updatedAt: number
}

export type FormaCombinePageType = 'raster' | 'text' | 'blank' | 'separator' | 'title'

export interface FormaCombinePage {
  id: string
  name: string
  type: FormaCombinePageType
  width: number
  height: number
  rotation: number
  dataUrl: string | null
  text: string
  bgColor: string
  sourceType: string
  sourceRef: string | null
  createdAt: number
}

export interface FormaCombineProjectSettings {
  pageNumbers: boolean
  title: string
}

export interface FormaCombineProject {
  id: string
  name: string
  pages: FormaCombinePage[]
  settings: FormaCombineProjectSettings
  createdAt: number
  updatedAt: number
}

export interface InternalCombineSource {
  id: string
  name: string
  type: 'formadoc' | 'formatab' | 'forma'
  nbId?: string
  pageId?: string
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
