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

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name' | 'modified' | 'created'
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
/**
 * Types de documents Forma.
 * Les six premiers sont historiques (chaînes de stockage à NE PAS renommer —
 * compatibilité des données Dexie existantes). Les suivants sont les modules
 * Forma V2 ; le registre central vit dans src/lib/document-kinds.ts.
 */
export type DocumentType =
  | 'notebook'
  | 'pdf'
  | 'whiteboard'
  | 'formadoc'
  | 'formataб'
  | 'fmoodboard'
  | 'calendar'
  | 'combine'
  | 'formula'
  | 'translator'
  | 'dictionary'
  | 'presence'
  | 'pause'
  | 'subject'
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
  /**
   * Métadonnées de bloc technique (bibliothèque de blocs de dessin).
   * Présentes uniquement quand l'image provient d'un bloc inséré : le visuel
   * est un raster du SVG du bloc, ces champs en conservent l'identité pour la
   * recherche/réinsertion. N'affectent pas le rendu (réutilise le pipeline image).
   */
  blockId?: string
  blockCategory?: string
  blockUnit?: 'metric' | 'imperial'
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
  /** Contenu HTML riche pour FormaDoc (type formadoc uniquement). */
  content?: string
  /** Données tableau JSON pour FormaTab (type formataб uniquement). */
  tableData?: string
  /** Données moodboard JSON pour FMoodboard (type fmoodboard uniquement). */
  moodboardData?: string
  /** Données JSON des modules V2 (calendar, formula, presence, etc.) —
   *  schéma propre à chaque module, voir src/modules/<module>/. */
  moduleData?: string
  /** Timestamp ms de dernière modification de la page. */
  updatedAt?: number
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
  /** PDF source original pour réindexation texte */
  pdfSourceDataUrl?: string
  pdfSourceAssetId?: string
  /** Matière associée (id d'un document de type 'subject') — V2 */
  subjectId?: string
  /** Projet associé (id d'un Project) — écosystème workspace */
  projectId?: string
}

// ─── Écosystème workspace : tâches & projets ──────────────────────────────────

export type TaskStatus = 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  /** Échéance locale `YYYY-MM-DD`. */
  dueDate?: string
  /** Matière liée (notebook 'subject'). */
  subjectId?: string
  /** Projet lié. */
  projectId?: string
  /** Document lié (notebook id). */
  documentId?: string
  important?: boolean
  createdAt: number
  updatedAt: number
  deletedAt?: number
}

export interface Project {
  id: string
  name: string
  color: string
  description?: string
  createdAt: number
  updatedAt: number
  favorite?: boolean
  deletedAt?: number
}

// ─── Académique : sessions, quiz, révisions, checklists ───────────────────────

export type AcademicTerm = 'automne' | 'hiver' | 'ete'

export interface AcademicSession {
  id: string
  term: AcademicTerm
  year: number
  /** Date locale `YYYY-MM-DD` du début de la session (lundi de la semaine 1). */
  startDate: string
  /** Nombre de semaines (typiquement 15). */
  weeks: number
  /** Session active affichée par défaut. */
  current?: boolean
  createdAt: number
  updatedAt: number
}

export type QuizQuestionType = 'mcq' | 'truefalse' | 'short'

export interface QuizQuestion {
  id: string
  type: QuizQuestionType
  question: string
  /** Choix pour les QCM. */
  options?: string[]
  /** Réponse : index (mcq), 'vrai'/'faux' (truefalse), texte (short). */
  answer: string
}

export interface Quiz {
  id: string
  title: string
  subjectId?: string
  questions: QuizQuestion[]
  /** Source ('local' | provider). */
  source: string
  createdAt: number
}

// ─── Examens blancs & statistiques d'apprentissage (Study C3/C4) ──────────────

/**
 * Question d'examen blanc. Reprend la même grammaire de réponse que
 * `QuizQuestion` (voir generateQuizLocal / grading) :
 *  - mcq        : `answer` = index (chaîne) de la bonne option dans `options` ;
 *  - truefalse  : `answer` = 'vrai' | 'faux' ;
 *  - short      : `answer` = texte attendu (comparaison normalisée).
 * `points` pondère la question dans le score (défaut 1).
 */
export interface ExamQuestion {
  id: string
  type: QuizQuestionType
  question: string
  options?: string[]
  answer: string
  points: number
  /** Provenance ('flashcard' | 'quiz') pour le rapport et la traçabilité. */
  source: 'flashcard' | 'quiz'
}

/**
 * Examen blanc généré pour une matière à partir de ses flashcards / quiz.
 * Persiste le sujet (questions figées) ; les passages sont des `ExamAttempt`.
 */
export interface Exam {
  id: string
  title: string
  /** Matière liée (id d'un notebook 'subject'), optionnel. */
  subjectId?: string
  questions: ExamQuestion[]
  /** Total des points (somme des `points`). */
  totalPoints: number
  createdAt: number
}

/** Réponse d'un candidat à une question, avec correction. */
export interface ExamAnswer {
  questionId: string
  /** Réponse donnée (même grammaire que `ExamQuestion.answer`). */
  given: string
  correct: boolean
  /** Points obtenus (0 ou `points` de la question). */
  earned: number
}

/**
 * Passage d'un examen : réponses, correction, score. Historisé par matière
 * (table `examAttempts`, index `subjectId` + `createdAt`).
 */
export interface ExamAttempt {
  id: string
  examId: string
  subjectId?: string
  answers: ExamAnswer[]
  /** Points obtenus. */
  score: number
  /** Total des points possibles. */
  total: number
  /** Pourcentage 0-100 arrondi. */
  percent: number
  /** Durée du passage en secondes (optionnel). */
  durationSec?: number
  createdAt: number
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Checklist {
  id: string
  title: string
  projectId?: string
  items: ChecklistItem[]
  source: string
  createdAt: number
  updatedAt: number
}

export interface Folder {
  id: string
  parentId: string | null
  name: string
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

/**
 * Flashcard de révision espacée (module Study C1/C2).
 *
 * Distincte de `StudyCard` (héritage notebook, conservée intacte) : modèle
 * autonome avec état SRS SM-2 embarqué (voir src/lib/study/srs.ts). Le lien
 * matière (`subjectId`, notebook de type 'subject') est optionnel.
 */
export interface Flashcard {
  id: string
  /** Recto (question / terme). */
  front: string
  /** Verso (réponse / définition). */
  back: string
  /** Matière liée (id d'un notebook 'subject'), optionnel. */
  subjectId?: string
  /** Étiquettes libres (recherche, regroupement). */
  tags?: string[]
  // ── État SRS (miroir de SrsState ; voir src/lib/study/srs.ts) ──
  /** Facteur de facilité SM-2 (≥ 1.3). */
  easeFactor: number
  /** Intervalle courant en jours. */
  interval: number
  /** Révisions consécutives réussies. */
  repetitions: number
  /** Prochaine échéance (timestamp ms). */
  dueDate: number
  /** Dernière révision (timestamp ms), absent si jamais révisée. */
  lastReviewedAt?: number
  createdAt: number
  updatedAt: number
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
