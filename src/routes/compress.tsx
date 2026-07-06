import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { OutputFormat } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { supportsQuality } from '#/lib/compress.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'

export const Route = createFileRoute('/compress')({ component: CompressPage })

function CompressPage() {
  const settings = useSettingsStore.getState()
  const [format, setFormat] = useState<OutputFormat>(settings.defaultFormat)
  const [quality, setQuality] = useState(settings.defaultQuality)

  // Compress keeps the source dimensions (no resize) — just re-encodes.
  const options: ProcessOptions = { encode: { format, quality } }

  return (
    <ToolWorkspace
      eyebrow="Compress"
      title="Compress images"
      description="Shrink file size at the same dimensions. Drag the quality slider and watch the savings update live."
      options={options}
      controls={
        <div className="grid gap-5">
          <FormatSelect value={format} onChange={setFormat} label="Encode as" />
          <CompressControls
            quality={quality}
            onQualityChange={setQuality}
            disabled={!supportsQuality(format)}
          />
        </div>
      }
    />
  )
}
