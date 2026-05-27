/** FormaPresent — modèle deck / slides / éléments */

import { SLIDE_SIZE } from './constants'

function uid(p = 'fpr') {
  return `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createElement(type, partial = {}) {
  const now = Date.now()
  const defaults = {
    text: { x: 120, y: 120, w: 800, h: 120, content: 'Nouveau texte', fontSize: 48, color: '#1a1a1a', align: 'left', fontFamily: 'Inter, sans-serif', bold: false },
    image: { x: 200, y: 200, w: 600, h: 400, src: null, dataUrl: null },
    video: { x: 200, y: 200, w: 800, h: 450, src: null, dataUrl: null, autoplay: false },
    embed: { x: 100, y: 100, w: 800, h: 500, embedType: null, embedRef: null, dataUrl: null, label: '' },
  }
  return {
    id: uid('el'),
    type,
    rotation: 0,
    opacity: 1,
    zIndex: partial.zIndex ?? 1,
    animation: 'none',
    ...defaults[type],
    ...partial,
    createdAt: now,
  }
}

export function createSlide(partial = {}) {
  const now = Date.now()
  return {
    id: uid('sl'),
    name: partial.name || 'Slide',
    bgColor: partial.bgColor || '#ffffff',
    bgImage: partial.bgImage || null,
    transition: partial.transition || 'fade',
    notes: partial.notes || '',
    elements: partial.elements || [],
    createdAt: now,
  }
}

export function createDeck(title = 'Présentation', partial = {}) {
  const now = Date.now()
  return {
    id: uid('deck'),
    title,
    template: partial.template || 'architecture',
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

export function cloneSlide(slide, patch = {}) {
  return {
    ...JSON.parse(JSON.stringify(slide)),
    id: uid('sl'),
    elements: (slide.elements || []).map((el) => ({ ...el, id: uid('el') })),
    ...patch,
  }
}

export function reorderSlides(slides, from, to) {
  if (from === to || from < 0 || to < 0 || from >= slides.length || to >= slides.length) return slides
  const next = [...slides]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function getMaxZIndex(slide) {
  return (slide.elements || []).reduce((m, el) => Math.max(m, el.zIndex || 0), 0)
}

export function updateDeck(deck, patch) {
  return { ...deck, ...patch, updatedAt: Date.now() }
}
