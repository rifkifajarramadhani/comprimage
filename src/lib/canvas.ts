import type { OutputFormat } from '#/types/image.ts'
import type { Dimensions } from './resize.ts'

/** Decode a File/Blob into an ImageBitmap (fast, off-main-thread capable). */
export async function decode(source: Blob): Promise<ImageBitmap> {
  return createImageBitmap(source)
}

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement

function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/** Draw a bitmap into a canvas of the given target size with quality smoothing. */
export function drawToCanvas(
  bitmap: ImageBitmap,
  target: Dimensions,
): AnyCanvas {
  const canvas = createCanvas(target.width, target.height)
  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null
  if (!ctx) throw new Error('Could not get a 2D canvas context.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, target.width, target.height)
  return canvas
}

/** Encode a canvas to a Blob of the requested format/quality. */
export async function canvasToBlob(
  canvas: AnyCanvas,
  format: OutputFormat,
  quality: number,
): Promise<Blob> {
  // PNG is lossless; quality is ignored by the platform for it.
  const q = format === 'image/png' ? undefined : quality

  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: format, quality: q })
  }
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error(`Failed to encode image as ${format}.`)),
      format,
      q,
    )
  })
}

let avifSupport: boolean | null = null

/**
 * Feature-test whether the platform can *encode* AVIF via canvas.
 * Result is cached. WebP/JPEG/PNG are assumed supported in all target browsers.
 */
export async function supportsAvifEncode(): Promise<boolean> {
  if (avifSupport !== null) return avifSupport
  try {
    const canvas = createCanvas(2, 2)
    const blob = await canvasToBlob(canvas, 'image/avif', 0.5)
    avifSupport = blob.type === 'image/avif'
  } catch {
    avifSupport = false
  }
  return avifSupport
}
