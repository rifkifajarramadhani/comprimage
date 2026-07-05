import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { formatBytes } from '#/lib/format.ts'

function Pane({
  label,
  url,
  width,
  height,
  size,
  accent,
}: {
  label: string
  url: string
  width: number
  height: number
  size: number
  accent?: boolean
}) {
  return (
    <figure className="surface-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5">
        <span className="kicker">{label}</span>
        <span
          className="text-sm"
          style={{ color: accent ? 'var(--accent-green)' : 'var(--charcoal)' }}
        >
          {formatBytes(size)}
        </span>
      </div>
      <div
        className="flex items-center justify-center p-3"
        style={{ borderTop: '1px solid var(--hairline)' }}
      >
        <img
          src={url}
          alt={label}
          className="max-h-[360px] w-auto max-w-full rounded-md object-contain"
        />
      </div>
      <figcaption className="text-ash px-4 py-2 text-sm">
        {width} × {height} px
      </figcaption>
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
    <div className="grid gap-4 sm:grid-cols-2">
      <Pane
        label="Original"
        url={source.url}
        width={source.width}
        height={source.height}
        size={source.size}
      />
      {result ? (
        <Pane
          label="Result"
          url={result.url}
          width={result.width}
          height={result.height}
          size={result.size}
          accent={result.size < source.size}
        />
      ) : (
        <div className="surface-card text-ash flex items-center justify-center p-8 text-sm">
          Processing…
        </div>
      )}
    </div>
  )
}
