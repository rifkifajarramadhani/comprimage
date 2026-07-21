import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw'
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert'
import type { ProcessOptions } from '#/lib/process.ts'
import { useImageProcessor } from '#/hooks/use-image-processor.ts'
import { useImageStore } from '#/stores/image-store.ts'
import { formatBytes } from '#/lib/format.ts'
import { Container } from '#/components/layout/Container.tsx'
import { Dropzone } from '#/components/upload/Dropzone.tsx'
import { BeforeAfter } from '#/components/preview/BeforeAfter.tsx'
import { Stats } from '#/components/statistics/Stats.tsx'
import { DownloadButton } from '#/components/common/DownloadButton.tsx'
import { PrivacyNote } from '#/components/common/PrivacyNote.tsx'
import { Button } from '#/components/ui/button.tsx'

function sourceFormat(type: string): string {
  const value = type.split('/')[1] ?? type
  return value === 'jpeg' ? 'JPG' : value.toUpperCase()
}

export function ToolWorkspace({
  title,
  description,
  command,
  options,
  controls,
  guide,
}: {
  title: string
  description: string
  command: string
  options: ProcessOptions
  controls: React.ReactNode
  guide?: React.ReactNode
}) {
  const source = useImageStore((s) => s.source)
  const setSource = useImageStore((s) => s.setSource)
  const clearSource = useImageStore((s) => s.clearSource)
  const { result, isProcessing, error } = useImageProcessor(source, options)

  return (
    <Container className="py-7 sm:py-9">
      <header className="border-border mb-6 flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-center lg:gap-10">
        {/* The command line is decoration; the sr-only title is the heading's
            real text content, for both screen readers and crawlers. */}
        <h1 className="command-title shrink-0">
          <span className="sr-only">{title}</span>
          <span aria-hidden>
            <span className="command-prompt">$ </span>
            {command}
            <span className="command-caret" />
          </span>
        </h1>
        <p className="page-description max-w-2xl lg:border-l lg:border-border lg:pl-8">
          {description}
        </p>
      </header>

      {!source ? (
        <div className="mx-auto max-w-4xl">
          <Dropzone onImage={setSource} />
        </div>
      ) : (
        <div className="grid items-start lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border-border overflow-hidden border lg:sticky lg:top-[72px] lg:border-r-0">
            <div className="border-border flex items-start gap-3 border-b p-4">
              <img
                src={source.url}
                alt=""
                className="border-border size-12 shrink-0 rounded-sm border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p
                  className="text-foreground truncate text-sm font-semibold"
                  title={source.file.name}
                >
                  {source.file.name}
                </p>
                <p className="text-muted-foreground mono mt-1 text-[0.7rem] leading-5">
                  {source.width} × {source.height} · {sourceFormat(source.type)}{' '}
                  · {formatBytes(source.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5 p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={clearSource}
              >
                <RotateCcw data-icon="inline-start" />
                New image
              </Button>

              <div className="border-border flex flex-col gap-5 border-t pt-5">
                {controls}
              </div>

              <div className="border-border flex flex-col gap-3 border-t pt-5">
                <DownloadButton
                  source={source}
                  result={result}
                  disabled={isProcessing}
                />
                <PrivacyNote compact />
              </div>

              {error && (
                <div
                  role="alert"
                  className="bg-danger-soft text-danger flex items-start gap-2 rounded-sm border border-destructive/30 p-3 text-sm"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden
                  />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-col">
            {result ? (
              <Stats source={source} result={result} />
            ) : (
              <div
                className="skeleton border-border h-[74px] border"
                aria-hidden
              />
            )}
            <BeforeAfter source={source} result={result} />
          </div>
        </div>
      )}

      {guide}
    </Container>
  )
}
