import { imageDimensionsFromStream } from 'image-dimensions'
import type { SourceImage } from '#/types/image.ts'
import { decode } from './canvas.ts'
import {
  IMPORT_CONCURRENCY,
  MAX_BATCH_IMAGES,
  MAX_BATCH_PIXELS,
  MAX_FILE_BYTES,
  assertImageDimensions,
} from './image-limits.ts'

export { MAX_FILE_BYTES } from './image-limits.ts'

export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]

interface Metadata {
  width: number
  height: number
  type: string
}
export interface BatchUsage {
  count: number
  pixels: number
}
export interface ImportRejection {
  file: File
  reason: string
}
export interface ImportResult {
  accepted: Array<SourceImage>
  rejected: Array<ImportRejection>
}

async function inspectImage(
  file: File,
  signal?: AbortSignal,
): Promise<Metadata> {
  signal?.throwIfAborted()
  if (file.size > MAX_FILE_BYTES)
    throw new Error('File exceeds the 50 MiB size limit.')
  // Inspect headers before asking the browser to allocate decoded pixels. The
  // abortable stream also stops metadata reads when an import is cancelled.
  const stream = file
    .stream()
    .pipeThrough(new TransformStream<Uint8Array, Uint8Array>(), { signal })
  const metadata = await imageDimensionsFromStream(stream)
  signal?.throwIfAborted()
  if (!metadata)
    throw new Error(
      'Could not read image metadata. Choose a valid JPG, PNG, WebP, AVIF, or GIF.',
    )
  const type = `image/${metadata.type}`
  if (!ACCEPTED_TYPES.includes(type))
    throw new Error(
      'Image format is not supported. Choose JPG, PNG, WebP, AVIF, or GIF.',
    )
  assertImageDimensions(metadata.width, metadata.height)
  return { ...metadata, type }
}

async function decodeSource(
  file: File,
  metadata: Metadata,
  signal?: AbortSignal,
  reserveDecoded?: (pixels: number) => void,
): Promise<SourceImage> {
  signal?.throwIfAborted()
  const bitmap = await decode(file)
  try {
    signal?.throwIfAborted()
    assertImageDimensions(bitmap.width, bitmap.height)
    reserveDecoded?.(bitmap.width * bitmap.height)
    return {
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      url: URL.createObjectURL(file),
      width: bitmap.width,
      height: bitmap.height,
      size: file.size,
      type: metadata.type,
    }
  } finally {
    bitmap.close()
  }
}

/** The caller owns the returned preview URL. */
export async function createSourceImage(
  file: File,
  signal?: AbortSignal,
): Promise<SourceImage> {
  return decodeSource(file, await inspectImage(file, signal), signal)
}

/**
 * Reserve capacity in selection order before decoding, with at most two active
 * imports. Ownership transfers only when the entire helper returns. Cancellation
 * releases all previews, including decodes that finish after the abort.
 */
export async function importImages(
  files: Array<File>,
  existing: BatchUsage = { count: 0, pixels: 0 },
  signal?: AbortSignal,
): Promise<ImportResult> {
  const accepted: Array<SourceImage | undefined> = []
  const rejected: Array<ImportRejection | undefined> = []
  const running = new Set<Promise<void>>()
  const usage = { ...existing }
  const exceedsBudget = (pixels: number) =>
    usage.count >= MAX_BATCH_IMAGES || usage.pixels + pixels > MAX_BATCH_PIXELS
  try {
    for (const [index, file] of files.entries()) {
      signal?.throwIfAborted()
      if (running.size >= IMPORT_CONCURRENCY) await Promise.race(running)
      let metadata: Metadata
      try {
        metadata = await inspectImage(file, signal)
      } catch (error) {
        signal?.throwIfAborted()
        rejected[index] = {
          file,
          reason:
            error instanceof Error
              ? error.message
              : 'Could not read image metadata.',
        }
        continue
      }
      const pixels = metadata.width * metadata.height
      // A failing earlier decode may release capacity. Wait before deciding to
      // skip a later file so that valid files can still use that space.
      if (exceedsBudget(pixels)) await Promise.all(running)
      signal?.throwIfAborted()
      if (exceedsBudget(pixels)) {
        rejected[index] = {
          file,
          reason:
            usage.count >= MAX_BATCH_IMAGES
              ? 'Batch already contains 50 images. Remove an image before adding more.'
              : 'Image would exceed the 100 MP batch pixel limit.',
        }
        continue
      }
      usage.count++
      usage.pixels += pixels
      let reserved = pixels
      const task = decodeSource(file, metadata, signal, (decodedPixels) => {
        if (usage.pixels - reserved + decodedPixels > MAX_BATCH_PIXELS)
          throw new Error(
            'Decoded image would exceed the 100 MP batch pixel limit.',
          )
        usage.pixels += decodedPixels - reserved
        reserved = decodedPixels
      })
        .then((source) => {
          accepted[index] = source
        })
        .catch((error: unknown) => {
          usage.count--
          usage.pixels -= reserved
          rejected[index] = {
            file,
            reason:
              error instanceof Error
                ? error.message
                : 'Could not decode image. Try a different file.',
          }
        })
        .finally(() => running.delete(task))
      running.add(task)
    }
    await Promise.all(running)
    signal?.throwIfAborted()
    return {
      accepted: accepted.filter((source): source is SourceImage => !!source),
      rejected: rejected.filter((item): item is ImportRejection => !!item),
    }
  } catch (error) {
    await Promise.all(running)
    for (const source of accepted) if (source) releaseSourceImage(source)
    throw error
  }
}

export function releaseSourceImage(source: SourceImage): void {
  URL.revokeObjectURL(source.url)
}
