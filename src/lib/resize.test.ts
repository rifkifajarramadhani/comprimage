import { describe, expect, it } from 'vitest'
import { computeDimensions, resizeSteps } from './resize.ts'
import type { ResizeOptions } from '#/types/image.ts'

const source = { width: 4000, height: 3000 } // 4:3

function opts(partial: Partial<ResizeOptions>): ResizeOptions {
  return {
    mode: 'width',
    value: 1000,
    keepAspectRatio: true,
    preventUpscaling: false,
    ...partial,
  }
}

describe('computeDimensions', () => {
  it('width mode keeps aspect ratio', () => {
    expect(
      computeDimensions(source, opts({ mode: 'width', value: 2000 })),
    ).toEqual({ width: 2000, height: 1500 })
  })

  it('height mode keeps aspect ratio', () => {
    expect(
      computeDimensions(source, opts({ mode: 'height', value: 1500 })),
    ).toEqual({ width: 2000, height: 1500 })
  })

  it('width mode without aspect ratio uses the secondary value', () => {
    expect(
      computeDimensions(
        source,
        opts({
          mode: 'width',
          value: 800,
          keepAspectRatio: false,
          secondaryValue: 800,
        }),
      ),
    ).toEqual({ width: 800, height: 800 })
  })

  it('percentage scales both dimensions', () => {
    expect(
      computeDimensions(source, opts({ mode: 'percentage', value: 25 })),
    ).toEqual({ width: 1000, height: 750 })
  })

  it('longest-edge fits the wider dimension', () => {
    expect(
      computeDimensions(source, opts({ mode: 'longest-edge', value: 1000 })),
    ).toEqual({ width: 1000, height: 750 })
  })

  it('longest-edge fits the taller dimension on a portrait image', () => {
    expect(
      computeDimensions(
        { width: 3000, height: 4000 },
        opts({ mode: 'longest-edge', value: 1000 }),
      ),
    ).toEqual({ width: 750, height: 1000 })
  })

  it('prevents upscaling by clamping to the source size', () => {
    expect(
      computeDimensions(
        source,
        opts({ mode: 'width', value: 8000, preventUpscaling: true }),
      ),
    ).toEqual({ width: 4000, height: 3000 })
  })

  it('allows upscaling when preventUpscaling is off', () => {
    expect(
      computeDimensions(
        source,
        opts({ mode: 'width', value: 8000, preventUpscaling: false }),
      ),
    ).toEqual({ width: 8000, height: 6000 })
  })

  it('percentage over 100 is blocked by preventUpscaling', () => {
    expect(
      computeDimensions(
        source,
        opts({ mode: 'percentage', value: 200, preventUpscaling: true }),
      ),
    ).toEqual({ width: 4000, height: 3000 })
  })

  it('never returns a dimension below 1px', () => {
    const result = computeDimensions(
      source,
      opts({ mode: 'percentage', value: 0.001 }),
    )
    expect(result.width).toBeGreaterThanOrEqual(1)
    expect(result.height).toBeGreaterThanOrEqual(1)
  })
})

describe('resizeSteps', () => {
  it('returns a single direct draw for upscales', () => {
    expect(
      resizeSteps({ width: 100, height: 100 }, { width: 400, height: 400 }),
    ).toEqual([{ width: 400, height: 400 }])
  })

  it('returns a single direct draw for downscales within 2x', () => {
    expect(
      resizeSteps({ width: 1000, height: 800 }, { width: 600, height: 480 }),
    ).toEqual([{ width: 600, height: 480 }])
  })

  it('halves progressively for large downscales, ending exactly at target', () => {
    const steps = resizeSteps(
      { width: 4000, height: 3000 },
      { width: 400, height: 300 },
    )
    expect(steps).toEqual([
      { width: 2000, height: 1500 },
      { width: 1000, height: 750 },
      { width: 500, height: 375 },
      { width: 400, height: 300 },
    ])
  })

  it('never steps below the target in either dimension', () => {
    const target = { width: 300, height: 300 }
    for (const s of resizeSteps({ width: 5000, height: 5000 }, target)) {
      expect(s.width).toBeGreaterThanOrEqual(target.width)
      expect(s.height).toBeGreaterThanOrEqual(target.height)
    }
  })

  it('does not duplicate the target when the last halving lands on it', () => {
    const steps = resizeSteps(
      { width: 1600, height: 1600 },
      { width: 400, height: 400 },
    )
    expect(steps).toEqual([
      { width: 800, height: 800 },
      { width: 400, height: 400 },
    ])
  })
})
