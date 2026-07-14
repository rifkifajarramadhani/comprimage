import ImageIcon from 'lucide-react/dist/esm/icons/image'
import Loader2 from 'lucide-react/dist/esm/icons/loader-circle'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { formatMeta } from '#/lib/convert.ts'
import { formatBytes } from '#/lib/format.ts'

function sourceFormat(type: string): string {
  const value = type.split('/')[1] ?? type
  return value === 'jpeg' ? 'JPG' : value.toUpperCase()
}

function Pane({
  label,
  url,
  width,
  height,
  size,
  format,
}: {
  label: string
  url: string
  width: number
  height: number
  size: number
  format: string
}) {
  return (
    <figure className="min-w-0 overflow-hidden">
      <figcaption className="border-border flex min-h-12 items-center justify-between gap-3 border-b px-4">
        <span className="text-foreground text-sm font-semibold">{label}</span>
        <span className="text-muted-foreground mono truncate text-xs">
          {width} × {height} · {format} · {formatBytes(size)}
        </span>
      </figcaption>
      <div className="bg-surface flex min-h-72 items-center justify-center p-3 sm:min-h-96">
        <img
          src={url}
          alt={`${label} image preview`}
          className="max-h-[560px] w-auto max-w-full rounded-md object-contain"
        />
      </div>
    </figure>
  )
}

export function BeforeAfter({
  source,
  result,
}: {
  source: SourceImage
  result: ProcessResult | null
}) {
  return (
    <section
      aria-label="Image comparison"
      className="surface-subtle overflow-hidden"
    >
      <div className="divide-border grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <Pane
          label="Original"
          url={source.url}
          width={source.width}
          height={source.height}
          size={source.size}
          format={sourceFormat(source.type)}
        />
        {result ? (
          <Pane
            label="Result"
            url={result.url}
            width={result.width}
            height={result.height}
            size={result.size}
            format={formatMeta(result.format).label}
          />
        ) : (
          <div
            role="status"
            className="bg-surface text-muted-foreground flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-sm sm:min-h-96"
          >
            <span className="bg-secondary flex size-11 items-center justify-center rounded-lg">
              <Loader2 className="size-5 animate-spin" aria-hidden />
            </span>
            <span>Preparing result…</span>
            <span className="sr-only">Image processing is in progress.</span>
          </div>
        )}
      </div>
      <div className="border-border text-muted-foreground flex items-center gap-2 border-t px-4 py-3 text-xs">
        <ImageIcon className="size-4" aria-hidden />
        Preview images are contained and shown at the largest comfortable size.
      </div>
    </section>
  )
}
