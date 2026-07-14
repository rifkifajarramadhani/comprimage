import FileImage from 'lucide-react/dist/esm/icons/file-image'
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw'
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert'
import type { ProcessOptions } from '#/lib/process.ts'
import { useImageProcessor } from '#/hooks/use-image-processor.ts'
import { useImageStore } from '#/stores/image-store.ts'
import { formatBytes } from '#/lib/format.ts'
import { Container } from '#/components/layout/Container.tsx'
import { PageIntro } from '#/components/layout/PageIntro.tsx'
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
  options,
  controls,
}: {
  title: string
  description: string
  options: ProcessOptions
  controls: React.ReactNode
}) {
  const source = useImageStore((s) => s.source)
  const setSource = useImageStore((s) => s.setSource)
  const clearSource = useImageStore((s) => s.clearSource)
  const { result, isProcessing, error } = useImageProcessor(source, options)

  return (
    <Container className="py-10 sm:py-12">
      <PageIntro title={title} description={description} className="mb-8" />

      {!source ? (
        <div className="mx-auto max-w-4xl">
          <Dropzone onImage={setSource} />
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="surface-subtle overflow-hidden lg:sticky lg:top-20">
            <div className="border-border flex items-start gap-3 border-b p-5">
              <span className="bg-brand-soft text-brand flex size-10 shrink-0 items-center justify-center rounded-lg">
                <FileImage className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className="text-foreground truncate text-sm font-semibold"
                  title={source.file.name}
                >
                  {source.file.name}
                </p>
                <p className="text-muted-foreground mono mt-1 text-xs">
                  {source.width} × {source.height} · {sourceFormat(source.type)}{' '}
                  · {formatBytes(source.size)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 p-5">
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
                  className="bg-danger-soft text-danger flex items-start gap-2 rounded-lg p-3 text-sm"
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

          <div className="flex min-w-0 flex-col gap-4">
            {result ? (
              <Stats source={source} result={result} />
            ) : (
              <div className="skeleton h-[74px] rounded-xl" aria-hidden />
            )}
            <BeforeAfter source={source} result={result} />
          </div>
        </div>
      )}
    </Container>
  )
}
