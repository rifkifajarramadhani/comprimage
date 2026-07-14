import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import CheckCircle2 from 'lucide-react/dist/esm/icons/circle-check'
import Images from 'lucide-react/dist/esm/icons/images'
import Layers3 from 'lucide-react/dist/esm/icons/layers-3'
import Loader2 from 'lucide-react/dist/esm/icons/loader-circle'
import Package from 'lucide-react/dist/esm/icons/package'
import TriangleAlert from 'lucide-react/dist/esm/icons/triangle-alert'
import type { EncodeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { compressionStats } from '#/lib/compress.ts'
import { withExtension } from '#/lib/convert.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { downloadBlob } from '#/lib/download.ts'
import { formatBytes } from '#/lib/format.ts'
import { zipBlobs } from '#/lib/zip.ts'
import type { ZipEntry } from '#/lib/zip.ts'
import { useImageQueue } from '#/hooks/use-image-queue.ts'
import { Container } from '#/components/layout/Container.tsx'
import { PageIntro } from '#/components/layout/PageIntro.tsx'
import { PrivacyNote } from '#/components/common/PrivacyNote.tsx'
import { Dropzone } from '#/components/upload/Dropzone.tsx'
import { BatchList } from '#/components/batch/BatchList.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { Button } from '#/components/ui/button.tsx'
import { createSeoHead } from '#/lib/seo.ts'

export const Route = createFileRoute('/batch')({
  component: BatchPage,
  head: () =>
    createSeoHead({
      path: '/batch',
      title: 'Batch Compress and Convert Images | Comprimage',
      description:
        'Compress or convert multiple images with one set of options, then download a ZIP. Every file is processed locally in your browser.',
    }),
})

function BatchPage() {
  const settings = useSettingsStore.getState()
  const [encode, setEncode] = useState<EncodeOptions>({
    format: settings.defaultFormat,
    quality: settings.defaultQuality,
  })
  const [zipping, setZipping] = useState(false)

  const options: ProcessOptions = { encode }

  const {
    items,
    doneCount,
    errorCount,
    isProcessing,
    addSources,
    remove,
    clear,
  } = useImageQueue(options)

  // Aggregate savings across everything that has finished.
  const totals = useMemo(() => {
    let original = 0
    let output = 0
    for (const item of items) {
      if (item.status === 'done' && item.result) {
        original += item.source.size
        output += item.result.size
      }
    }
    return { original, output, ...compressionStats(original, output) }
  }, [items])

  const downloadAll = async () => {
    const entries: Array<ZipEntry> = items
      .filter((it) => it.status === 'done' && it.result)
      .map((it) => ({
        name: withExtension(it.source.file.name, it.result!.format),
        blob: it.result!.blob,
      }))
    if (entries.length === 0) return
    setZipping(true)
    try {
      const zip = await zipBlobs(entries)
      downloadBlob(zip, 'comprimage-batch.zip')
    } finally {
      setZipping(false)
    }
  }

  return (
    <Container className="py-10 sm:py-12">
      <PageIntro
        title="Process images in bulk"
        description="Apply one output setting to a group of images and download the finished files together as a ZIP."
        className="mb-8"
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="surface-subtle h-fit overflow-hidden lg:sticky lg:top-20">
          <div className="border-border flex items-center justify-between border-b px-5 py-4">
            <span className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Layers3 className="text-brand size-4" aria-hidden />
              Batch options
            </span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear all
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-5 p-5">
            <FormatSelect
              value={encode.format}
              onChange={(format) => setEncode((e) => ({ ...e, format }))}
              label="Convert to"
            />
            <CompressControls value={encode} onChange={setEncode} />
            <div className="border-border border-t pt-5">
              <Button
                size="lg"
                className="w-full"
                disabled={doneCount === 0 || isProcessing || zipping}
                onClick={downloadAll}
              >
                {zipping ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Package data-icon="inline-start" />
                )}
                {zipping ? 'Zipping…' : `Download all (${doneCount})`}
              </Button>
            </div>
            <PrivacyNote compact />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <Dropzone multiple onImages={addSources} />

          {items.length === 0 ? (
            <div className="text-muted-foreground flex items-start gap-3 px-2 py-2 text-sm">
              <Images
                className="text-brand mt-0.5 size-5 shrink-0"
                aria-hidden
              />
              <p>
                Add several images at once. They will be processed in parallel
                using the settings on the left.
              </p>
            </div>
          ) : (
            <>
              <div
                role="status"
                className="surface-subtle flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 text-sm"
              >
                <span className="text-foreground inline-flex items-center gap-2 font-medium">
                  <Layers3 className="text-brand size-4" aria-hidden />
                  {doneCount} of {items.length} done
                  {isProcessing && (
                    <Loader2
                      className="text-muted-foreground size-4 animate-spin"
                      aria-hidden
                    />
                  )}
                </span>
                {totals.savings > 0 && (
                  <span className="text-success inline-flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="size-4" aria-hidden />
                    Saved {formatBytes(totals.savings)} (
                    {totals.savedPercent.toFixed(0)}%)
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-danger inline-flex items-center gap-1.5 font-medium">
                    <TriangleAlert className="size-4" aria-hidden />
                    {errorCount} failed
                  </span>
                )}
              </div>
              <BatchList items={items} onRemove={remove} />
            </>
          )}
        </div>
      </div>
    </Container>
  )
}
