import { useCallback, useState } from 'react'
import { alignElements, snapElement } from '../lib/formapresent/layout'
import {
  cloneSlide,
  createElement,
  createSlide,
  getMaxZIndex,
  reorderSlides,
} from '../lib/formapresent/model'
import type { FormaDeck, FormaSlide, FormaSlideElement } from '../types'

export function usePresentEditor(
  deck: FormaDeck | null,
  setDeck: React.Dispatch<React.SetStateAction<FormaDeck | null>>,
) {
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  const currentSlide =
    deck?.slides.find((s) => s.id === selectedSlideId) || deck?.slides[0] || null

  const updateSlide = useCallback(
    (slideId: string, patch: Partial<FormaSlide>) => {
      setDeck((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slides: prev.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
          updatedAt: Date.now(),
        }
      })
    },
    [setDeck],
  )

  const addSlide = useCallback(
    (partial?: Partial<FormaSlide>) => {
      const slide = createSlide(partial)
      setDeck((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slides: [...prev.slides, slide],
          updatedAt: Date.now(),
        }
      })
      setSelectedSlideId(slide.id)
      return slide
    },
    [setDeck],
  )

  const duplicateSlide = useCallback(
    (slideId: string) => {
      if (!deck) return
      const slide = deck.slides.find((s) => s.id === slideId)
      if (!slide) return
      const copy = cloneSlide(slide)
      setDeck((prev) => {
        if (!prev) return prev
        return { ...prev, slides: [...prev.slides, copy], updatedAt: Date.now() }
      })
      setSelectedSlideId(copy.id)
    },
    [deck, setDeck],
  )

  const deleteSlide = useCallback(
    (slideId: string) => {
      if (!deck || deck.slides.length <= 1) return
      setDeck((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slides: prev.slides.filter((s) => s.id !== slideId),
          updatedAt: Date.now(),
        }
      })
      if (selectedSlideId === slideId) setSelectedSlideId(null)
      setSelectedElementId(null)
    },
    [deck, selectedSlideId, setDeck],
  )

  const reorder = useCallback(
    (from: number, to: number) => {
      setDeck((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slides: reorderSlides(prev.slides, from, to),
          updatedAt: Date.now(),
        }
      })
    },
    [setDeck],
  )

  const addElement = useCallback(
    (slideId: string, element: FormaSlideElement) => {
      setDeck((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slides: prev.slides.map((s) => {
            if (s.id !== slideId) return s
            const z = getMaxZIndex(s) + 1
            return { ...s, elements: [...s.elements, { ...element, zIndex: z }] }
          }),
          updatedAt: Date.now(),
        }
      })
      setSelectedElementId(element.id)
    },
    [setDeck],
  )

  const updateElement = useCallback(
    (slideId: string, elementId: string, patch: Partial<FormaSlideElement>) => {
      setDeck((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slides: prev.slides.map((s) => {
            if (s.id !== slideId) return s
            return {
              ...s,
              elements: s.elements.map((el) => {
                if (el.id !== elementId) return el
                let next = { ...el, ...patch }
                if (prev.settings.snapToGrid) {
                  next = snapElement(next, prev.settings.gridSize, true)
                }
                return next
              }),
            }
          }),
          updatedAt: Date.now(),
        }
      })
    },
    [setDeck],
  )

  const deleteElement = useCallback(
    (slideId: string, elementId: string) => {
      setDeck((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          slides: prev.slides.map((s) =>
            s.id === slideId
              ? { ...s, elements: s.elements.filter((el) => el.id !== elementId) }
              : s,
          ),
          updatedAt: Date.now(),
        }
      })
      if (selectedElementId === elementId) setSelectedElementId(null)
    },
    [selectedElementId, setDeck],
  )

  const alignSelected = useCallback(
    (alignment: string) => {
      if (!currentSlide || !selectedElementId) return
      const aligned = alignElements(currentSlide.elements, [selectedElementId], alignment)
      updateSlide(currentSlide.id, { elements: aligned })
    },
    [currentSlide, selectedElementId, updateSlide],
  )

  const addTextElement = useCallback(
    (slideId: string) => {
      const el = createElement('text', { content: 'Double-cliquez pour éditer' })
      addElement(slideId, el)
    },
    [addElement],
  )

  const updateSettings = useCallback(
    (patch: Partial<FormaDeck['settings']>) => {
      setDeck((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          settings: { ...prev.settings, ...patch },
          updatedAt: Date.now(),
        }
      })
    },
    [setDeck],
  )

  return {
    selectedSlideId: selectedSlideId || currentSlide?.id || null,
    setSelectedSlideId,
    selectedElementId,
    setSelectedElementId,
    currentSlide,
    updateSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
    reorder,
    addElement,
    updateElement,
    deleteElement,
    alignSelected,
    addTextElement,
    updateSettings,
  }
}
