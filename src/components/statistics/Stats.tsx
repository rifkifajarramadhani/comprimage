import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { compressionStats } from '#/lib/compress.ts'
import { formatMeta } from '#/lib/convert.ts'
import { formatBytes } from '#/lib/format.ts'

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="surface-card px-4 py-3">
      <div className="kicker">{label}</div>
      <div
        className="mt-1 text-lg font-medium"
        style={{ color: accent ?? 'var(--ink)' }}
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
  const savingsColor = smaller ? 'var(--accent-green)' : 'var(--accent-red)'

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Dimensions" value={`${result.width} × ${result.height}`} />
      <Stat label="Format" value={formatMeta(result.format).label} />
      <Stat
        label="New size"
        value={formatBytes(result.size)}
        accent={smaller ? 'var(--accent-green)' : undefined}
      />
      <Stat
        label={smaller ? 'Saved' : 'Increased'}
        value={`${Math.abs(savedPercent).toFixed(0)}% · ${formatBytes(Math.abs(savings))}`}
        accent={savingsColor}
      />
    </div>
  )
}
