import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { OutputFormat } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { supportsQuality } from '#/lib/compress.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'

export const Route = createFileRoute('/convert')({ component: ConvertPage })

function ConvertPage() {
  const settings = useSettingsStore.getState()
  const [format, setFormat] = useState<OutputFormat>(settings.defaultFormat)
  const [quality, setQuality] = useState(settings.defaultQuality)

  const options: ProcessOptions = { encode: { format, quality } }

  return (
    <ToolWorkspace
      eyebrow="Convert"
      title="Convert formats"
      description="Change between JPG, PNG, WebP and AVIF. AVIF appears only when your browser can encode it."
      options={options}
      controls={
        <div className="grid gap-5">
          <FormatSelect value={format} onChange={setFormat} label="Convert to" />
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
