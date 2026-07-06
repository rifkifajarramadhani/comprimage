import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { EncodeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { seo } from '#/lib/site.ts'

export const Route = createFileRoute('/compress')({
  component: CompressPage,
  head: () =>
    seo({
      path: '/compress',
      title: 'Compress images in your browser — Comprimage',
      description:
        'Shrink image file size at full resolution with modern codecs (MozJPEG, WebP, AVIF, JPEG XL) and a target-quality mode that finds the smallest file that still looks right. 100% client-side.',
    }),
})

function CompressPage() {
  const settings = useSettingsStore.getState()
  const [encode, setEncode] = useState<EncodeOptions>({
    format: settings.defaultFormat,
    quality: settings.defaultQuality,
  })

  // Compress keeps the source dimensions (no resize) — just re-encodes.
  const options: ProcessOptions = { encode }

  return (
    <ToolWorkspace
      eyebrow="Compress"
      title="Compress images"
      description="Shrink file size at the same dimensions. Drag the quality slider and watch the savings update live."
      options={options}
      controls={
        <div className="grid gap-5">
          <FormatSelect
            value={encode.format}
            onChange={(format) => setEncode((e) => ({ ...e, format }))}
            label="Encode as"
          />
          <CompressControls value={encode} onChange={setEncode} />
        </div>
      }
    />
  )
}
