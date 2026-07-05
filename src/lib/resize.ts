import type { ResizeOptions } from '#/types/image.ts'

export interface Dimensions {
  width: number
  height: number
}

/**
 * Pure dimension math — no canvas, fully unit-testable.
 *
 * Computes the target output size for a source image given the resize options.
 * Aspect ratio, percentage, longest-edge, and prevent-upscaling are all handled
 * here so the draw step stays trivial.
 */
export function computeDimensions(
  source: Dimensions,
  opts: ResizeOptions,
): Dimensions {
  const { width: sw, height: sh } = source
  const aspect = sw / sh

  let width: number
  let height: number

  switch (opts.mode) {
    case 'percentage': {
      const scale = opts.value / 100
      width = sw * scale
      height = sh * scale
      break
    }
    case 'longest-edge': {
      // Scale so the longest edge equals value, preserving aspect.
      const scale = sw >= sh ? opts.value / sw : opts.value / sh
      width = sw * scale
      height = sh * scale
      break
    }
    case 'width': {
      width = opts.value
      height = opts.keepAspectRatio
        ? width / aspect
        : (opts.secondaryValue ?? sh)
      break
    }
    case 'height': {
      height = opts.value
      width = opts.keepAspectRatio
        ? height * aspect
        : (opts.secondaryValue ?? sw)
      break
    }
  }

  if (opts.preventUpscaling && (width > sw || height > sh)) {
    // Clamp uniformly so we never exceed the source in either dimension.
    const clamp = Math.min(sw / width, sh / height, 1)
    width *= clamp
    height *= clamp
  }

  return {
    width: Math.max(1, Math.round(width)),
    height: Math.max(1, Math.round(height)),
  }
}
