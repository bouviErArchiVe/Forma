import { createId } from '../id'
import type {
  FormaDeck,
  FormaPresentTemplateId,
  FormaSlide,
  FormaSlideElement,
  FormaSlideElementType,
} from '../../types'

export function createElement(
  type: FormaSlideElementType,
  partial: Partial<FormaSlideElement> = {},
): FormaSlideElement {
  const now = Date.now()
  const defaults: Record<FormaSlideElementType, Partial<FormaSlideElement>> = {
    text: {
      x: 120,
      y: 120,
      w: 800,
      h: 120,
      content: 'Nouveau texte',
      fontSize: 48,
      color: '#1a1a1a',
      align: 'left',
      fontFamily: 'Inter, sans-serif',
      bold: false,
    },
    image: { x: 200, y: 200, w: 600, h: 400, dataUrl: null, src: null },
  }
  return {
    id: createId(),
    type,
    rotation: 0,
    opacity: 1,
    zIndex: partial.zIndex ?? 1,
    animation: 'none',
    ...defaults[type],
    ...partial,
    createdAt: now,
  } as FormaSlideElement
}

export function createSlide(partial: Partial<FormaSlide> = {}): FormaSlide {
  const now = Date.now()
  return {
    id: createId(),
    name: partial.name || 'Slide',
    bgColor: partial.bgColor || '#ffffff',
    bgImage: partial.bgImage ?? null,
    transition: partial.transition || 'fade',
    notes: partial.notes || '',
    elements: partial.elements || [],
    createdAt: now,
  }
}

export function createDeck(title = 'Présentation', partial: Partial<FormaDeck> = {}): FormaDeck {
  const now = Date.now()
  return {
    id: createId(),
    title,
    template: (partial.template as FormaPresentTemplateId) || 'blank',
    slides: partial.slides || [createSlide({ name: 'Slide 1' })],
    settings: {
      showGrid: true,
      showGuides: true,
      snapToGrid: true,
      gridSize: 20,
      ...partial.settings,
    },
    createdAt: now,
    updatedAt: now,
  }
}

export function cloneDeck(deck: FormaDeck, title?: string): FormaDeck {
  const now = Date.now()
  return {
    ...structuredClone(deck),
    id: createId(),
    title: title ?? `${deck.title} (copie)`,
    createdAt: now,
    updatedAt: now,
    slides: deck.slides.map((s) => cloneSlide(s)),
  }
}

export function cloneSlide(slide: FormaSlide, patch: Partial<FormaSlide> = {}): FormaSlide {
  return {
    ...structuredClone(slide),
    id: createId(),
    elements: (slide.elements || []).map((el) => ({ ...el, id: createId() })),
    ...patch,
  }
}

export function reorderSlides(slides: FormaSlide[], from: number, to: number): FormaSlide[] {
  if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) {
    return slides
  }
  const next = [...slides]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

export function getMaxZIndex(slide: FormaSlide): number {
  return (slide.elements || []).reduce((m, el) => Math.max(m, el.zIndex || 0), 0)
}
