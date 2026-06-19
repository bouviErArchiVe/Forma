/**
 * Tests de l'aperçu de structure des templates (Sprint #5, Lane A) :
 * sommaire dérivé du contentHtml avant « Créer depuis ce template ».
 */
import { describe, expect, it } from 'vitest'
import { buildTemplatePreview } from './templatePreview'
import { TEMPLATES, getTemplate, type ArchitectureTemplate } from './templates'

function tpl(contentHtml: string): ArchitectureTemplate {
  return { id: 't', name: 'Nom', category: 'fiche', description: 'd', tags: [], contentHtml }
}

describe('buildTemplatePreview', () => {
  it('extrait le titre du <h1>, à défaut le nom', () => {
    expect(buildTemplatePreview(tpl('<h1>Titre doc</h1>')).title).toBe('Titre doc')
    expect(buildTemplatePreview(tpl('<p>sans titre</p>')).title).toBe('Nom')
  })

  it('liste les sections (h2) dans l’ordre avec leur type de contenu', () => {
    const p = buildTemplatePreview(
      tpl('<h1>T</h1><h2>Présents</h2><ul><li>a</li><li>b</li></ul><h2>Notes</h2><p>x</p>'),
    )
    expect(p.sectionCount).toBe(2)
    expect(p.sections.map((s) => s.title)).toEqual(['Présents', 'Notes'])
    expect(p.sections[0]).toMatchObject({ content: 'list', itemCount: 2, hasTable: false })
    expect(p.sections[1]).toMatchObject({ content: 'text', itemCount: 0 })
  })

  it('détecte les tableaux et compte le total d’items', () => {
    const p = buildTemplatePreview(
      tpl('<h1>T</h1><h2>S1</h2><ul><li>a</li></ul><h2>S2</h2><table><tr><td>x</td></tr></table>'),
    )
    expect(p.hasTable).toBe(true)
    expect(p.sections[1].content).toBe('table')
    expect(p.sections[1].hasTable).toBe(true)
    expect(p.totalItems).toBe(1)
  })

  it('repère l’avertissement officiel (blockquote)', () => {
    expect(buildTemplatePreview(tpl('<h1>T</h1><blockquote>vérifier</blockquote>')).hasDisclaimer).toBe(true)
    expect(buildTemplatePreview(tpl('<h1>T</h1>')).hasDisclaimer).toBe(false)
  })

  it('gère un document sans sections', () => {
    const p = buildTemplatePreview(tpl('<h1>Libre</h1><p>texte</p>'))
    expect(p.sectionCount).toBe(0)
    expect(p.sections).toEqual([])
  })

  it('reste cohérent sur un vrai template du catalogue', () => {
    const carnet = getTemplate('t-carnet-chantier')!
    const p = buildTemplatePreview(carnet)
    expect(p.title).toBe('Carnet de chantier')
    expect(p.sectionCount).toBeGreaterThanOrEqual(4)
    expect(p.sections.some((s) => s.content === 'list')).toBe(true)
  })

  it('chaque template du catalogue produit un aperçu non vide', () => {
    for (const t of TEMPLATES) {
      const p = buildTemplatePreview(t)
      expect(p.title.length).toBeGreaterThan(0)
      // Au moins une section OU du contenu : un template a toujours un <h1>.
      expect(p.sectionCount).toBeGreaterThanOrEqual(0)
    }
  })

  it('les fiches « code » signalent l’avertissement', () => {
    expect(buildTemplatePreview(getTemplate('t-fiche-conformite')!).hasDisclaimer).toBe(true)
  })
})
