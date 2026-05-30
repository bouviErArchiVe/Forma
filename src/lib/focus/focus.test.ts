import { beforeEach, describe, expect, it } from 'vitest'
import {
  clampMinutes,
  formatTime,
  modeMinutes,
  nextMode,
  remainingFraction,
  ringOffset,
} from './timer'
import { useFocusStore } from '../../stores/focusStore'

describe('focus timer helpers', () => {
  it('formats seconds as mm:ss', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(25 * 60)).toBe('25:00')
    expect(formatTime(-10)).toBe('00:00')
  })

  it('clamps minutes into the valid range', () => {
    expect(clampMinutes(0)).toBe(1)
    expect(clampMinutes(200)).toBe(120)
    expect(clampMinutes(25)).toBe(25)
    expect(clampMinutes(Number.NaN)).toBe(1)
  })

  it('alternates work and break modes', () => {
    expect(nextMode('work')).toBe('break')
    expect(nextMode('break')).toBe('work')
  })

  it('returns the minutes for the active mode', () => {
    expect(modeMinutes('work', 25, 5)).toBe(25)
    expect(modeMinutes('break', 25, 5)).toBe(5)
  })

  it('computes the remaining fraction and ring offset', () => {
    expect(remainingFraction(30, 60)).toBe(0.5)
    expect(remainingFraction(0, 0)).toBe(0)
    expect(ringOffset(60, 60, 100)).toBe(0)
    expect(ringOffset(0, 60, 100)).toBe(100)
  })
})

describe('focus store', () => {
  beforeEach(() => {
    localStorage.clear()
    useFocusStore.setState({
      open: false,
      running: false,
      mode: 'work',
      secondsLeft: 25 * 60,
      workMin: 25,
      breakMin: 5,
      alarmType: 'default',
      customAlarm: null,
      dingCount: 0,
    })
  })

  it('counts down by one second per tick while running', () => {
    useFocusStore.setState({ running: true, secondsLeft: 10 })
    useFocusStore.getState().tick()
    expect(useFocusStore.getState().secondsLeft).toBe(9)
  })

  it('ignores ticks when not running', () => {
    useFocusStore.setState({ running: false, secondsLeft: 10 })
    useFocusStore.getState().tick()
    expect(useFocusStore.getState().secondsLeft).toBe(10)
  })

  it('flips mode, rings and pauses at the end of a cycle', () => {
    useFocusStore.setState({ running: true, mode: 'work', secondsLeft: 1, breakMin: 5 })
    useFocusStore.getState().tick()
    const s = useFocusStore.getState()
    expect(s.mode).toBe('break')
    expect(s.running).toBe(false)
    expect(s.secondsLeft).toBe(5 * 60)
    expect(s.dingCount).toBe(1)
  })

  it('syncs seconds when changing work minutes while idle on work', () => {
    useFocusStore.getState().setWorkMin(50)
    expect(useFocusStore.getState().secondsLeft).toBe(50 * 60)
  })

  it('does not sync seconds when running', () => {
    useFocusStore.setState({ running: true, secondsLeft: 100, mode: 'work' })
    useFocusStore.getState().setWorkMin(50)
    expect(useFocusStore.getState().secondsLeft).toBe(100)
  })

  it('refuses custom alarm type without a recorded sound', () => {
    useFocusStore.getState().setAlarmType('custom')
    expect(useFocusStore.getState().alarmType).toBe('default')
  })

  it('stores and clears a custom alarm', () => {
    useFocusStore.getState().setCustomAlarm('data:audio/webm;base64,AAA')
    expect(useFocusStore.getState().alarmType).toBe('custom')
    expect(localStorage.getItem('forma_alarm')).toContain('data:audio')
    useFocusStore.getState().clearCustomAlarm()
    expect(useFocusStore.getState().customAlarm).toBeNull()
    expect(useFocusStore.getState().alarmType).toBe('default')
  })
})
