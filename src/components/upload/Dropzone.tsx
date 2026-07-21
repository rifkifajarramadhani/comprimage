import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import FolderOpen from 'lucide-react/dist/esm/icons/folder-open'
import ImageUp from 'lucide-react/dist/esm/icons/image-up'
import Loader2 from 'lucide-react/dist/esm/icons/loader-circle'
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check'
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
  compact = false,
  className,
}: {
  /** Single-image callback (default mode). */
  onImage?: (image: SourceImage) => void
  /** Multi-image callback, used when `multiple` is set. */
  onImages?: (images: Array<SourceImage>) => void
  multiple?: boolean
  compact?: boolean
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
    onDropRejected: (rejections) => {
      const tooLarge = rejections.some((rejection) =>
        rejection.errors.some(
          (candidate) => candidate.code === 'file-too-large',
        ),
      )
      setError(
        tooLarge
          ? multiple
            ? 'Some files were larger than 50 MB and skipped.'
            : 'That file is larger than 50 MB.'
          : multiple
            ? 'Some files are not supported and were skipped.'
            : 'That file type is not supported. Choose JPG, PNG, WebP, AVIF, or GIF.',
      )
    },
    accept: Object.fromEntries(ACCEPTED_TYPES.map((t) => [t, []])),
    maxSize: MAX_FILE_BYTES,
    multiple,
  })

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        {...getRootProps()}
        aria-busy={busy}
        className={cn(
          compact
            ? 'group relative flex min-h-11 cursor-pointer items-center justify-center rounded-sm border px-4 text-center transition-[background-color,border-color,box-shadow] duration-150 outline-none focus-within:ring-2 focus-within:ring-ring/25'
            : 'group relative flex min-h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-sm border border-dashed px-6 py-12 text-center transition-[background-color,border-color,box-shadow] duration-150 outline-none focus-within:ring-2 focus-within:ring-ring/25',
          isDragActive
            ? 'border-primary bg-brand-soft'
            : 'border-input bg-background hover:border-primary hover:bg-surface',
        )}
      >
        <input {...getInputProps()} aria-label="Upload image" />
        {!compact && (
          <span className="terminal-label absolute top-4 left-4">
            [ input ]
          </span>
        )}
        {!compact && (
          <span className="border-border text-muted-foreground flex size-11 items-center justify-center rounded-sm border">
            {busy ? (
              <Loader2 className="size-6 animate-spin" aria-hidden />
            ) : (
              <ImageUp className="size-6" aria-hidden />
            )}
          </span>
        )}
        {compact ? (
          <span className="text-foreground inline-flex items-center gap-2 text-sm font-medium">
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <FolderOpen className="size-4" aria-hidden />
            )}
            Add more images
          </span>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <p className="text-foreground text-sm font-semibold">
                {isDragActive
                  ? 'Drop images here'
                  : multiple
                    ? 'Drop images here'
                    : 'Drop an image here'}
              </p>
              {!isDragActive && (
                <span className="border-primary text-brand group-hover:bg-brand-soft group-hover:text-brand-ink inline-flex h-10 items-center gap-2 rounded-sm border bg-background px-4 text-sm font-semibold transition-colors">
                  <FolderOpen className="size-4" aria-hidden />
                  Browse files
                </span>
              )}
              <p className="text-muted-foreground text-sm">
                JPG, PNG, WebP, AVIF or GIF · up to 50 MB
              </p>
            </div>
            <p className="text-success flex items-center gap-2 text-xs">
              <ShieldCheck className="text-success size-4" aria-hidden />
              Processed on your device
            </p>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
