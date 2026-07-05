import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { Layers, Loader2, Package } from 'lucide-react'
import type { OutputFormat } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { compressionStats, supportsQuality } from '#/lib/compress.ts'
import { withExtension } from '#/lib/convert.ts'
import { useSettingsStore } from '#/stores/settingsStore.ts'
import { downloadBlob } from '#/lib/download.ts'
import { formatBytes } from '#/lib/format.ts'
import { zipBlobs } from '#/lib/zip.ts'
import type { ZipEntry } from '#/lib/zip.ts'
import { useImageQueue } from '#/hooks/useImageQueue.ts'
import { Container } from '#/components/layout/Container.tsx'
import { Dropzone } from '#/components/upload/Dropzone.tsx'
import { BatchList } from '#/components/batch/BatchList.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { Button } from '#/components/ui/button.tsx'

export const Route = createFileRoute('/batch')({ component: BatchPage })

function BatchPage() {
  const settings = useSettingsStore.getState()
  const [format, setFormat] = useState<OutputFormat>(settings.defaultFormat)
  const [quality, setQuality] = useState(settings.defaultQuality)
  const [zipping, setZipping] = useState(false)

  const options: ProcessOptions = { encode: { format, quality } }

  const { items, doneCount, errorCount, isProcessing, addSources, remove, clear } =
    useImageQueue(options)

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
    <section className="atmos-glow">
      <Container className="py-12 sm:py-16">
        <header className="mb-10 max-w-2xl">
          <p className="kicker mb-3">Batch</p>
          <h1 className="display-title text-5xl sm:text-6xl">Process in bulk</h1>
          <p className="text-charcoal mt-4 text-lg">
            Drop a whole folder of images, apply one setting to all of them, and
            download the results as a ZIP — every byte stays on your device.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="surface-card h-fit p-6">
            <div className="mb-5 flex items-center justify-between">
              <span className="kicker">Options</span>
              {items.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clear}>
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid gap-5">
              <FormatSelect value={format} onChange={setFormat} label="Convert to" />
              <CompressControls
                quality={quality}
                onQualityChange={setQuality}
                disabled={!supportsQuality(format)}
              />
            </div>

            <div className="mt-6">
              <Button
                size="lg"
                className="w-full"
                disabled={doneCount === 0 || isProcessing || zipping}
                onClick={downloadAll}
              >
                {zipping ? <Loader2 className="animate-spin" /> : <Package />}
                {zipping ? 'Zipping…' : `Download all (${doneCount})`}
              </Button>
            </div>
          </aside>

          <div className="grid content-start gap-4">
            <Dropzone multiple onImages={addSources} />

            {items.length > 0 && (
              <>
                <div className="text-charcoal flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="text-mute size-4" />
                    {doneCount} of {items.length} done
                    {isProcessing && (
                      <Loader2 className="text-mute size-4 animate-spin" />
                    )}
                  </span>
                  {totals.savings > 0 && (
                    <span style={{ color: 'var(--accent-green)' }}>
                      Saved {formatBytes(totals.savings)} (
                      {totals.savedPercent.toFixed(0)}%)
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span style={{ color: 'var(--accent-red)' }}>
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
    </section>
  )
}
