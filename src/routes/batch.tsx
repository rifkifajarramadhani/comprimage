import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import Images from 'lucide-react/dist/esm/icons/images'
import Loader2 from 'lucide-react/dist/esm/icons/loader-circle'
import Package from 'lucide-react/dist/esm/icons/package'
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
import { ToolGuide } from '#/components/layout/ToolGuide.tsx'
import { createSeoHead } from '#/lib/seo.ts'
import type { FaqEntry } from '#/lib/seo.ts'

const STEPS = [
  {
    title: 'Add the whole set at once',
    body: 'Drop in or select as many images as you need — JPG, PNG, WebP, AVIF, and GIF are accepted, up to 50 MB each. There is no file-count limit, because there is no upload and no server-side queue to wait in.',
  },
  {
    title: 'Set the output once, apply it to everything',
    body: 'One format, quality, and effort setting is applied across the entire set. Each file is processed independently, so a mix of sizes and source formats is fine.',
  },
  {
    title: 'Download the results as a single ZIP',
    body: 'The queue reports progress per file plus the combined size saving across the batch. When it finishes, one button packages every finished image into a ZIP that is assembled in the browser.',
  },
]

const NOTES = [
  {
    title: 'Files are processed in parallel',
    body: 'A pool of Web Workers runs the codecs off the main thread, so the interface stays responsive and several images encode at the same time. The queue fills each worker as it becomes free rather than processing strictly one at a time.',
  },
  {
    title: 'Concurrency is tunable',
    body: 'The worker count defaults to the number of logical cores your device reports and can be changed in Settings, up to a maximum of eight. Raising it speeds up large batches; lowering it leaves more CPU for everything else while a slow AVIF batch runs.',
  },
  {
    title: 'Encoding cost varies by format',
    body: 'A batch encoded to WebP finishes far faster than the same batch encoded to AVIF at high effort. For a large set, it is worth testing your settings on a single image first on the compress page.',
  },
  {
    title: 'Nothing leaves the machine',
    body: 'Batch mode has exactly the same privacy properties as the single-image tools: every file is decoded, encoded, and zipped locally. No batch is ever uploaded, and closing the tab discards everything.',
  },
]

const FAQ: Array<FaqEntry> = [
  {
    question: 'How many images can I process at once?',
    answer:
      'There is no fixed limit on the number of files, only on their individual size, which is capped at 50 MB. Because processing happens on your own machine, the practical ceiling for a very large batch is your available memory.',
  },
  {
    question: 'Are batch-processed images uploaded to a server?',
    answer:
      'No. Every image in the batch is decoded, re-encoded, and packaged into the ZIP entirely inside your browser. Nothing is transmitted, so there is no size quota and no waiting in a queue behind other users.',
  },
  {
    question: 'Can I apply different settings to different images?',
    answer:
      'Batch mode deliberately applies one set of options to the whole group, which is what makes it fast and predictable. For per-image tuning, use the compress, resize, or convert tools individually.',
  },
  {
    question: 'Why is my batch processing slowly?',
    answer:
      'AVIF and JPEG XL at high effort are computationally expensive, and very large source images take longer to decode. Try WebP, lower the effort setting, or raise the worker concurrency in Settings.',
  },
]

export const Route = createFileRoute('/batch')({
  component: BatchPage,
  head: () =>
    createSeoHead({
      path: '/batch',
      title: 'Batch Compress and Convert Images | Comprimage',
      description:
        'Compress or convert multiple images with one set of options, then download a ZIP. Every file is processed locally in your browser.',
      breadcrumb: 'Batch processing',
      faq: FAQ,
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
    <Container className="py-7 sm:py-9">
      <PageIntro
        title="Batch compress and convert images"
        command="comprimage batch"
        description="Apply one output setting to a group of images and download the finished files together as a ZIP."
        className="mb-6"
      />

      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="border-border h-fit border p-5 lg:sticky lg:top-[72px] lg:border-r-0">
          <div className="flex items-center justify-between">
            <span className="terminal-label">[ batch options ]</span>
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clear}>
                Clear all
              </Button>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-5">
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

        <div className="border-border flex min-w-0 flex-col border p-4 sm:p-5">
          {items.length === 0 && <Dropzone multiple onImages={addSources} />}

          {items.length === 0 ? (
            <div className="text-muted-foreground mt-4 flex items-start gap-3 px-2 py-2 text-sm">
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
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-foreground text-lg font-semibold">
                    Process images in bulk
                  </h2>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Queue updates as each local worker finishes.
                  </p>
                </div>
                <Dropzone multiple compact onImages={addSources} />
              </div>
              <BatchList items={items} onRemove={remove} />
              <div
                role="status"
                className="border-border mt-0 flex flex-wrap items-center gap-x-5 gap-y-2 border-x border-b px-4 py-3 text-xs"
              >
                <span className="text-foreground mono">
                  {items.length} files ·{' '}
                  {formatBytes(
                    items.reduce((sum, item) => sum + item.source.size, 0),
                  )}
                  {doneCount > 0 && ` → ${formatBytes(totals.output)}`}
                </span>
                {totals.savings > 0 && (
                  <span className="text-success">
                    · {totals.savedPercent.toFixed(0)}% smaller
                  </span>
                )}
                {isProcessing && (
                  <span className="text-muted-foreground inline-flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    {doneCount} of {items.length} done
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-danger">· {errorCount} failed</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <ToolGuide
        heading="How to compress or convert many images at once"
        intro="Processing a folder one file at a time is the slowest part of preparing images for the web. Batch mode applies a single set of options across the whole set in parallel, then hands back one ZIP — without any of it leaving your machine."
        steps={STEPS}
        notes={NOTES}
        faq={FAQ}
      />
    </Container>
  )
}
