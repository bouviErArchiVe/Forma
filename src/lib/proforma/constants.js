/** PROFORMA — constantes viewport et UI */

export const PF_ZOOM_MIN = 0.08
export const PF_ZOOM_MAX = 24
export const PF_ZOOM_DEFAULT = 0.75

export const PF_HISTORY_MAX = 80
export const PF_AUTOSAVE_MS = 600

export const PF_DARK = {
  bg: '#0f1117',
  surface: '#171b24',
  panel: '#1c2130',
  border: '#2a3144',
  ink: '#e8ecf4',
  muted: '#8b95a8',
  accent: '#5b9fd4',
  accent2: '#7ec8e3',
  danger: '#e94560',
  grid: '#2e3648',
  gridMajor: '#3d4660',
  guide: '#5b9fd466',
  eraser: '#ff3b3b',
}

export const PF_PRESETS = [
  { id: 'sketch', label: 'Esquisse libre', formatId: 'a3', bgColor: '#faf8f5', grid: 'dotted' },
  { id: 'technical', label: 'Dessin technique', formatId: 'a2', bgColor: '#ffffff', grid: 'arch' },
  { id: 'detail', label: 'Détail constructif', formatId: 'a3', bgColor: '#ffffff', grid: 'grid10' },
  { id: 'annotation', label: 'Annotations', formatId: 'a4', bgColor: '#f5f7fa', grid: 'grid5' },
  { id: 'pixel', label: 'Pixel précis', formatId: 'square', bgColor: '#ffffff', grid: 'grid5', tool: 'pencil_pixel' },
  { id: 'infinite', label: 'Canvas infini', formatId: 'infinite', bgColor: '#1a1d26', grid: 'dotted', dark: true },
]
