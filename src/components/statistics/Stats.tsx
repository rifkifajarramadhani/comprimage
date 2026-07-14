import type { ProcessResult, SourceImage } from '#/types/image.ts'
import ArrowDownRight from 'lucide-react/dist/esm/icons/arrow-down-right'
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right'
import FileOutput from 'lucide-react/dist/esm/icons/file-output'
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2'
import ScanSearch from 'lucide-react/dist/esm/icons/scan-search'
import { compressionStats, qualityPercent } from '#/lib/compress.ts'
import { formatMeta } from '#/lib/convert.ts'
import { formatBytes } from '#/lib/format.ts'

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  icon: typeof Maximize2
  tone?: 'success' | 'danger'
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-4 py-3 sm:px-5">
      <span
        className={
          tone === 'success'
            ? 'bg-success-soft text-success flex size-9 shrink-0 items-center justify-center rounded-lg'
            : tone === 'danger'
              ? 'bg-danger-soft text-danger flex size-9 shrink-0 items-center justify-center rounded-lg'
              : 'bg-secondary text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg'
        }
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="text-foreground truncate text-sm font-semibold">
          {value}
        </div>
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
      className="surface-subtle divide-border grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4"
    >
      <Stat
        label="Dimensions"
        value={`${result.width} × ${result.height}`}
        icon={Maximize2}
      />
      <Stat
        label="Format"
        value={formatMeta(result.format).label}
        icon={FileOutput}
      />
      {result.chosenQuality !== undefined && (
        <Stat
          label="Auto quality"
          value={`${qualityPercent(result.chosenQuality)}`}
          icon={ScanSearch}
        />
      )}
      <Stat
        label="New size"
        value={formatBytes(result.size)}
        icon={FileOutput}
      />
      <Stat
        label={smaller ? 'Size reduction' : 'Size change'}
        value={`${Math.abs(savedPercent).toFixed(0)}% · ${formatBytes(Math.abs(savings))}`}
        icon={smaller ? ArrowDownRight : ArrowUpRight}
        tone={smaller ? 'success' : 'danger'}
      />
    </div>
  )
}
