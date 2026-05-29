import { describe, expect, it } from 'vitest'
import { applyDarkAppearance } from './appearance'
import { mix, rgbaFromHex } from './color-utils'
import { DEFAULT_VISUAL_THEME_ID, FORMA_THEMES, getThemeById } from './themes'

describe('forma themes', () => {
  it('exports 20 visual themes', () => {
    expect(FORMA_THEMES.length).toBe(20)
  })

  it('getThemeById falls back to horizon', () => {
    expect(getThemeById('unknown').id).toBe(DEFAULT_VISUAL_THEME_ID)
  })

  it('applyDarkAppearance remaps neutrals', () => {
    const dark = applyDarkAppearance(getThemeById('horizon'))
    expect(dark.ink).toBe('#f1f4ff')
    expect(dark.bg).not.toBe(getThemeById('horizon').bg)
  })

  it('color utils mix and rgba', () => {
    expect(mix('#000000', '#ffffff', 0.5).toLowerCase()).toBe('#808080')
    expect(rgbaFromHex('#ff0000', 0.5)).toBe('rgba(255,0,0,0.5)')
  })
})
