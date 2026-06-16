/**
 * Tests annotations (Pack B2) : fonctions pures, construction des 3 types,
 * géométrie SVG, échappement du texte, entrées invalides, conversion en bloc.
 */
import { describe, expect, it } from 'vitest'
import { blockToSvg } from '../blocks/types'
import {
  annotationToBlock,
  approxTextWidth,
  buildAnnotationSvg,
  createAnnotation,
  textLines,
  ANNOTATION_TYPE_LABELS,
} from './annotations'

describe('fonctions pures', () => {
  it('textLines découpe \\n et \\r\\n', () => {
    expect(textLines('a\nb')).toEqual(['a', 'b'])
    expect(textLines('a\r\nb')).toEqual(['a', 'b'])
    expect(textLines('')).toEqual([''])
    expect(textLines('seule')).toEqual(['seule'])
  })

  it('approxTextWidth croît avec la longueur et la police', () => {
    expect(approxTextWidth('AAAA', 10)).toBeGreaterThan(approxTextWidth('AA', 10))
    expect(approxTextWidth('AAAA', 20)).toBeGreaterThan(approxTextWidth('AAAA', 10))
    // prend la ligne la plus longue
    expect(approxTextWidth('a\nlongueligne', 10)).toBe(approxTextWidth('longueligne', 10))
  })
})

describe('createAnnotation', () => {
  it('valeurs par défaut sûres et id déterministe', () => {
    const a = createAnnotation({ type: 'label', text: 'Hello', now: 7 })
    expect(a.id).toBe('ann-7')
    expect(a.style.fontSize).toBe(13)
    expect(a.leaderDirection).toBe('left')
    expect(a.createdAt).toBe(7)
  })

  it('police invalide ou ≤ 0 → défaut 13', () => {
    expect(createAnnotation({ type: 'label', text: 'x', style: { fontSize: -5 } }).style.fontSize).toBe(13)
    expect(createAnnotation({ type: 'label', text: 'x', style: { fontSize: NaN } }).style.fontSize).toBe(13)
  })

  it('leaderLength invalide → défaut 48', () => {
    expect(createAnnotation({ type: 'leader', text: 'x', leaderLength: -10 }).leaderLength).toBe(48)
    expect(createAnnotation({ type: 'leader', text: 'x', leaderLength: 0 }).leaderLength).toBe(48)
  })

  it('texte non-string → chaîne vide', () => {
    // @ts-expect-error test de robustesse à l'exécution
    expect(createAnnotation({ type: 'label', text: undefined }).text).toBe('')
  })
})

describe('buildAnnotationSvg', () => {
  it('étiquette : texte sans cadre, boîte positive', () => {
    const svg = buildAnnotationSvg(createAnnotation({ type: 'label', text: 'Mur RDC' }))
    expect(svg.width).toBeGreaterThan(0)
    expect(svg.height).toBeGreaterThan(0)
    expect(svg.svgBody).toContain('<text')
    expect(svg.svgBody).toContain('Mur RDC')
    expect(svg.svgBody).not.toContain('<rect')
  })

  it('callout : texte encadré (rect arrondi)', () => {
    const svg = buildAnnotationSvg(createAnnotation({ type: 'callout', text: 'Détail A' }))
    expect(svg.svgBody).toContain('<rect')
    expect(svg.svgBody).toContain('rx="6"')
    expect(svg.svgBody).toContain('Détail A')
  })

  it('leader : cadre + ligne de rappel + flèche pleine', () => {
    const svg = buildAnnotationSvg(createAnnotation({ type: 'leader', text: 'Repère', leaderLength: 60 }))
    expect(svg.svgBody).toContain('<rect')
    expect(svg.svgBody).toContain('<path')
    // tête de flèche = polygone fermé rempli
    expect(svg.svgBody).toContain('Z" fill="currentColor"')
  })

  it('leader : la direction modifie les dimensions de la boîte', () => {
    const left = buildAnnotationSvg(createAnnotation({ type: 'leader', text: 'X', leaderLength: 80, leaderDirection: 'left' }))
    const up = buildAnnotationSvg(createAnnotation({ type: 'leader', text: 'X', leaderLength: 80, leaderDirection: 'up' }))
    // horizontale : largeur étendue ; verticale : hauteur étendue
    expect(left.width).toBeGreaterThan(up.width)
    expect(up.height).toBeGreaterThan(left.height)
  })

  it('texte multi-lignes : un <tspan> par ligne', () => {
    const svg = buildAnnotationSvg(createAnnotation({ type: 'callout', text: 'Ligne 1\nLigne 2' }))
    const count = (svg.svgBody.match(/<tspan/g) || []).length
    expect(count).toBe(2)
  })

  it('échappement : caractères XML neutralisés (pas d’injection)', () => {
    const svg = buildAnnotationSvg(createAnnotation({ type: 'label', text: '<b>&"\'</b>' }))
    expect(svg.svgBody).not.toContain('<b>')
    expect(svg.svgBody).toContain('&lt;b&gt;')
    expect(svg.svgBody).toContain('&amp;')
    expect(svg.svgBody).toContain('&quot;')
    expect(svg.svgBody).toContain('&#39;')
  })
})

describe('annotationToBlock', () => {
  it('produit un DrawingBlock annotations rasterisable', () => {
    const a = createAnnotation({ type: 'leader', text: 'Poutre', leaderLength: 50 })
    const block = annotationToBlock(a)
    expect(block.id).toBe(`annotation-${a.id}`)
    expect(block.category).toBe('annotations')
    expect(block.unitSystem).toBe('metric')
    expect(block.defaultWidth).toBeGreaterThan(0)
    expect(block.defaultHeight).toBeGreaterThan(0)
    expect(block.name).toContain(ANNOTATION_TYPE_LABELS.leader)
    expect(blockToSvg(block).startsWith('<svg')).toBe(true)
  })

  it('nom : libellé tronqué, texte vide → « annotation »', () => {
    expect(annotationToBlock(createAnnotation({ type: 'label', text: '' })).name).toContain('annotation')
    const long = 'x'.repeat(40)
    expect(annotationToBlock(createAnnotation({ type: 'label', text: long })).name).toContain('…')
  })
})
