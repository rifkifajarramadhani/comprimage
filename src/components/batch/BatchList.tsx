import { CheckCircle2, Download, Loader2, TriangleAlert, X } from 'lucide-react'
import type { QueueItem } from '#/hooks/use-image-queue.ts'
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
          className={
            smaller
              ? 'text-success mono inline-flex items-center gap-1.5 text-sm font-medium'
              : 'text-foreground mono inline-flex items-center gap-1.5 text-sm font-medium'
          }
        >
          <CheckCircle2 className="size-4" aria-hidden />
          {formatBytes(item.source.size)} → {formatBytes(item.result!.size)}
        </span>
      )
    }
    case 'error':
      return (
        <span className="text-danger inline-flex items-center gap-1.5 text-sm font-medium">
          <TriangleAlert className="size-4" aria-hidden />
          {item.error ?? 'Failed'}
        </span>
      )
    default:
      return (
        <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden />
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
    <ul
      aria-label="Batch queue"
      className="surface-subtle divide-border overflow-hidden divide-y"
    >
      {items.map((item) => (
        <li
          key={item.source.id}
          className="flex min-h-18 items-center gap-3 p-3 sm:gap-4 sm:px-4"
        >
          <img
            src={item.source.url}
            alt=""
            className="border-border size-12 shrink-0 rounded-md border object-cover"
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-foreground truncate text-sm font-semibold"
              title={item.source.file.name}
            >
              {item.source.file.name}
            </p>
            <div className="mt-1">
              <StatusBadge item={item} />
            </div>
          </div>

          {item.status === 'done' && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                downloadBlob(
                  item.result!.blob,
                  withExtension(item.source.file.name, item.result!.format),
                )
              }
              aria-label={`Download ${item.source.file.name}`}
            >
              <Download aria-hidden />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(item.source.id)}
            aria-label={`Remove ${item.source.file.name}`}
          >
            <X aria-hidden />
          </Button>
        </li>
      ))}
    </ul>
  )
}
