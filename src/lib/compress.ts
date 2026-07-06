/** Sensible default quality (0–1) per lossy format. */
export const DEFAULT_QUALITY = 0.8

/** Human label for a quality value, e.g. 0.8 -> "80". */
export function qualityPercent(quality: number): number {
  return Math.round(quality * 100)
}

/**
 * Estimated compression ratio and savings between an original and a result.
 * Positive `savings` means the output is smaller.
 */
export function compressionStats(originalSize: number, newSize: number) {
  const ratio = originalSize > 0 ? newSize / originalSize : 1
  const savings = originalSize - newSize
  const savedPercent = originalSize > 0 ? (savings / originalSize) * 100 : 0
  return { ratio, savings, savedPercent }
}
