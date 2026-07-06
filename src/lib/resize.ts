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

/**
 * The sequence of intermediate sizes for a high-quality **progressive** resize.
 *
 * A single canvas `drawImage` that shrinks by a large factor aliases badly
 * because the browser samples too few source pixels per destination pixel.
 * Halving repeatedly (each step never drops below 50%) keeps every step within
 * the resampler's sweet spot, which suppresses moiré and preserves detail —
 * the same trick pica/browsers use internally.
 *
 * Returns the ordered list of sizes to draw through, **excluding** the source
 * and **including** the final target as the last entry. For upscales or small
 * downscales (≥50%) it returns just `[target]` (a single direct draw). Pure and
 * canvas-free so it can be unit-tested.
 */
export function resizeSteps(
  source: Dimensions,
  target: Dimensions,
): Dimensions[] {
  const steps: Dimensions[] = []
  let { width, height } = source

  // Only downscaling benefits from stepping; stop once halving would overshoot
  // the target in either dimension, then let the caller draw straight to target.
  while (width > target.width * 2 && height > target.height * 2) {
    width = Math.max(target.width, Math.round(width / 2))
    height = Math.max(target.height, Math.round(height / 2))
    steps.push({ width, height })
  }

  const last = steps[steps.length - 1]
  if (
    steps.length === 0 ||
    last.width !== target.width ||
    last.height !== target.height
  ) {
    steps.push({ width: target.width, height: target.height })
  }
  return steps
}
