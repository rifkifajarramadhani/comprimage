import type { OutputFormat } from '#/types/image.ts'
import type { Dimensions } from './resize.ts'
import { resizeSteps } from './resize.ts'

/** Decode a File/Blob into an ImageBitmap (fast, off-main-thread capable). */
export async function decode(source: Blob): Promise<ImageBitmap> {
  return createImageBitmap(source)
}

export type AnyCanvas = OffscreenCanvas | HTMLCanvasElement
type AnyCanvasContext =
  CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

function createCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function get2dContext(canvas: AnyCanvas): AnyCanvasContext {
  const ctx = canvas.getContext('2d') as AnyCanvasContext | null
  if (!ctx) throw new Error('Could not get a 2D canvas context.')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  return ctx
}

/**
 * Draw a bitmap into a canvas of the given target size.
 *
 * Large downscales are done **progressively** (see {@link resizeSteps}): each
 * intermediate never shrinks past 50%, which keeps the browser's high-quality
 * smoothing effective and avoids the aliasing/moiré a single big `drawImage`
 * produces. Upscales and small downscales fall through to a single direct draw.
 */
export function drawToCanvas(
  bitmap: ImageBitmap,
  target: Dimensions,
): AnyCanvas {
  const steps = resizeSteps(
    { width: bitmap.width, height: bitmap.height },
    target,
  )

  // Draw through each step (a single entry for upscales/small downscales),
  // feeding each canvas as the source for the next halving pass.
  let src: CanvasImageSource = bitmap
  let canvas = createCanvas(target.width, target.height)
  for (const { width, height } of steps) {
    canvas = createCanvas(width, height)
    get2dContext(canvas).drawImage(src, 0, 0, width, height)
    src = canvas
  }
  return canvas
}

/** Read the full-canvas pixel buffer — the input format the WASM codecs want. */
export function getImageData(canvas: AnyCanvas): ImageData {
  return get2dContext(canvas).getImageData(0, 0, canvas.width, canvas.height)
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
