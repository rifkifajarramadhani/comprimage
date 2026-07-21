import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { compressionStats, qualityPercent } from '#/lib/compress.ts'
import { formatMeta } from '#/lib/convert.ts'
import { formatBytes } from '#/lib/format.ts'
import { cn } from '#/lib/utils.ts'

function Stat({
  label,
  value,
  success = false,
}: {
  label: string
  value: string
  success?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center gap-1.5 px-4 py-4 text-center">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div
        className={cn(
          'mono truncate text-sm font-medium',
          success ? 'text-success' : 'text-foreground',
        )}
      >
        {value}
      </div>
    </div>
  )
}

export function Stats({
  source,
  result,
}: {
  source: SourceImage
  result: ProcessResult
}) {
  const { savedPercent, savings } = compressionStats(source.size, result.size)
  const smaller = savings > 0

  return (
    <div
      aria-label="Processing result"
      className="surface-subtle divide-border grid grid-cols-2 divide-x divide-y overflow-hidden sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0"
    >
      <Stat label="Dimensions" value={`${result.width} × ${result.height}`} />
      <Stat label="Format" value={formatMeta(result.format).label} />
      {result.chosenQuality !== undefined ? (
        <Stat
          label="Auto quality"
          value={`${qualityPercent(result.chosenQuality)}`}
        />
      ) : (
        <Stat label="Quality" value="manual" />
      )}
      <Stat label="New size" value={formatBytes(result.size)} />
      <Stat
        label={smaller ? 'Size reduction' : 'Size change'}
        value={`${Math.abs(savedPercent).toFixed(0)}% · ${formatBytes(Math.abs(savings))}`}
        success={smaller}
      />
    </div>
  )
}
