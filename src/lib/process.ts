import type {
  EncodeOptions,
  ProcessResult,
  ResizeOptions,
  SourceImage,
} from '#/types/image.ts'
import { canvasToBlob, decode, drawToCanvas } from './canvas.ts'
import { computeDimensions } from './resize.ts'

export interface ProcessOptions {
  /** Omit to keep the source dimensions (compress/convert only). */
  resize?: ResizeOptions
  encode: EncodeOptions
}

/**
 * The full client-side pipeline: decode → (resize) → encode → Blob.
 * Shared by the resize, compress, and convert tools. Runs on the main thread
 * today; the boundary is intentionally a plain async fn so a worker can wrap it
 * later without changing callers.
 */
export async function processImage(
  source: SourceImage,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const bitmap = await decode(source.file)
  try {
    const target = options.resize
      ? computeDimensions(
          { width: source.width, height: source.height },
          options.resize,
        )
      : { width: source.width, height: source.height }

    const canvas = drawToCanvas(bitmap, target)
    const blob = await canvasToBlob(
      canvas,
      options.encode.format,
      options.encode.quality,
    )

    return {
      blob,
      url: URL.createObjectURL(blob),
      width: target.width,
      height: target.height,
      size: blob.size,
      format: options.encode.format,
    }
  } finally {
    bitmap.close()
  }
}
