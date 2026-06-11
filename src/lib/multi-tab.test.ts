import { afterEach, describe, expect, it } from 'vitest'
import { getHasOtherTabs, initMultiTabDetection, subscribeMultiTab } from './multi-tab'

describe('multi-tab', () => {
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
    cleanup = undefined
  })

  it('starts with no other tabs', () => {
    cleanup = initMultiTabDetection()
    expect(getHasOtherTabs()).toBe(false)
  })

  it('detects another tab via storage event', () => {
    cleanup = initMultiTabDetection()
    const states: boolean[] = []
    subscribeMultiTab((v) => states.push(v))

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'forma-tab-heartbeat',
        newValue: JSON.stringify({ tabId: 'other-tab-id', at: Date.now() }),
      }),
    )

    expect(getHasOtherTabs()).toBe(true)
    expect(states.at(-1)).toBe(true)
  })
})
