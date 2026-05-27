/** FormaLibrary — classement automatique par nom/contenu */

import { LIBRARY_CATEGORIES } from './constants'

const RULES = [
  { re: /cnb|national building code|code du bâtiment/i, category: 'norm', tags: ['CNB', 'norme'] },
  { re: /ccq|construction/i, category: 'norm', tags: ['CCQ'] },
  { re: /norme|standard|astm|iso|nbc/i, category: 'norm', tags: ['norme'] },
  { re: /texture|matériau|material|bois|béton|gypse|acier/i, category: 'material', tags: ['matériau'] },
  { re: /détail|detail|constructif|joint|fixation/i, category: 'detail', tags: ['détail', 'constructif'] },
  { re: /bloc|block|symbole|symbol/i, category: 'block', tags: ['bloc'] },
  { re: /palette|couleur|color|pantone|ral/i, category: 'palette', tags: ['palette'] },
  { re: /escalier|stair|porte|door|fenêtre|window|mobilier|chair|table/i, category: 'object', tags: ['objet'] },
  { re: /cours|note|leçon|lecture/i, category: 'note', tags: ['cours'] },
  { re: /référence|reference|archi|design|portfolio/i, category: 'reference', tags: ['référence'] },
  { re: /\.pdf$/i, category: 'pdf', tags: ['PDF'] },
  { re: /\.svg$/i, category: 'svg', tags: ['SVG'] },
  { re: /\.dwg|\.dxf$/i, category: 'dwg', tags: ['DWG', 'CAO'] },
  { re: /\.(png|jpg|jpeg|webp)$/i, category: 'image', tags: ['image'] },
]

export function autoClassify({ name = '', textContent = '', mimeType = '' } = {}) {
  const combined = `${name} ${textContent} ${mimeType}`
  let category = 'image'
  const tags = new Set()

  for (const rule of RULES) {
    if (rule.re.test(combined)) {
      category = rule.category
      rule.tags.forEach((t) => tags.add(t))
      break
    }
  }

  if (/texture/i.test(combined)) { category = 'texture'; tags.add('texture') }
  if (mimeType?.includes('pdf')) { category = 'pdf'; tags.add('PDF') }
  if (mimeType?.includes('svg')) { category = 'svg'; tags.add('SVG') }

  const baseName = name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
  if (baseName.length > 2) tags.add(baseName.split(' ')[0].toLowerCase())

  return {
    category: LIBRARY_CATEGORIES[category] ? category : 'image',
    tags: [...tags].slice(0, 8),
  }
}
