import { useCallback, useState } from 'react'
import {
  createSlide, cloneSlide, reorderSlides, getMaxZIndex, createElement,
} from '@/lib/formapresent/model'
import { snapElement, alignElements } from '@/lib/formapresent/layout'

export function usePresentEditor(deck, setDeck) {
  const [selectedSlideId, setSelectedSlideId] = useState(null)
  const [selectedElementId, setSelectedElementId] = useState(null)

  const currentSlide = deck?.slides?.find((s) => s.id === selectedSlideId)
    || deck?.slides?.[0]
    || null

  const updateDeck = useCallback((patch) => {
    setDeck((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }))
  }, [setDeck])

  const updateSlide = useCallback((slideId, patch) => {
    setDeck((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
      updatedAt: Date.now(),
    }))
  }, [setDeck])

  const addSlide = useCallback((partial) => {
    const slide = createSlide(partial)
    setDeck((prev) => ({
      ...prev,
      slides: [...(prev.slides || []), slide],
      updatedAt: Date.now(),
    }))
    setSelectedSlideId(slide.id)
    return slide
  }, [setDeck])

  const duplicateSlide = useCallback((slideId) => {
    const slide = deck.slides.find((s) => s.id === slideId)
    if (!slide) return
    const copy = cloneSlide(slide)
    setDeck((prev) => ({
      ...prev,
      slides: [...prev.slides, copy],
      updatedAt: Date.now(),
    }))
    setSelectedSlideId(copy.id)
  }, [deck, setDeck])

  const deleteSlide = useCallback((slideId) => {
    if ((deck.slides?.length || 0) <= 1) return
    setDeck((prev) => ({
      ...prev,
      slides: prev.slides.filter((s) => s.id !== slideId),
      updatedAt: Date.now(),
    }))
    if (selectedSlideId === slideId) setSelectedSlideId(null)
    setSelectedElementId(null)
  }, [deck, selectedSlideId, setDeck])

  const reorder = useCallback((from, to) => {
    setDeck((prev) => ({
      ...prev,
      slides: reorderSlides(prev.slides, from, to),
      updatedAt: Date.now(),
    }))
  }, [setDeck])

  const addElement = useCallback((slideId, element) => {
    setDeck((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => {
        if (s.id !== slideId) return s
        const z = getMaxZIndex(s) + 1
        return { ...s, elements: [...(s.elements || []), { ...element, zIndex: z }] }
      }),
      updatedAt: Date.now(),
    }))
    setSelectedElementId(element.id)
  }, [setDeck])

  const updateElement = useCallback((slideId, elementId, patch) => {
    setDeck((prev) => ({
      ...prev,
      slides: prev.slides.map((s) => {
        if (s.id !== slideId) return s
        return {
          ...s,
          elements: (s.elements || []).map((el) => {
            if (el.id !== elementId) return el
            let next = { ...el, ...patch }
            if (prev.settings?.snapToGrid) {
              next = snapElement(next, prev.settings.gridSize, true)
            }
            return next
          }),
        }
      }),
      updatedAt: Date.now(),
    }))
  }, [setDeck])

  const deleteElement = useCallback((slideId, elementId) => {
    setDeck((prev) => ({
      ...prev,
      slides: prev.slides.map((s) =>
        s.id === slideId ? { ...s, elements: (s.elements || []).filter((el) => el.id !== elementId) } : s
      ),
      updatedAt: Date.now(),
    }))
    if (selectedElementId === elementId) setSelectedElementId(null)
  }, [selectedElementId, setDeck])

  const alignSelected = useCallback((alignment) => {
    if (!currentSlide || !selectedElementId) return
    const aligned = alignElements(currentSlide.elements, [selectedElementId], alignment)
    updateSlide(currentSlide.id, { elements: aligned })
  }, [currentSlide, selectedElementId, updateSlide])

  const addTextElement = useCallback((slideId) => {
    const el = createElement('text', { content: 'Double-cliquez pour éditer' })
    addElement(slideId, el)
  }, [addElement])

  const updateSettings = useCallback((patch) => {
    setDeck((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
      updatedAt: Date.now(),
    }))
  }, [setDeck])

  return {
    selectedSlideId: selectedSlideId || currentSlide?.id,
    setSelectedSlideId,
    selectedElementId,
    setSelectedElementId,
    currentSlide,
    updateDeck,
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
