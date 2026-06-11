import type { PaperTemplate } from '../types'

export interface TemplatePack {
  id: string
  name: string
  description: string
  template: PaperTemplate
  premium?: boolean
  category: 'study' | 'work' | 'creative' | 'planner'
}

export const TEMPLATE_PACKS: TemplatePack[] = [
  { id: 'lined', name: 'Cahier ligné', description: 'Classique pour cours', template: 'lined', category: 'study' },
  { id: 'grid', name: 'Quadrillé', description: 'Maths et schémas', template: 'grid', category: 'study' },
  { id: 'dots', name: 'Points', description: 'Bullet journal', template: 'dots', category: 'creative' },
  { id: 'cornell', name: 'Cornell', description: 'Prise de notes structurée', template: 'cornell', category: 'study' },
  { id: 'planner', name: 'Planning', description: 'Semaine type', template: 'planner', category: 'planner' },
  { id: 'blank', name: 'Blanc', description: 'Page libre', template: 'blank', category: 'creative' },
  {
    id: 'music',
    name: 'Partition',
    description: 'Portées musicales',
    template: 'music',
    category: 'creative',
    premium: true,
  },
  {
    id: 'meeting',
    name: 'Réunion',
    description: 'Notes + actions',
    template: 'cornell',
    category: 'work',
    premium: true,
  },
]
