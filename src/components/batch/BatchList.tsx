import CheckCircle2 from 'lucide-react/dist/esm/icons/circle-check'
import Download from 'lucide-react/dist/esm/icons/download'
import Loader2 from 'lucide-react/dist/esm/icons/loader-circle'
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert'
import X from 'lucide-react/dist/esm/icons/x'
import type { QueueItem } from '#/hooks/use-image-queue.ts'
import { withExtension } from '#/lib/convert.ts'
import { downloadBlob } from '#/lib/download.ts'
import { formatBytes } from '#/lib/format.ts'
import { Button } from '#/components/ui/button.tsx'

function Status({ item }: { item: QueueItem }) {
  if (item.status === 'done') {
    return (
      <span className="text-success inline-flex items-center gap-2 text-xs font-medium">
        <CheckCircle2 className="size-4" aria-hidden /> Done
      </span>
    )
  }
  if (item.status === 'error') {
    return (
      <span
        className="text-danger inline-flex items-center gap-2 text-xs font-medium"
        title={item.error}
      >
        <TriangleAlert className="size-4" aria-hidden /> Error
      </span>
    )
  }
  return (
    <span className="text-muted-foreground inline-flex items-center gap-2 text-xs">
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {item.status === 'processing' ? 'Processing…' : 'Queued'}
    </span>
  )
}

export function BatchList({
  items,
  onRemove,
}: {
  items: Array<QueueItem>
  onRemove: (id: string) => void
}) {
  return (
    <div className="border-border overflow-hidden border">
      <div className="text-muted-foreground border-border hidden min-h-10 grid-cols-[minmax(240px,1fr)_120px_120px_130px_84px] items-center border-b px-3 text-xs md:grid">
        <span>File name</span>
        <span>Source</span>
        <span>Output</span>
        <span>Status</span>
        <span className="sr-only">Actions</span>
      </div>
      <ul aria-label="Batch queue" className="divide-border divide-y">
        {items.map((item) => (
          <li
            key={item.source.id}
            className="grid min-h-16 items-center gap-3 p-3 md:grid-cols-[minmax(240px,1fr)_120px_120px_130px_84px] md:gap-0 md:py-2"
          >
            <div className="flex min-w-0 items-center gap-3">
              <img
                src={item.source.url}
                alt=""
                className="border-border h-11 w-16 shrink-0 rounded-sm border object-cover"
              />
              <p
                className="text-foreground truncate text-sm font-medium"
                title={item.source.file.name}
              >
                {item.source.file.name}
              </p>
            </div>
            <span className="text-muted-foreground mono text-xs">
              <span className="md:hidden">Source: </span>
              {formatBytes(item.source.size)}
            </span>
            <span className="text-muted-foreground mono text-xs">
              <span className="md:hidden">Output: </span>
              {item.result ? formatBytes(item.result.size) : '—'}
            </span>
            <Status item={item} />
            <div className="flex items-center justify-end gap-1">
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
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
