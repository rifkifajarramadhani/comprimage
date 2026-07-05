import type {
  EncodeOptions,
  OutputFormat,
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

/** The pipeline input, decoupled from `SourceImage` so it can cross a worker boundary. */
export interface ProcessInput {
  file: File
  width: number
  height: number
}

/** The pipeline output without an object URL — the URL is minted by the caller. */
export interface ProcessedBlob {
  blob: Blob
  width: number
  height: number
  format: OutputFormat
}

/**
 * The full client-side pipeline: decode → (resize) → encode → Blob.
 * Returns a raw Blob (no object URL) so it can run inside a Web Worker — blob
 * URLs minted in a worker are not reliably usable from the main document, so
 * the caller mints the URL on the main thread.
 */
export async function processToBlob(
  input: ProcessInput,
  options: ProcessOptions,
): Promise<ProcessedBlob> {
  const bitmap = await decode(input.file)
  try {
    const target = options.resize
      ? computeDimensions(
          { width: input.width, height: input.height },
          options.resize,
        )
      : { width: input.width, height: input.height }

    const canvas = drawToCanvas(bitmap, target)
    const blob = await canvasToBlob(
      canvas,
      options.encode.format,
      options.encode.quality,
    )

    return {
      blob,
      width: target.width,
      height: target.height,
      format: options.encode.format,
    }
  } finally {
    bitmap.close()
  }
}

/**
 * Main-thread convenience wrapper around {@link processToBlob} that mints the
 * result object URL. Used as the fallback when a Web Worker is unavailable.
 */
export async function processImage(
  source: SourceImage,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const { blob, width, height, format } = await processToBlob(
    { file: source.file, width: source.width, height: source.height },
    options,
  )
  return {
    blob,
    url: URL.createObjectURL(blob),
    width,
    height,
    size: blob.size,
    format,
  }
}
