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
  className,
}: {
  onImage: (image: SourceImage) => void
  className?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onDrop = useCallback(
    async (accepted: Array<File>) => {
      if (accepted.length === 0) return
      const file = accepted[0]
      setError(null)
      if (file.size > MAX_FILE_BYTES) {
        setError('That file is larger than 50 MB.')
        return
      }
      setBusy(true)
      try {
        onImage(await createSourceImage(file))
      } catch {
        setError('Could not read that image. Try a different file.')
      } finally {
        setBusy(false)
      }
    },
    [onImage],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(ACCEPTED_TYPES.map((t) => [t, []])),
    multiple: false,
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
            {isDragActive ? 'Drop it here' : 'Drop an image, or click to browse'}
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
