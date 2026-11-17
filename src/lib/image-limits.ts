/** Shared allocation limits for imports, output canvases and worker tasks. */
export const MAX_FILE_BYTES = 50 * 1024 * 1024
export const MAX_IMAGE_PIXELS = 25_000_000
export const MAX_BATCH_IMAGES = 50
export const MAX_BATCH_PIXELS = 100_000_000
export const IMPORT_CONCURRENCY = 2
export const WORKER_TIMEOUT_MS = 5 * 60 * 1000

export function assertImageDimensions(width: number, height: number): void {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width < 1 ||
    height < 1
  ) {
    throw new Error('Image dimensions are invalid.')
  }
  if (width * height > MAX_IMAGE_PIXELS) {
    throw new Error('Image exceeds the 25 MP pixel limit.')
  }
}
