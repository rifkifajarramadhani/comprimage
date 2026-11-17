import { useCallback, useEffect, useRef, useState } from 'react'
import type { FileRejection } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'
import FolderOpen from 'lucide-react/dist/esm/icons/folder-open'
import ImageUp from 'lucide-react/dist/esm/icons/image-up'
import Loader2 from 'lucide-react/dist/esm/icons/loader-circle'
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check'
import type { SourceImage } from '#/types/image.ts'
import {
  ACCEPTED_TYPES,
  MAX_FILE_BYTES,
  importImages,
  releaseSourceImage,
} from '#/lib/source.ts'
import type { BatchUsage, ImportRejection } from '#/lib/source.ts'
import { Button } from '#/components/ui/button.tsx'
import { cn } from '#/lib/utils.ts'

export function Dropzone({
  onImage,
  onImages,
  multiple = false,
  compact = false,
  className,
  existingUsage,
}: {
  /** Single-image callback (default mode). */
  onImage?: (image: SourceImage) => void
  /** Multi-image callback, used when `multiple` is set. */
  onImages?: (images: Array<SourceImage>) => void
  multiple?: boolean
  compact?: boolean
  className?: string
  existingUsage?: BatchUsage
}) {
  const [errors, setErrors] = useState<Array<ImportRejection>>([])
  const [busy, setBusy] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const mountedRef = useRef(false)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  const onDrop = useCallback(
    async (accepted: Array<File>, fileRejections: Array<FileRejection>) => {
      if (controllerRef.current) return
      const initialErrors = fileRejections.map(({ file, errors: reasons }) => ({
        file,
        reason: reasons
          .map(({ code }) =>
            code === 'file-too-large'
              ? 'File exceeds the 50 MiB size limit.'
              : code === 'too-many-files'
                ? 'Choose one image at a time.'
                : 'Choose JPG, PNG, WebP, AVIF, or GIF.',
          )
          .join(' '),
      }))
      setErrors(initialErrors)
      setCancelled(false)
      if (!accepted.length) return
      const controller = new AbortController()
      controllerRef.current = controller
      setBusy(true)
      let owned: Array<SourceImage> = []
      try {
        const result = await importImages(
          accepted,
          existingUsage,
          controller.signal,
        )
        owned = result.accepted
        controller.signal.throwIfAborted()
        setErrors([...initialErrors, ...result.rejected])
        if (owned.length) {
          if (multiple && onImages) {
            onImages(owned)
            owned = []
          } else if (!multiple && onImage) {
            onImage(owned[0])
            owned = owned.slice(1)
          }
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setErrors([
            ...initialErrors,
            {
              file: accepted[0],
              reason:
                error instanceof Error
                  ? error.message
                  : 'Could not import images.',
            },
          ])
      } finally {
        for (const source of owned) releaseSourceImage(source)
        if (controllerRef.current === controller) {
          controllerRef.current = null
          if (mountedRef.current) setBusy(false)
        }
      }
    },
    [existingUsage, multiple, onImage, onImages],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(ACCEPTED_TYPES.map((type) => [type, []])),
    maxSize: MAX_FILE_BYTES,
    multiple,
    disabled: busy,
  })

  const cancelImport = () => {
    controllerRef.current?.abort()
    setCancelled(true)
    // Stay locked until any uninterruptible browser decode has been cleaned up.
  }

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
            {busy
              ? cancelled
                ? 'Cancelling import…'
                : 'Reading images…'
              : 'Add more images'}
          </span>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2">
              <p className="text-foreground text-sm font-semibold">
                {busy
                  ? cancelled
                    ? 'Cancelling import…'
                    : 'Reading images…'
                  : isDragActive
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
                JPG, PNG, WebP, AVIF or GIF · 50 MiB and 25 MP per image
              </p>
            </div>
            <p className="text-success flex items-center gap-2 text-xs">
              <ShieldCheck className="text-success size-4" aria-hidden />
              Processed on your device
            </p>
          </>
        )}
      </div>
      {multiple && (
        <p className="text-muted-foreground text-xs">
          Up to 50 loaded images and 100 MP per batch. Two images are read at a
          time.
        </p>
      )}
      {busy && (
        <Button
          variant="outline"
          size="sm"
          onClick={cancelImport}
          disabled={cancelled}
        >
          Cancel import
        </Button>
      )}
      {cancelled && (
        <p role="status" className="text-muted-foreground text-sm">
          {busy
            ? 'Cancelling import. Waiting for the current images to finish reading.'
            : 'Import cancelled. No new images were added.'}
        </p>
      )}
      {errors.length > 0 && (
        <ul role="alert" className="text-danger space-y-1 text-sm">
          {errors.map(({ file, reason }, index) => (
            <li key={`${index}-${file.name}`} className="break-words">
              {file.name}: {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
