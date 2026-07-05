import { describe, expect, it } from 'vitest'
import { clampConcurrency } from './settings.ts'

describe('clampConcurrency', () => {
  it('keeps an in-range value', () => {
    expect(clampConcurrency(3, 8)).toBe(3)
  })

  it('clamps below 1 up to 1', () => {
    expect(clampConcurrency(0, 8)).toBe(1)
    expect(clampConcurrency(-4, 8)).toBe(1)
  })

  it('clamps above the max down to the max', () => {
    expect(clampConcurrency(20, 8)).toBe(8)
  })

  it('floors fractional values', () => {
    expect(clampConcurrency(3.9, 8)).toBe(3)
  })

  it('falls back to 1 for non-finite input', () => {
    expect(clampConcurrency(NaN, 8)).toBe(1)
    expect(clampConcurrency(Infinity, 8)).toBe(1)
  })

  it('treats a max below 1 as 1', () => {
    expect(clampConcurrency(5, 0)).toBe(1)
  })
})
