import { CheckCircle2, Download, Loader2, TriangleAlert, X } from 'lucide-react'
import type { QueueItem } from '#/hooks/useImageQueue.ts'
import { compressionStats } from '#/lib/compress.ts'
import { withExtension } from '#/lib/convert.ts'
import { downloadBlob } from '#/lib/download.ts'
import { formatBytes } from '#/lib/format.ts'
import { Button } from '#/components/ui/button.tsx'

function StatusBadge({ item }: { item: QueueItem }) {
  switch (item.status) {
    case 'done': {
      const { savings } = compressionStats(item.source.size, item.result!.size)
      const smaller = savings > 0
      return (
        <span
          className="mono inline-flex items-center gap-1.5 text-sm"
          style={{ color: smaller ? 'var(--accent-green)' : 'var(--ink)' }}
        >
          <CheckCircle2 className="size-4" />
          {formatBytes(item.source.size)} → {formatBytes(item.result!.size)}
        </span>
      )
    }
    case 'error':
      return (
        <span
          className="inline-flex items-center gap-1.5 text-sm"
          style={{ color: 'var(--accent-red)' }}
        >
          <TriangleAlert className="size-4" />
          {item.error ?? 'Failed'}
        </span>
      )
    default:
      return (
        <span className="text-ash inline-flex items-center gap-1.5 text-sm">
          <Loader2 className="size-4 animate-spin" />
          {item.status === 'processing' ? 'Processing…' : 'Queued'}
        </span>
      )
  }
}

export function BatchList({
  items,
  onRemove,
}: {
  items: Array<QueueItem>
  onRemove: (id: string) => void
}) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li
          key={item.source.id}
          className="surface-card flex items-center gap-4 p-3"
        >
          <img
            src={item.source.url}
            alt=""
            className="size-12 shrink-0 rounded-md object-cover"
            style={{ border: '1px solid var(--hairline)' }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-ink truncate text-sm font-medium">
              {item.source.file.name}
            </p>
            <div className="mt-1">
              <StatusBadge item={item} />
            </div>
          </div>

          {item.status === 'done' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                downloadBlob(
                  item.result!.blob,
                  withExtension(item.source.file.name, item.result!.format),
                )
              }
              aria-label={`Download ${item.source.file.name}`}
            >
              <Download />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.source.id)}
            aria-label={`Remove ${item.source.file.name}`}
          >
            <X />
          </Button>
        </li>
      ))}
    </ul>
  )
}
