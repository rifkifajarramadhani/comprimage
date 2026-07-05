import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { ImageUp, Loader2 } from 'lucide-react'
import type { SourceImage } from '#/types/image.ts'
import {
  ACCEPTED_TYPES,
  MAX_FILE_BYTES,
  createSourceImage,
} from '#/lib/source.ts'
import { cn } from '#/lib/utils.ts'

export function Dropzone({
  onImage,
  onImages,
  multiple = false,
  className,
}: {
  /** Single-image callback (default mode). */
  onImage?: (image: SourceImage) => void
  /** Multi-image callback, used when `multiple` is set. */
  onImages?: (images: Array<SourceImage>) => void
  multiple?: boolean
  className?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onDrop = useCallback(
    async (accepted: Array<File>) => {
      if (accepted.length === 0) return
      setError(null)
      const withinLimit = accepted.filter((f) => f.size <= MAX_FILE_BYTES)
      if (withinLimit.length < accepted.length) {
        setError(
          multiple
            ? 'Some files were larger than 50 MB and skipped.'
            : 'That file is larger than 50 MB.',
        )
      }
      if (withinLimit.length === 0) return

      setBusy(true)
      try {
        const files = multiple ? withinLimit : withinLimit.slice(0, 1)
        const images = await Promise.all(files.map((f) => createSourceImage(f)))
        if (multiple) {
          onImages?.(images)
        } else {
          onImage?.(images[0])
        }
      } catch {
        setError('Could not read that image. Try a different file.')
      } finally {
        setBusy(false)
      }
    },
    [multiple, onImage, onImages],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(ACCEPTED_TYPES.map((t) => [t, []])),
    multiple,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl px-6 py-14 text-center transition-colors',
          isDragActive ? 'bg-surface-elevated' : 'bg-surface-card',
          className,
        )}
        style={{
          border: `1px dashed ${
            isDragActive ? 'rgba(255,255,255,0.4)' : 'var(--hairline-strong)'
          }`,
        }}
      >
        <input {...getInputProps()} aria-label="Upload image" />
        {busy ? (
          <Loader2 className="text-mute size-7 animate-spin" />
        ) : (
          <ImageUp className="text-mute size-7" />
        )}
        <div>
          <p className="text-ink font-medium">
            {isDragActive
              ? 'Drop it here'
              : multiple
                ? 'Drop images, or click to browse'
                : 'Drop an image, or click to browse'}
          </p>
          <p className="text-ash mt-1 text-sm">
            JPG, PNG, WebP, AVIF or GIF · processed on your device
          </p>
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm" style={{ color: 'var(--accent-red)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
