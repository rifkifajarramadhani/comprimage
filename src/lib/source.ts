import type { SourceImage } from '#/types/image.ts'
import { decode } from './canvas.ts'

export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]

/** Max input size we'll attempt (guards against decoding absurd files). */
export const MAX_FILE_BYTES = 50 * 1024 * 1024 // 50 MB

/** Decode a File into a SourceImage with intrinsic dimensions + preview URL. */
export async function createSourceImage(file: File): Promise<SourceImage> {
  const bitmap = await decode(file)
  const source: SourceImage = {
    id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
    file,
    url: URL.createObjectURL(file),
    width: bitmap.width,
    height: bitmap.height,
    size: file.size,
    type: file.type,
  }
  bitmap.close()
  return source
}

/** Revoke the object URLs held by a SourceImage. */
export function releaseSourceImage(source: SourceImage): void {
  URL.revokeObjectURL(source.url)
}
